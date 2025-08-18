import React, { useRef } from 'react';
import { Retool } from '@tryretool/custom-component-support';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  rectIntersection
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Column, Task, columnOrder as defaultColumnOrder } from './components/types';
import KanbanColumn from './components/KanbanColumn';
import { 
  generateTaskId, 
  updateTaskInArray, 
  removeTaskFromArray, 
  addTaskToArray, 
  addTaskToArrayAtIndex,
  reorderTasksInArray
} from './utils/taskUtils';
import './KanbanBoard.css';

// Register customizable properties as Retool state

function isColumn(obj: any): obj is Column {
  return obj && typeof obj === 'object' && 'id' in obj && 'title' in obj && 'color' in obj && 'taskIds' in obj;
}

function KanbanBoard() {
  // Customizable columns (sidebar editable)
  const [columnsArrRaw = [
    { id: 'backlog', title: 'Backlog', color: '#e53e3e' },
    { id: 'todo', title: 'Todo', color: '#ecc94b' },
    { id: 'inProgress', title: 'In Progress', color: '#4299e1' },
    { id: 'done', title: 'Done', color: '#48bb78' }
  ]] = Retool.useStateArray({
    name: "columns",
    label: "Columns",
    initialValue: [
      { id: 'backlog', title: 'Backlog', color: '#e53e3e' },
      { id: 'todo', title: 'Todo', color: '#ecc94b' },
      { id: 'inProgress', title: 'In Progress', color: '#4299e1' },
      { id: 'done', title: 'Done', color: '#48bb78' }
    ],
    inspector: "text",
    description: "Array of column definitions for the Kanban board"
  });
  // Ensure columnsArr is always a Column[] and filter out nulls
  const columnsArr: Column[] = Array.isArray(columnsArrRaw)
    ? (columnsArrRaw.filter(col => col && typeof col === 'object' && 'id' in col && 'title' in col && 'color' in col) as Column[])
    : [
        { id: 'backlog', title: 'Backlog', color: '#e53e3e' },
        { id: 'todo', title: 'Todo', color: '#ecc94b' },
        { id: 'inProgress', title: 'In Progress', color: '#4299e1' },
        { id: 'done', title: 'Done', color: '#48bb78' }
      ];

  // Appearance section customizations
  const [backgroundColor = '#f7fafc'] = Retool.useStateString({
    name: 'backgroundColor',
    label: 'Background Color',
    initialValue: '#f7fafc',
    inspector: 'text',
    description: 'Background color of the Kanban board (hex, rgb, or color name)',
    // section: 'Appearance',
  });

  const [fontFamily = "Inter, sans-serif"] = Retool.useStateString({
    name: "fontFamily",
    label: "Font Family",
    initialValue: "Inter, sans-serif",
    inspector: "text",
    description: "Font family for the board (Appearance)",
    // section: 'Appearance',
  });

  const [boardTitle = "Kanban Board"] = Retool.useStateString({
    name: "boardTitle",
    label: "Board Title",
    initialValue: "Kanban Board",
    inspector: "text",
    description: "Title displayed at the top of the board (Appearance)",
    // section: 'Appearance',
  });

  // New: Layout and font size customizations
  const [columnGap = 14] = Retool.useStateNumber({
    name: 'columnGap',
    label: 'Column Gap (px)',
    initialValue: 14,
    inspector: 'text',
    description: 'Gap between columns in pixels',
    // section: 'Appearance',
  });

  const [containerPadding = 12] = Retool.useStateNumber({
    name: 'containerPadding',
    label: 'Container Padding (px)',
    initialValue: 12,
    inspector: 'text',
    description: 'Padding around the board in pixels',
    // section: 'Appearance',
  });

  const [columnPadding = 10] = Retool.useStateNumber({
    name: 'columnPadding',
    label: 'Column Padding (px)',
    initialValue: 10,
    inspector: 'text',
    description: 'Padding inside each column in pixels',
    // section: 'Appearance',
  });

  const [headerMarginBottom = 10] = Retool.useStateNumber({
    name: 'headerMarginBottom',
    label: 'Header Margin Bottom (px)',
    initialValue: 10,
    inspector: 'text',
    description: 'Space below the column header in pixels',
    // section: 'Appearance',
  });

  const [fontSize = 18] = Retool.useStateNumber({
    name: 'fontSize',
    label: 'Font Size (px)',
    initialValue: 18,
    inspector: 'text',
    description: 'Font size for tasks and columns in pixels',
    // section: 'Appearance',
  });

  const [taskCardMargin = 8] = Retool.useStateNumber({
    name: 'taskCardMargin',
    label: 'Task Card Margin (px)',
    initialValue: 8,
    inspector: 'text',
    description: 'Margin below each task card in pixels',
    // section: 'Appearance',
  });

  const [taskTextAttribute = 'description'] = Retool.useStateString({
    name: 'taskTextAttribute',
    label: 'Task Text Attribute',
    initialValue: 'description',
    inspector: 'text',
    description: 'Task attribute to display below the task heading',
    // section: 'Appearance',
  });

  // Centralized tasks array
  const [tasksRaw = [], setTasks] = Retool.useStateArray({
    name: 'tasks',
    initialValue: [],
    label: 'Tasks',
    inspector: 'text',
    description: 'All tasks for the Kanban board'
  });
  // Filter out nulls and ensure type
  const tasks: Task[] = Array.isArray(tasksRaw)
    ? (tasksRaw.filter((task): task is Task => !!task && typeof task === 'object' && 'id' in task && 'content' in task && 'columnId' in task) as Task[])
    : [];

  const containerRef = useRef<HTMLDivElement>(null);

  // State to store the last task involved in an event
  const [lastTaskEvent, setLastTaskEvent] = Retool.useStateObject({
    name: 'lastTaskEvent',
    initialValue: {},
    inspector: 'hidden',
    description: 'The last task involved in an event (edit, create, click)'
  });

  // Register event callbacks for Retool sidebar
  const onEditEvent = Retool.useEventCallback({ name: 'onEdit' });
  const onCreateEvent = Retool.useEventCallback({ name: 'onCreate' });
  const onClickEvent = Retool.useEventCallback({ name: 'onClick' });

  const columnOrder: string[] = columnsArr.map(col => col.id);
  const columns: Record<string, Column> = Object.fromEntries(
    columnsArr.map(col => [col.id, col])
  );

  // Helper to get tasks for a column, sorted by order or insertion
  const getColumnTasks = (columnId: string): Task[] =>
    tasks.filter((task: Task) => task.columnId === columnId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  // Handle task update
  const handleTaskUpdate = (taskId: string, newContent: string) => {
    const newTasks = tasks.map(task =>
      task.id === taskId ? { ...task, content: newContent } : task
    );
    setTasks(newTasks);
    const updatedTask = newTasks.find(task => task.id === taskId);
    if (updatedTask) setLastTaskEvent({ ...updatedTask, content: newContent });
    onEditEvent();
  };

  // Handle drag end (move task between columns or reorder)
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const [fromColId, fromTaskIdxStr] = activeId.split('-');
    const fromTaskIdx = Number(fromTaskIdxStr);
    const [toColId, toTaskIdxStr] = overId.split('-');
    const toTaskIdx = toColId ? Number(toTaskIdxStr) : undefined;
    const activeTask = getColumnTasks(fromColId)[fromTaskIdx];
    if (!activeTask) return;
    if (!toColId || fromColId === toColId) {
      // Reorder within same column
      const colTasks = getColumnTasks(fromColId);
      const reordered = [...colTasks];
      const [moved] = reordered.splice(fromTaskIdx, 1);
      reordered.splice(toTaskIdx ?? reordered.length, 0, moved);
      const newTasks = [
        ...tasks.filter(t => t.columnId !== fromColId),
        ...reordered.map((t, i) => ({ ...t, order: i }))
      ];
      setTasks(newTasks);
    } else {
      // Move to another column
      const newTasks = tasks.map(task =>
        task.id === activeTask.id
          ? { ...task, columnId: toColId, order: toTaskIdx ?? 0 }
          : task.columnId === toColId && toTaskIdx !== undefined && task.order !== undefined && task.order >= toTaskIdx
            ? { ...task, order: (task.order ?? 0) + 1 }
            : task
      );
      setTasks(newTasks);
    }
  };

  // Handle add task
  const handleAddTask = (columnId: string) => {
    const newTaskId = generateTaskId();
    const colTasks = getColumnTasks(columnId);
    const newTask: Task = {
      id: newTaskId,
      content: 'New task',
      columnId,
      logs: [{ user: 'AI Collections Agent', message: '' }],
      order: colTasks.length
    };
    const newTasks = [...tasks, newTask];
    setTasks(newTasks);
    setLastTaskEvent(newTask);
    onCreateEvent();
  };

  // Enhanced: handle task click and trigger event
  const handleTaskClick = (task: Task) => {
    setLastTaskEvent(task);
    onClickEvent();
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  return (
    <div 
      ref={containerRef}
      className="kanban-container"
      style={{
        width: '100%',
        overflowX: 'hidden',
        fontFamily: fontFamily || 'inherit',
        background: backgroundColor,
        gap: `${columnGap}px`,
        padding: `${containerPadding}px`,
      }}
    >
      <h2 style={{ fontFamily: fontFamily || 'inherit', marginBottom: 16, fontSize: fontSize + 4 }}>{boardTitle}</h2>
      <DndContext sensors={sensors} collisionDetection={rectIntersection} onDragEnd={handleDragEnd}>
        <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
          {columnOrder.map((colId: string) => {
            const col = columns[colId];
            const colTasks = getColumnTasks(colId);
            return (
              <KanbanColumn
                key={col.id}
                column={col}
                tasks={colTasks.map((task, idx) => ({ ...task, idx }))}
                allColId={col.id}
                width={100}
                onAddTask={handleAddTask}
                onTaskUpdate={handleTaskUpdate}
                onTaskClick={handleTaskClick}
                fontFamily={fontFamily}
                columnPadding={columnPadding}
                headerMarginBottom={headerMarginBottom}
                fontSize={fontSize}
                taskCardMargin={taskCardMargin}
                taskTextAttribute={taskTextAttribute}
              />
            );
          })}
        </SortableContext>
      </DndContext>
    </div>
  );
}

export default KanbanBoard; 
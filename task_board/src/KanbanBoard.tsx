import React, { useRef, useState } from 'react';
import { Retool } from '@tryretool/custom-component-support';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  closestCorners,
  DragOverlay
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
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);

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

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeId = String(active.id);
    const [fromColId, fromTaskIdxStr] = activeId.split('-');
    const fromTaskIdx = Number(fromTaskIdxStr);
    const task = getColumnTasks(fromColId)[fromTaskIdx];
    setActiveTask(task || null);
  };

  // Handle drag over
  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) {
      setOverColumnId(null);
      return;
    }
    
    const overId = String(over.id);
    // Check if hovering over a column or a task
    const isOverColumn = !overId.includes('-');
    const columnId = isOverColumn ? overId : overId.split('-')[0];
    setOverColumnId(columnId);
  };

  // Handle drag end (move task between columns or reorder)
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    setOverColumnId(null);
    const { active, over } = event;
    if (!over) return;
    
    const activeId = String(active.id);
    const overId = String(over.id);
    
    // Parse the active task ID (format: "columnId-taskIdx")
    const [fromColId, fromTaskIdxStr] = activeId.split('-');
    const fromTaskIdx = Number(fromTaskIdxStr);
    
    // Get the active task
    const activeTask = getColumnTasks(fromColId)[fromTaskIdx];
    if (!activeTask) return;
    
    // Check if dropping on a column or a task
    const isDroppingOnColumn = !overId.includes('-');
    const toColId = isDroppingOnColumn ? overId : overId.split('-')[0];
    const toTaskIdx = isDroppingOnColumn ? undefined : Number(overId.split('-')[1]);
    
    if (fromColId === toColId) {
      // Reorder within same column
      const colTasks = getColumnTasks(fromColId);
      const reordered = [...colTasks];
      const [moved] = reordered.splice(fromTaskIdx, 1);
      const insertIndex = toTaskIdx !== undefined ? toTaskIdx : reordered.length;
      reordered.splice(insertIndex, 0, moved);
      
      // Update tasks with new ordering
      const newTasks = [
        ...tasks.filter(t => t.columnId !== fromColId),
        ...reordered.map((t, i) => ({ ...t, order: i }))
      ];
      setTasks(newTasks);
    } else {
      // Move to another column
      const targetColTasks = getColumnTasks(toColId);
      let insertIndex: number;
      
      if (toTaskIdx !== undefined) {
        // Dropping on a specific task
        insertIndex = toTaskIdx;
      } else {
        // Dropping on the column - add to the end
        insertIndex = targetColTasks.length;
      }
      
      // Create new tasks array with the moved task
      const newTasks = tasks.map(task => {
        if (task.id === activeTask.id) {
          return { ...task, columnId: toColId, order: insertIndex };
        }
        // Shift tasks in the target column if needed
        if (task.columnId === toColId && task.order !== undefined && task.order >= insertIndex) {
          return { ...task, order: (task.order ?? 0) + 1 };
        }
        return task;
      });
      
      // Reorder tasks in the target column to ensure proper ordering
      const updatedTasks = newTasks.filter(task => task.columnId === toColId)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((task, index) => ({ ...task, order: index }));
      
      const finalTasks = [
        ...newTasks.filter(task => task.columnId !== toColId),
        ...updatedTasks
      ];
      
      setTasks(finalTasks);
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
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCorners} 
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
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
                isDragOver={overColumnId === col.id}
              />
            );
          })}
        </SortableContext>
        <DragOverlay>
          {activeTask ? (
            <div 
              className="kanban-task dragging-overlay"
              style={{
                '--task-border-color': columns[activeTask.columnId]?.color || '#000',
                borderLeft: `4px solid var(--task-border-color)`,
                background: '#fff',
                fontFamily: fontFamily || 'inherit',
                fontSize: fontSize,
                transform: 'rotate(5deg)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
              } as React.CSSProperties}
            >
              <div className="task-drag-handle">
                <div className="drag-handle-dots">
                  <span className="drag-handle-dot" />
                  <span className="drag-handle-dot" />
                </div>
                <div className="drag-handle-dots">
                  <span className="drag-handle-dot" />
                  <span className="drag-handle-dot" />
                </div>
                <div className="drag-handle-dots">
                  <span className="drag-handle-dot" />
                  <span className="drag-handle-dot" />
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <span className="task-content" style={{ fontFamily: fontFamily || 'inherit', fontSize: fontSize }}>
                  {activeTask.content}
                </span>
                {activeTask.logs && activeTask.logs.length > 0 && (
                  <ul className="task-logs-list" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    {activeTask.logs.map((log, idx) => (
                      <li key={idx} style={{ fontSize: fontSize - 3, color: '#888', marginTop: 2, wordBreak: 'break-word' }}>
                        {log.message}
                      </li>
                    ))}
                  </ul>
                )}
                {taskTextAttribute && activeTask[taskTextAttribute] && (
                  <span className="task-text-attribute" style={{ fontSize: fontSize - 2, color: '#6b7280', marginTop: 2, wordBreak: 'break-word' }}>
                    {activeTask[taskTextAttribute]}
                  </span>
                )}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

export default KanbanBoard; 
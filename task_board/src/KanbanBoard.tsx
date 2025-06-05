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
import { Column, Task, columnOrder } from './components/types';
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

function KanbanBoard() {
  // Define task state for each column
  const [backlogTasks = [], setBacklogTasks] = Retool.useStateArray({
    name: "backlogTasks",
    initialValue: [],
    label: "Backlog Tasks",
    inspector: "text",
    description: "Array of tasks in the backlog column"
  });

  const [todoTasks = [], setTodoTasks] = Retool.useStateArray({
    name: "todoTasks",
    initialValue: [],
    label: "Todo Tasks",
    inspector: "text",
    description: "Array of tasks in the todo column"
  });

  const [inProgressTasks = [], setInProgressTasks] = Retool.useStateArray({
    name: "inProgressTasks",
    initialValue: [],
    label: "In Progress Tasks",
    inspector: "text",
    description: "Array of tasks in the in progress column"
  });

  const [doneTasks = [], setDoneTasks] = Retool.useStateArray({
    name: "doneTasks",
    initialValue: [],
    label: "Done Tasks",
    inspector: "text",
    description: "Array of tasks in the done column"
  });

  // Column definitions with task IDs
  const columns: Record<string, Column> = {
    backlog: {
      id: 'backlog',
      title: 'Backlog',
      color: '#e53e3e',
      taskIds: backlogTasks.map((task: any) => task.id),
    },
    todo: {
      id: 'todo',
      title: 'Todo',
      color: '#ecc94b',
      taskIds: todoTasks.map((task: any) => task.id),
    },
    inProgress: {
      id: 'inProgress',
      title: 'In Progress',
      color: '#4299e1',
      taskIds: inProgressTasks.map((task: any) => task.id),
    },
    done: {
      id: 'done',
      title: 'Done',
      color: '#48bb78',
      taskIds: doneTasks.map((task: any) => task.id),
    },
  };

  // Combine all tasks into a single record
  const tasks: Record<string, Task> = {
    ...Object.fromEntries(backlogTasks.map((task: any) => [task.id, task])),
    ...Object.fromEntries(todoTasks.map((task: any) => [task.id, task])),
    ...Object.fromEntries(inProgressTasks.map((task: any) => [task.id, task])),
    ...Object.fromEntries(doneTasks.map((task: any) => [task.id, task])),
  };
  
  // Get container dimensions from Retool
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper function to get tasks array and setter based on column ID
  const getColumnTasks = (columnId: string): [any[], (tasks: any[]) => void] => {
    switch (columnId) {
      case 'backlog':
        return [backlogTasks, setBacklogTasks];
      case 'todo':
        return [todoTasks, setTodoTasks];
      case 'inProgress':
        return [inProgressTasks, setInProgressTasks];
      case 'done':
        return [doneTasks, setDoneTasks];
      default:
        throw new Error(`Unknown column ID: ${columnId}`);
    }
  };

  const handleTaskUpdate = (taskId: string, newContent: string) => {
    // Find which column contains the task
    for (const colId of columnOrder) {
      const [tasks, setTasks] = getColumnTasks(colId);
      if (tasks.some((task: any) => task.id === taskId)) {
        setTasks(updateTaskInArray(tasks, taskId, newContent));
        break;
      }
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }, // Not to trigger a drag unless the user moves the pointer at least 5 pixels
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Extract the column and task indices
    const [fromColId, fromTaskIdxStr] = activeId.split('-');
    const fromTaskIdx = Number(fromTaskIdxStr);

    // Check if dropping directly on a column
    if (overId.indexOf('-') === -1) {
      // Dropping on an empty column
      const toColId = overId;
      const fromCol = columns[fromColId];
      
      if (fromColId !== toColId) {
        const taskId = fromCol.taskIds[fromTaskIdx];
        const task = tasks[taskId];

        // Get source and target arrays and their setters
        const [fromTasks, setFromTasks] = getColumnTasks(fromColId);
        const [toTasks, setToTasks] = getColumnTasks(toColId);

        // Remove from source array and add to target array
        setFromTasks(removeTaskFromArray(fromTasks, taskId));
        setToTasks(addTaskToArray(toTasks, task));
      }
    } else {
      // Dropping on another task
      const [toColId, toTaskIdxStr] = overId.split('-');
      const toTaskIdx = Number(toTaskIdxStr);

      if (fromColId === toColId) {
        // Reorder within the same column
        const [tasks, setTasks] = getColumnTasks(fromColId);
        setTasks(reorderTasksInArray(tasks, fromTaskIdx, toTaskIdx));
      } else {
        // Move between columns
        const taskId = columns[fromColId].taskIds[fromTaskIdx];
        const task = tasks[taskId];

        // Get source and target arrays and their setters
        const [fromTasks, setFromTasks] = getColumnTasks(fromColId);
        const [toTasks, setToTasks] = getColumnTasks(toColId);

        // Remove from source array and add to target array at specific index
        setFromTasks(removeTaskFromArray(fromTasks, taskId));
        setToTasks(addTaskToArrayAtIndex(toTasks, task, toTaskIdx));
      }
    }
  };

  const handleAddTask = (columnId: string) => {
    const newTaskId = generateTaskId();
    const newTask: Task = {
      id: newTaskId,
      content: 'New task',
    };

    // Get the tasks array and setter for the specified column
    const [tasks, setTasks] = getColumnTasks(columnId);
    setTasks(addTaskToArray(tasks, newTask));
  };

  return (
    <div 
      ref={containerRef}
      className="kanban-container"
      style={{
        width: '100%',
        overflowX: 'hidden' // Prevent horizontal scrolling
      }}
    >
      <DndContext sensors={sensors} collisionDetection={rectIntersection} onDragEnd={handleDragEnd}>
        <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
          {columnOrder.map((colId: string) => {
            const col = columns[colId];
            return (
              <KanbanColumn
                key={col.id}
                column={col}
                tasks={col.taskIds.map((tid: string, idx: number) => ({ ...tasks[tid], idx }))}
                allColId={col.id}
                width={100}
                onAddTask={handleAddTask}
                onTaskUpdate={handleTaskUpdate}
              />
            );
          })}
        </SortableContext>
      </DndContext>
    </div>
  );
}

export default KanbanBoard; 
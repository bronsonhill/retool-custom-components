import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Column, Task } from './types';
import KanbanTask from './KanbanTask';

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  allColId: string;
  width: string | number;
  onAddTask: (columnId: string) => void;
  onTaskUpdate: (taskId: string, newContent: string) => void;
  onTaskClick?: (task: Task) => void;
  fontFamily?: string;
  columnPadding?: number;
  headerMarginBottom?: number;
  fontSize?: number;
  taskCardMargin?: number;
  taskTextAttribute?: string;
  isDragOver?: boolean;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  tasks,
  allColId,
  width,
  onAddTask,
  onTaskUpdate,
  onTaskClick,
  fontFamily,
  columnPadding = 10,
  headerMarginBottom = 10,
  fontSize = 18,
  taskCardMargin = 8,
  taskTextAttribute = 'description',
  isDragOver = false,
}) => {
  const { setNodeRef: setDroppableRef } = useDroppable({
    id: allColId
  });

  const handleAddClick = () => {
    onAddTask(column.id);
  };

  return (
    <div 
      className={`kanban-column ${isDragOver ? 'drag-over' : ''}`} 
      style={{ 
        width, 
        minWidth: 'auto', 
        fontFamily: fontFamily || 'inherit', 
        padding: columnPadding
      }}
    >
      <div className="column-header" style={{ marginBottom: headerMarginBottom }}>
        <span className="column-color-dot" style={{ background: column.color }} />
        <span className="column-title" style={{ fontSize }}>{column.title}</span>
        <span className="column-task-count">{tasks.length}</span>
        <div className="column-header-right">
          <button className="add-task-button" onClick={handleAddClick}>+</button>
        </div>
      </div>
      <SortableContext items={tasks.map((t: Task) => `${allColId}-${t.idx}`)} strategy={verticalListSortingStrategy}>
        <div 
          ref={setDroppableRef}
          className={`tasks-container ${tasks.length === 0 ? 'tasks-container-empty' : ''}`}
        >
          {tasks.map((task: Task, idx: number) => (
            <KanbanTask 
              key={task.id} 
              task={task} 
              colId={allColId} 
              idx={idx} 
              columnColor={column.color}
              onTaskUpdate={onTaskUpdate}
              onTaskClick={onTaskClick}
              fontFamily={fontFamily}
              fontSize={fontSize}
              taskTextAttribute={taskTextAttribute}
              style={{ marginBottom: idx !== tasks.length - 1 ? taskCardMargin : 0 }}
            />
          ))}
          {tasks.length === 0 && (
            <div className="empty-column-text">
              Drop tasks here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
};

export default KanbanColumn; 
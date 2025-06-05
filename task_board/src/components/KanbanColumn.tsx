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
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  tasks,
  allColId,
  width,
  onAddTask,
  onTaskUpdate,
}) => {
  const { setNodeRef: setDroppableRef } = useDroppable({
    id: allColId
  });

  const handleAddClick = () => {
    onAddTask(column.id);
  };

  return (
    <div className="kanban-column" style={{ width, minWidth: 'auto' }}>
      <div className="column-header">
        <span className="column-color-dot" style={{ background: column.color }} />
        <span className="column-title">{column.title}</span>
        <span className="column-task-count">{column.taskIds.length}</span>
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
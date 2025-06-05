import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from './types';
import DragHandle from './DragHandle';

interface KanbanTaskProps {
  task: Task;
  colId: string;
  idx: number;
  columnColor: string;
  onTaskUpdate: (taskId: string, newContent: string) => void;
}

const KanbanTask: React.FC<KanbanTaskProps> = ({
  task,
  colId,
  idx,
  columnColor,
  onTaskUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.content);
  const inputRef = useRef<HTMLInputElement>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `${colId}-${idx}` });
  
  const containerStyle = useMemo(() => ({
    transform: CSS.Transform.toString(transform),
    transition,
    '--task-border-color': columnColor,
    borderLeft: `4px solid var(--task-border-color)`,
    background: '#fff',
  } as React.CSSProperties), [transform, transition, columnColor]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditValue(task.content);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue.trim() !== task.content) {
      onTaskUpdate(task.id, editValue.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(task.content);
    }
  };
  
  return (
    <div 
      ref={setNodeRef} 
      className={`kanban-task ${isDragging ? 'dragging' : ''}`}
      style={containerStyle}
      {...attributes}
      {...(isEditing ? {} : listeners)}
      onDoubleClick={handleDoubleClick}
    >
      <DragHandle />
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="task-edit-input"
        />
      ) : (
        <span className="task-content">{task.content}</span>
      )}
    </div>
  );
};

export default KanbanTask; 
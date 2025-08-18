import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from './types';
import DragHandle, { DragHandleProps } from './DragHandle';

interface KanbanTaskProps {
  task: Task;
  colId: string;
  idx: number;
  columnColor: string;
  onTaskUpdate: (taskId: string, newContent: string) => void;
  onTaskClick?: (task: Task) => void;
  fontFamily?: string;
  fontSize?: number;
  taskTextAttribute?: string;
  style?: React.CSSProperties;
}

const KanbanTask: React.FC<KanbanTaskProps> = ({
  task,
  colId,
  idx,
  columnColor,
  onTaskUpdate,
  onTaskClick,
  fontFamily,
  fontSize = 18,
  taskTextAttribute = 'description',
  style = {},
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
    fontFamily: fontFamily || 'inherit',
    fontSize: fontSize,
    ...style,
  } as React.CSSProperties), [transform, transition, columnColor, fontFamily, fontSize, style]);

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

  const handleClick = (e: React.MouseEvent) => {
    if (!isEditing && onTaskClick) {
      onTaskClick(task);
    }
  };
  
  return (
    <div 
      ref={setNodeRef} 
      className={`kanban-task ${isDragging ? 'dragging' : ''}`}
      style={containerStyle}
      onDoubleClick={handleDoubleClick}
      onClick={handleClick}
    >
      <DragHandle listeners={listeners} attributes={attributes} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="task-edit-input"
            style={{ fontFamily: fontFamily || 'inherit', fontSize: fontSize }}
          />
        ) : (
          <>
            <span className="task-content" style={{ fontFamily: fontFamily || 'inherit', fontSize: fontSize }}>{task.content}</span>
            {task.logs && task.logs.length > 0 && (
              <ul className="task-logs-list" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {task.logs.map((log, idx) => (
                  <li key={idx} style={{ fontSize: fontSize - 3, color: '#888', marginTop: 2, wordBreak: 'break-word' }}>
                    {log.message}
                  </li>
                ))}
              </ul>
            )}
            {taskTextAttribute && task[taskTextAttribute] && (
              <span className="task-text-attribute" style={{ fontSize: fontSize - 2, color: '#6b7280', marginTop: 2, wordBreak: 'break-word' }}>{task[taskTextAttribute]}</span>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default KanbanTask; 
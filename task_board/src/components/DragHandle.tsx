import React from 'react';

export interface DragHandleProps {
  listeners?: any;
  attributes?: any;
}

const DragHandle: React.FC<DragHandleProps> = ({ listeners = {}, attributes = {} }) => {
  return (
    <div className="task-drag-handle" {...listeners} {...attributes}>
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
  );
};

export default DragHandle; 
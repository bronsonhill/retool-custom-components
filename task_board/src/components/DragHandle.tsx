import React from 'react';

const DragHandle: React.FC = () => {
  return (
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
  );
};

export default DragHandle; 
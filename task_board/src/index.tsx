import KanbanBoard from './KanbanBoard'
import { Retool } from '@tryretool/custom-component-support';

export const TaskBoard = () => {
  Retool.useComponentSettings({
    defaultHeight: 50,
    defaultWidth: 20,
  });

  return <KanbanBoard />;
};
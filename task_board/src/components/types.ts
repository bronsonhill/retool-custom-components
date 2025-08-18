export interface Column {
  id: string;
  title: string;
  color: string;
  // Removed taskIds: string[];
  [key: string]: any;
}

export interface Task {
  id: string;
  content: string;
  columnId: string;
  logs: { user: string; message: string }[];
  order?: number;
  [key: string]: any;
}

export const columnOrder: string[] = ['backlog', 'todo', 'inProgress', 'done']; 
export interface Column {
  id: string;
  title: string;
  color: string;
  taskIds: string[];
}

export interface Task {
  id: string;
  content: string;
  idx?: number;
  [key: string]: any; // Add index signature to make it compatible with SerializableObject
}

export const columnOrder: string[] = ['backlog', 'todo', 'inProgress', 'done']; 
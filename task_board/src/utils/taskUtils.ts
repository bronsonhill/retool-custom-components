import { Task } from '../components/types';

/**
 * Generates a unique task ID
 */
export const generateTaskId = (): string => {
  return Math.random().toString(36).substring(2, 10);
};

/**
 * Updates a task in an array and returns the new array
 */
export const updateTaskInArray = (tasks: any[], taskId: string, newContent: string): Task[] => {
  return tasks.map(task => 
    task.id === taskId ? { ...task, content: newContent } : task
  );
};

/**
 * Removes a task from an array by ID
 */
export const removeTaskFromArray = (tasks: any[], taskId: string): Task[] => {
  return tasks.filter(task => task.id !== taskId);
};

/**
 * Adds a task to an array
 */
export const addTaskToArray = (tasks: any[], task: Task): Task[] => {
  return [...tasks, task];
};

/**
 * Adds a task to an array at a specific index
 */
export const addTaskToArrayAtIndex = (tasks: any[], task: Task, index: number): Task[] => {
  const newTasks = [...tasks];
  newTasks.splice(index, 0, task);
  return newTasks;
};

/**
 * Reorders tasks within an array
 */
export const reorderTasksInArray = (tasks: any[], fromIndex: number, toIndex: number): Task[] => {
  const result = [...tasks];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}; 
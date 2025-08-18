# Kanban Task Board Custom Component for Retool

A customizable Kanban board React component for use in Retool, supporting dynamic columns, font and title customization, and event handlers for task actions.

## Features
- **Customizable Columns:** Pass your own columns array to control the board structure and appearance.
- **Custom Font:** Set the font family for the board, columns, and tasks.
- **Custom Board Title:** Set the board title via prop.
- **Event Handlers:** Respond to `onEdit`, `onCreate`, and `onClick` events for tasks, which can trigger Retool queries or scripts.
- **Drag-and-Drop:** Move tasks between columns or reorder within a column.

## Usage in Retool

### Props
| Prop         | Type      | Description |
|--------------|-----------|-------------|
| `columns`    | `Column[]`| Array of column definitions (id, title, color, taskIds) |
| `fontFamily` | `string`  | Font family for the board, columns, and tasks |
| `boardTitle` | `string`  | Title displayed at the top of the board |
| `onEdit`     | `function`| Called when a task is edited (also triggers Retool event) |
| `onCreate`   | `function`| Called when a task is created (also triggers Retool event) |
| `onClick`    | `function`| Called when a task is clicked (also triggers Retool event) |

### Event Triggers
- `window.Retool.trigger('onEdit', { task })` — when a task is edited
- `window.Retool.trigger('onCreate', { task })` — when a task is created
- `window.Retool.trigger('onClick', { task })` — when a task is clicked

You can attach Retool queries or scripts to these events in the Retool editor.

### Example Column Definition
```js
[
  { id: 'backlog', title: 'Backlog', color: '#e53e3e', taskIds: [] },
  { id: 'todo', title: 'Todo', color: '#ecc94b', taskIds: [] },
  { id: 'inProgress', title: 'In Progress', color: '#4299e1', taskIds: [] },
  { id: 'done', title: 'Done', color: '#48bb78', taskIds: [] }
]
```

### Example Usage in Retool
```jsx
<TaskBoard
  columns={columns}
  fontFamily="Inter, sans-serif"
  boardTitle="My Project Board"
  onEdit={(task) => {/* handle edit */}}
  onCreate={(task) => {/* handle create */}}
  onClick={(task) => {/* handle click */}}
/>
```

## Types
```ts
interface Column {
  id: string;
  title: string;
  color: string;
  taskIds: string[];
}

interface Task {
  id: string;
  content: string;
  columnId: string;
  logs: { user: string; message: string }[];
  order?: number;
  [key: string]: any;
}
```
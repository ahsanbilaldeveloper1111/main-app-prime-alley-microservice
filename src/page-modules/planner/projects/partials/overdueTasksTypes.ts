import type { CSSProperties } from 'react';

export type OverdueTaskRow = {
  id: number | string;
  title: string;
  priority: string;
  assignee: string;
  dueDate: string;
};

/** Subset of planner tab styles consumed by overdue task widgets */
export type OverdueTasksUiStyles = {
  card?: CSSProperties;
  cardHeader?: CSSProperties;
  cardTitle?: CSSProperties;
  link?: CSSProperties;
  tableWrapper?: CSSProperties;
  table?: CSSProperties;
  th?: CSSProperties;
  td?: CSSProperties;
  badge?: CSSProperties;
};

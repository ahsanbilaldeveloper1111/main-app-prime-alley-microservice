import type { CSSProperties } from 'react';

export function overduePriorityBadgeStyle(
  priority: string,
): Pick<CSSProperties, 'backgroundColor' | 'color'> {
  if (priority === 'High') {
    return { backgroundColor: '#FEE2E2', color: '#991B1B' };
  }
  if (priority === 'Medium') {
    return { backgroundColor: '#FEF3C7', color: '#92400E' };
  }
  return { backgroundColor: '#E0E7FF', color: '#3730A3' };
}

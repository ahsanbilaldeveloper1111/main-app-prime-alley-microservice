import type { CSSProperties } from "react";

/** Layout shell styles used by Work Planner dashboard header + page container. */
export const workPlannerDashboardLayoutStyles: {
  container: CSSProperties;
  header: CSSProperties;
  headerInner: CSSProperties;
  headerContent: CSSProperties;
  headerLeft: CSSProperties;
  dropdown: CSSProperties;
  headerRight: CSSProperties;
} = {
  container: {
    backgroundColor: "#F4F7FA",
    minHeight: "100vh",
    paddingBottom: "2rem",
  },
  header: {
    backgroundColor: "#fff",
    borderBottom: "1px solid #E5E9F2",
    padding: "1rem 0",
  },
  headerInner: { margin: "0 auto", padding: "0 1.5rem" },
  headerContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "1rem",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: "1rem" },
  dropdown: { position: "relative", display: "inline-block" },
  headerRight: { display: "flex", gap: "0.5rem", flexWrap: "wrap" },
};

export const WORK_PLANNER_STAT_CARDS_GLOBAL_CSS = `
  .stat-card {
    border: none;
    border-radius: 12px;
    padding: 1.25rem 1.5rem;
    transition: transform 0.2s, box-shadow 0.2s;
    min-height: 120px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    flex-shrink: 0;
  }

  .stat-number {
    font-size: 2rem;
    font-weight: 700;
    margin: 0.5rem 0 0.25rem 0;
  }

  .stat-label {
    font-size: 0.875rem;
    color: #6B7280;
    font-weight: 500;
    margin: 0;
  }
`;

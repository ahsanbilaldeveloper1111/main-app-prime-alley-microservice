import React from 'react';
import BoardView from '../../dashboard/BoardView';

interface BoardTabProps {
  selectedProject: any;
  hierarchyDataExtensions?: any[];
  statuses: any[];
  boardTasks: any[];
  loadingBoardTasks: boolean;
  labels: any[];
  boardSearchTerm: string;
  setBoardSearchTerm: (term: string) => void;
  boardSelectedAssignee: string;
  setBoardSelectedAssignee: (assignee: string) => void;
  boardSelectedPriority: string;
  setBoardSelectedPriority: (priority: string) => void;
  boardSelectedLabel: string;
  setBoardSelectedLabel: (label: string) => void;
  boardSelectedStatus: string;
  setBoardSelectedStatus: (status: string) => void;
  showCompletedTasks: boolean;
  setShowCompletedTasks: (show: boolean) => void;
  onCreateTask: (statusId: number | null) => void;
  getAllBoardAssignees: () => string[];
  getAllBoardPriorities: () => string[];
  getTasksByStatus: (statusId: string | number | null) => any[];
  recentActivity: any[];
  loadingActivities: boolean;
  overdueTasks: any[];
  loadingOverdue: boolean;
  onViewOverdue: () => void;
  styles: any;
  onTaskStatusChange?: () => void;
  onTaskClick?: (task: any) => void | Promise<void>;
}

const BoardTab: React.FC<BoardTabProps> = ({
  selectedProject,
  hierarchyDataExtensions,
  statuses,
  boardTasks,
  loadingBoardTasks,
  labels,
  boardSearchTerm,
  setBoardSearchTerm,
  boardSelectedAssignee,
  setBoardSelectedAssignee,
  boardSelectedPriority,
  setBoardSelectedPriority,
  boardSelectedLabel,
  setBoardSelectedLabel,
  boardSelectedStatus,
  setBoardSelectedStatus,
  showCompletedTasks,
  setShowCompletedTasks,
  onCreateTask,
  getAllBoardAssignees,
  getAllBoardPriorities,
  getTasksByStatus,
  recentActivity,
  loadingActivities,
  overdueTasks,
  loadingOverdue,
  onViewOverdue,
  styles,
  onTaskStatusChange,
  onTaskClick,
}) => {
  return (
    <>
      <BoardView
        selectedProject={selectedProject}
        hierarchyDataExtensions={hierarchyDataExtensions}
        statuses={statuses}
        boardTasks={boardTasks}
        loadingBoardTasks={loadingBoardTasks}
        labels={labels}
        boardSearchTerm={boardSearchTerm}
        setBoardSearchTerm={setBoardSearchTerm}
        boardSelectedAssignee={boardSelectedAssignee}
        setBoardSelectedAssignee={setBoardSelectedAssignee}
        boardSelectedPriority={boardSelectedPriority}
        setBoardSelectedPriority={setBoardSelectedPriority}
        boardSelectedLabel={boardSelectedLabel}
        setBoardSelectedLabel={setBoardSelectedLabel}
        boardSelectedStatus={boardSelectedStatus}
        setBoardSelectedStatus={setBoardSelectedStatus}
        showCompletedTasks={showCompletedTasks}
        setShowCompletedTasks={setShowCompletedTasks}
        onClearFilters={() => {
          setBoardSearchTerm('');
          setBoardSelectedAssignee('All Assignees');
          setBoardSelectedPriority('All Priorities');
          setBoardSelectedLabel('All Labels');
          setBoardSelectedStatus('All Statuses');
          setShowCompletedTasks(false);
        }}
        onCreateTask={onCreateTask}
        getAllBoardAssignees={getAllBoardAssignees}
        getAllBoardPriorities={getAllBoardPriorities}
        getTasksByStatus={getTasksByStatus}
        onTaskStatusChange={onTaskStatusChange}
        onTaskClick={onTaskClick}
      />
      
      {/* Bottom Row - Recent Activity & Overdue Tasks */}
      {/* <div style={{...styles.grid, ...styles.gridTwo, marginTop: '1.5rem'}}>
        <RecentActivitySection
          activities={recentActivity}
          loading={loadingActivities}
          projectId={selectedProject?.id}
          hierarchyExtensions={hierarchyDataExtensions}
          styles={styles}
        />
        
        <OverdueTasksSection
          tasks={overdueTasks}
          loading={loadingOverdue}
          onViewAll={onViewOverdue}
          styles={styles}
          showViewAll={true}
        />
      </div> */}
    </>
  );
};

export default BoardTab;

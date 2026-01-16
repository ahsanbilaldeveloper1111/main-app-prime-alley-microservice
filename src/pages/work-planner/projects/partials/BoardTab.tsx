import React from 'react';
import BoardView from '../dashboard/BoardView';
import RecentActivitySection from './RecentActivitySection';
import OverdueTasksSection from './OverdueTasksSection';

interface BoardTabProps {
  selectedProject: any;
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
  onViewActivity: () => void;
  onViewOverdue: () => void;
  styles: any;
}

const BoardTab: React.FC<BoardTabProps> = ({
  selectedProject,
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
  onViewActivity,
  onViewOverdue,
  styles
}) => {
  return (
    <>
      <BoardView
        selectedProject={selectedProject}
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
        showCompletedTasks={showCompletedTasks}
        setShowCompletedTasks={setShowCompletedTasks}
        onClearFilters={() => {
          setBoardSearchTerm('');
          setBoardSelectedAssignee('All Assignees');
          setBoardSelectedPriority('All Priorities');
          setBoardSelectedLabel('All Labels');
          setShowCompletedTasks(false);
        }}
        onCreateTask={onCreateTask}
        getAllBoardAssignees={getAllBoardAssignees}
        getAllBoardPriorities={getAllBoardPriorities}
        getTasksByStatus={getTasksByStatus}
      />
      
      {/* Bottom Row - Recent Activity & Overdue Tasks */}
      <div style={{...styles.grid, ...styles.gridTwo, marginTop: '1.5rem'}}>
        <RecentActivitySection
          activities={recentActivity}
          loading={loadingActivities}
          onViewAll={onViewActivity}
          styles={styles}
        />
        
        <OverdueTasksSection
          tasks={overdueTasks}
          loading={loadingOverdue}
          onViewAll={onViewOverdue}
          styles={styles}
          showViewAll={true}
        />
      </div>
    </>
  );
};

export default BoardTab;

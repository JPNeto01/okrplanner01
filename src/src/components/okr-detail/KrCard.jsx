import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import KrCardHeader from './KrCardHeader';
import KrCardContent from './KrCardContent';
import { calculateKrProgress } from '@/lib/okrUtils';

const KrCard = ({
  kr,
  objectiveId,
  objectiveResponsible,
  objectiveCoordinatorScrumMaster,
  allUsers,
  currentUser,
  onTaskStatusChange,
  onOpenAssignModal,
  onOpenDirectAddTaskModal,
  onDeleteKr,
  onEditTask,
  onOpenEditKrDescriptionModal,
  onOpenEditKrTitleModal,
  onOpenEditKrDueDateModal
}) => {
  const [isTasksExpanded, setIsTasksExpanded] = useState(false);
  const krProgress = calculateKrProgress(kr.tasks || []);

  const canManageThisKr = currentUser.group === 'admin' ||
                        (currentUser.group === 'product_owner' && currentUser.id === objectiveResponsible) ||
                        (currentUser.group === 'scrum_master' && currentUser.id === objectiveCoordinatorScrumMaster) ||
                        (currentUser.group === 'scrum_master' && currentUser.id === kr.responsible_id);

  const toggleTasks = () => setIsTasksExpanded(!isTasksExpanded);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="h-full" 
    >
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm h-full flex flex-col">
        <CardHeader>
          <KrCardHeader 
            title={kr.title} 
            status={kr.status} 
            progress={krProgress}
            canManageKr={canManageThisKr}
            onOpenEditKrTitleModal={() => onOpenEditKrTitleModal(kr)}
            isTasksExpanded={isTasksExpanded}
            onToggleTasks={toggleTasks}
          />
        </CardHeader>
        <CardContent className="flex-grow flex flex-col">
          <div className="flex-grow">
            <KrCardContent
              kr={kr}
              allUsers={allUsers}
              currentUser={currentUser}
              objectiveResponsible={objectiveResponsible}
              objectiveCoordinatorScrumMaster={objectiveCoordinatorScrumMaster}
              onTaskStatusChange={(taskId, newStatus) => onTaskStatusChange(kr.id, taskId, newStatus)}
              onOpenAssignModal={() => onOpenAssignModal(kr)}
              onOpenDirectAddTaskModal={() => onOpenDirectAddTaskModal(kr)}
              onDeleteKr={() => onDeleteKr(kr.id)}
              onEditTask={(task) => onEditTask(task, kr.id)}
              onOpenEditKrDescriptionModal={onOpenEditKrDescriptionModal}
              onOpenEditKrDueDateModal={onOpenEditKrDueDateModal}
              canManageKr={canManageThisKr}
              isTasksExpanded={isTasksExpanded}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default KrCard;
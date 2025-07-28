import React from 'react';
import { motion } from 'framer-motion';
import TaskDetailItem from '@/components/okr-detail/TaskDetailItem';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';

const TaskList = ({ 
  tasks, 
  krId, 
  objectiveId, 
  allUsers, 
  currentUser, 
  onTaskStatusChange, 
  canManageKr, 
  objectiveResponsible, 
  krScrumMaster, 
  objectiveCoordinatorScrumMaster, 
  onEditTask
}) => {
  if (!tasks || tasks.length === 0) {
    return <p className="text-xs text-muted-foreground text-center py-2">Nenhuma tarefa atribuída a este KR.</p>;
  }

  const sortedTasks = [...tasks].sort((a, b) => {
    const statusAIsDone = a.status === 'Concluído';
    const statusBIsDone = b.status === 'Concluído';

    if (statusAIsDone && !statusBIsDone) return 1; 
    if (!statusAIsDone && statusBIsDone) return -1; 

    const dateA = a.due_date ? new Date(a.due_date) : null;
    const dateB = b.due_date ? new Date(b.due_date) : null;
    
    if (dateA && dateB) {
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA - dateB; 
      }
    } else if (dateA) {
      return -1; 
    } else if (dateB) {
      return 1;  
    }
    
    return a.title.localeCompare(b.title);
  });


  return (
    <div className="space-y-3">
      {sortedTasks.map((task, index) => {
        const canEditThisSpecificTask = 
          currentUser.group === 'admin' ||
          (currentUser.group === 'product_owner' && currentUser.id === objectiveResponsible) ||
          (currentUser.group === 'scrum_master' && currentUser.id === objectiveCoordinatorScrumMaster) ||
          (currentUser.group === 'scrum_master' && currentUser.id === krScrumMaster) ||
          (currentUser.id === task.responsible_id); 

        const canChangeStatusDirectly = 
          currentUser.group === 'admin' ||
          (currentUser.group === 'product_owner' && currentUser.id === objectiveResponsible) ||
          (currentUser.group === 'scrum_master' && currentUser.id === objectiveCoordinatorScrumMaster) ||
          (currentUser.group === 'scrum_master' && currentUser.id === krScrumMaster && task.responsible_id !== currentUser.id);
          
        return (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
          >
            <TaskDetailItem
              task={task}
              allUsers={allUsers}
              currentUser={currentUser}
              okrResponsibleId={objectiveResponsible}
              okrScrumMasterId={krScrumMaster}
              onUpdate={(taskId, field, value) => {
                const updatedTask = { ...task, [field]: value };
                onEditTask(updatedTask);
              }}
              onStatusChange={(taskId, newStatus) => onTaskStatusChange(taskId, newStatus)}
              canEditTaskDetails={canEditThisSpecificTask} 
              canEditTaskStatusDirectly={canChangeStatusDirectly}
            />
            {/* Botão de Detalhes/Editar foi removido daqui conforme solicitado */}
          </motion.div>
        );
      })}
    </div>
  );
};

export default TaskList;
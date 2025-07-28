import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import TaskList from '@/components/okr-detail/TaskList';
import { PlusCircle, Edit3, Trash2, ListPlus, CalendarCheck2, FileText, CalendarDays } from 'lucide-react';
import { calculateKrProgress, getTaskCounts, getStatusColor } from '@/lib/okrUtils';

const KrCardContent = ({
  kr,
  allUsers,
  currentUser,
  objectiveResponsible,
  objectiveCoordinatorScrumMaster,
  onTaskStatusChange,
  onOpenAssignModal,
  onOpenDirectAddTaskModal,
  onDeleteKr,
  onEditTask,
  onOpenEditKrDescriptionModal,
  onOpenEditKrDueDateModal,
  canManageKr,
  isTasksExpanded 
}) => {
  const krProgress = calculateKrProgress(kr.tasks || []);
  const { toDo, inProgress, done } = getTaskCounts(kr.tasks || []);
  const scrumMaster = allUsers.find(u => u.id === kr.responsible_id);

  const formatDate = (dateString) => {
    if (!dateString) return 'Não definido';
    return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR');
  };
  
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return null;
    return new Date(dateTimeString).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const krCompletedDate = formatDateTime(kr.completed_at);

  return (
    <>
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-foreground">Progresso</span>
          <span className={`text-sm font-semibold ${getStatusColor(kr.status, krProgress).textColor}`}>{krProgress.toFixed(0)}%</span>
        </div>
        <Progress value={krProgress} className={`h-3 ${getStatusColor(kr.status, krProgress).bgColor}`} indicatorClassName={`${getStatusColor(kr.status, krProgress).indicatorColor}`} />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{done} Concluídas</span>
          <span>{inProgress} Em Progresso</span>
          <span>{toDo} A Fazer</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-1">Scrum Master: {scrumMaster ? scrumMaster.name : 'Não definido'}</p>
      
      <div className="text-xs text-muted-foreground mb-1 flex items-center group">
        Prazo KR: {formatDate(kr.due_date)}
        {canManageKr && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="ml-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onOpenEditKrDueDateModal(kr)}
            aria-label="Editar data de entrega do KR"
          >
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
          </Button>
        )}
      </div>

      {krCompletedDate && (
        <p className="text-xs text-green-600 dark:text-green-400 mb-3 flex items-center">
          <CalendarCheck2 className="h-3.5 w-3.5 mr-1" /> Concluído em: {krCompletedDate}
        </p>
      )}
      
      {kr.description && (
        <div className="mb-3 p-2 bg-muted rounded-md relative group">
          <p className="text-sm text-muted-foreground">
            {kr.description}
          </p>
          {canManageKr && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onOpenEditKrDescriptionModal(kr)}
              aria-label="Editar descrição do KR"
            >
              <Edit3 className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
            </Button>
          )}
        </div>
      )}
      {!kr.description && canManageKr && (
         <Button 
            variant="outline" 
            size="sm" 
            className="w-full flex items-center justify-center text-xs mb-3"
            onClick={() => onOpenEditKrDescriptionModal(kr)}
          >
            <FileText className="mr-2 h-4 w-4" /> Adicionar Descrição ao KR
          </Button>
      )}

      <AnimatePresence initial={false}>
        {isTasksExpanded && (
          <motion.div
            key="taskList"
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: 'auto', opacity: 1, marginTop: '0.75rem' }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <TaskList
              tasks={kr.tasks || []}
              krId={kr.id}
              objectiveId={kr.objective_id}
              allUsers={allUsers}
              currentUser={currentUser}
              onTaskStatusChange={(taskId, newStatus) => onTaskStatusChange(taskId, newStatus)}
              onEditTask={onEditTask}
              canManageKr={canManageKr}
              objectiveResponsible={objectiveResponsible}
              krScrumMaster={kr.responsible_id}
              objectiveCoordinatorScrumMaster={objectiveCoordinatorScrumMaster}
            />
          </motion.div>
        )}
      </AnimatePresence>


      {canManageKr && (
        <div className="mt-4 pt-3 border-t space-y-2">
          <Button variant="outline" size="sm" className="w-full flex items-center justify-center text-xs" onClick={onOpenDirectAddTaskModal}>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Tarefa Manual
          </Button>
          <Button variant="outline" size="sm" className="w-full flex items-center justify-center text-xs" onClick={onOpenAssignModal}>
            <ListPlus className="mr-2 h-4 w-4" /> Atribuir do Backlog
          </Button>
          <Button variant="destructive" size="sm" className="w-full flex items-center justify-center text-xs" onClick={onDeleteKr}>
            <Trash2 className="mr-2 h-4 w-4" /> Excluir KR
          </Button>
        </div>
      )}
    </>
  );
};

export default KrCardContent;
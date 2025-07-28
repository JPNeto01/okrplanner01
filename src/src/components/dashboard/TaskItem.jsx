import React from 'react';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, CheckCircle, Clock, CalendarClock } from 'lucide-react';
import { getTaskUrgency, getDaysUntilDue } from '@/lib/dateUtils';

const TaskItem = ({ task, responsibleUser, currentUser, onUpdateTaskStatus, isDetailedView = false, okrResponsibleId, okrScrumMasterId, objectiveCoordinatorScrumMasterId }) => {
  const { toast } = useToast();
  
  const isCurrentUserAdmin = currentUser.group === 'admin';
  const isCurrentUserPO = currentUser.group === 'product_owner';
  const isCurrentUserScrumMaster = currentUser.group === 'scrum_master';
  const isCurrentUserTeamMember = currentUser.group === 'team_member';

  const isTaskOwner = currentUser.id === task.responsible_id; 
  const isOkrOwnerForPO = isCurrentUserPO && currentUser.id === okrResponsibleId;
  const isKrScrumMasterForSM = isCurrentUserScrumMaster && currentUser.id === okrScrumMasterId;
  const isObjectiveCoordinatorSM = isCurrentUserScrumMaster && currentUser.id === objectiveCoordinatorScrumMasterId;
  
  // Logic for who *could* edit status is kept for potential future use, but the Select will be removed.
  let canEditStatus = false;
  if (isCurrentUserAdmin) {
    canEditStatus = true;
  } else if (isOkrOwnerForPO) {
    canEditStatus = true;
  } else if (isKrScrumMasterForSM && !isTaskOwner) {
    canEditStatus = true; 
  } else if (isObjectiveCoordinatorSM && !isTaskOwner && !isKrScrumMasterForSM) { 
     canEditStatus = true;
  } else if (isTaskOwner && (isCurrentUserTeamMember || isCurrentUserScrumMaster)) { 
    canEditStatus = true;
  }

  const urgency = getTaskUrgency(task.due_date, task.status);
  const daysUntilDue = getDaysUntilDue(task.due_date);

  const getUrgencyStyles = () => {
    const baseStyle = {
      bgColor: 'bg-slate-100 dark:bg-slate-700/60',
      textColor: 'text-gray-700 dark:text-gray-300',
      borderColor: '',
      icon: <Clock className="h-4 w-4 text-gray-500 mr-1.5" />,
      titleText: task.status,
      titleTextClass: '',
      responsibleTextColor: 'text-muted-foreground',
      statusPillClasses: {
        'Concluído': 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100',
        'Em Progresso': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100',
        'A Fazer': 'bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100'
      }
    };
  
    if (task.status === 'Concluído') {
      return {
        ...baseStyle,
        bgColor: 'bg-green-50/70 dark:bg-green-900/30',
        textColor: 'text-green-600 dark:text-green-400',
        icon: <CheckCircle className="h-4 w-4 text-green-500 mr-1.5" />,
        titleText: 'Concluído',
      };
    }
  
    switch (urgency) {
      case 'overdue':
        return {
          ...baseStyle,
          bgColor: 'bg-red-600 dark:bg-red-800',
          textColor: 'text-white font-bold',
          borderColor: 'border border-red-700 dark:border-red-900',
          icon: <AlertTriangle className="h-4 w-4 text-white mr-1.5" />,
          titleText: `Atrasado (${Math.abs(daysUntilDue)} ${Math.abs(daysUntilDue) === 1 ? 'dia' : 'dias'})`,
          responsibleTextColor: 'text-red-50',
          statusPillClasses: {
            ...baseStyle.statusPillClasses,
            'A Fazer': 'bg-red-100 text-red-800',
            'Em Progresso': 'bg-red-100 text-red-800',
          }
        };
      case 'due_today':
        return {
          ...baseStyle,
          bgColor: 'bg-red-100 dark:bg-red-900/40',
          textColor: 'text-red-700 dark:text-red-300 font-semibold',
          borderColor: 'border border-red-300 dark:border-red-600',
          icon: <CalendarClock className="h-4 w-4 text-red-600 dark:text-red-400 mr-1.5" />,
          titleText: 'Para entregar Hoje',
          titleTextClass: 'text-sm',
        };
      case 'due_in_1_day':
        return {
          ...baseStyle,
          bgColor: 'bg-yellow-50/80 dark:bg-yellow-800/40',
          textColor: 'text-yellow-700 dark:text-yellow-400 font-semibold',
          borderColor: 'border border-yellow-300 dark:border-yellow-500',
          icon: <CalendarClock className="h-4 w-4 text-yellow-600 mr-1.5" />,
          titleText: 'Falta 1 dia para entregar',
        };
      case 'due_in_2_days':
        return {
          ...baseStyle,
          textColor: 'text-sky-700 dark:text-sky-400',
          icon: <CalendarClock className="h-4 w-4 text-sky-600 mr-1.5" />,
          titleText: 'Faltam 2 dias para entregar',
        };
      case 'due_in_3_days':
        return {
          ...baseStyle,
          textColor: 'text-sky-700 dark:text-sky-400',
          icon: <CalendarClock className="h-4 w-4 text-sky-600 mr-1.5" />,
          titleText: 'Faltam 3 dias para entregar',
        };
      case 'far_future':
        return {
            ...baseStyle,
            titleText: `Prazo: ${new Date(task.due_date + 'T00:00:00').toLocaleDateString('pt-BR')}`
        };
      default:
        return baseStyle;
    }
  };

  const styles = getUrgencyStyles();
  
  const formattedDueDate = task.due_date ? new Date(task.due_date + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não definido';
  const formattedCompletedAt = task.completed_at ? new Date(task.completed_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;
  const statusPillClass = styles.statusPillClasses[task.status] || '';

  return (
    <li className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 rounded-md shadow-sm mb-2 
                    ${styles.bgColor} ${styles.borderColor}`}>
      <div className="flex-1 mb-2 sm:mb-0">
        <div className="flex items-center">
            {styles.icon}
            <span className={`font-medium ${styles.textColor} ${task.status === 'Concluído' ? 'line-through' : ''}`}>
            {task.title}
            </span>
        </div>
        <div className={`text-xs ${styles.responsibleTextColor} mt-1 space-x-2`}>
            {responsibleUser && (
                <span>Responsável: {responsibleUser.name}</span>
            )}
             {task.due_date && task.status !== 'Concluído' && <span className={`font-medium ${styles.textColor} ${styles.titleTextClass}`}>{styles.titleText}</span>}
             {!task.due_date && task.status !== 'Concluído' && <span className="text-gray-500 dark:text-gray-400">(A Fazer)</span>}
        </div>
        {task.status === 'Concluído' && formattedCompletedAt && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
              Concluído em: {formattedCompletedAt}
            </p>
        )}
      </div>
      <div className="w-full sm:w-auto mt-2 sm:mt-0 text-right">
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusPillClass}`}>
          {task.status}
        </span>
        {!isDetailedView && (isCurrentUserTeamMember || (isCurrentUserScrumMaster && isTaskOwner)) && task.status !== 'Concluído' && (
          <p className={`text-xs mt-1 sm:mt-0 sm:ml-2 w-full sm:w-auto text-right ${urgency === 'overdue' ? 'text-red-100' : 'text-blue-600 dark:text-blue-400'}`}>
            Gerencie em "Minhas Tarefas"
          </p>
        )}
      </div>
    </li>
  );
};

export default TaskItem;
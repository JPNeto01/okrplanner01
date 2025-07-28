import React from 'react';
import { AlertTriangle, TrendingDown, Clock, User } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { format, parseISO } from 'date-fns';

const CriticalObjectivesList = ({ objectives, allUsers }) => {
  if (!objectives || objectives.length === 0) {
    return <p className="text-center text-muted-foreground py-8">Nenhum objetivo crítico identificado.</p>;
  }

  const getUserName = (userId) => allUsers.find(u => u.id === userId)?.name || 'N/A';

  return (
    <ul className="space-y-3">
      {objectives.map(obj => (
        <li key={obj.id} className="p-3 bg-card-foreground/5 dark:bg-slate-800/50 rounded-md shadow hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-1">
            <h4 className="font-semibold text-sm text-primary dark:text-primary-foreground truncate pr-2" title={obj.title}>
              {obj.title.length > 40 ? `${obj.title.substring(0, 37)}...` : obj.title}
            </h4>
            <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
              obj.calculatedStatus === 'Atrasado' ? 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100' :
              obj.overdueTasksCount > 0 ? 'bg-orange-100 text-orange-800 dark:bg-orange-700 dark:text-orange-100' :
              'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100'
            }`}>
              {obj.calculatedStatus === 'Atrasado' ? 'Atrasado' : obj.overdueTasksCount > 0 ? 'Tarefas Atrasadas' : 'Atenção'}
            </span>
          </div>
          
          <div className="text-xs text-muted-foreground mb-2 flex items-center">
            <User className="h-3 w-3 mr-1.5" /> Responsável: {getUserName(obj.responsible_id)}
            {obj.due_date && (
              <span className="ml-2 flex items-center">
                <Clock className="h-3 w-3 mr-1.5" /> Prazo: {format(parseISO(obj.due_date), 'dd/MM/yyyy')}
              </span>
            )}
          </div>

          <div className="flex items-center text-xs text-muted-foreground mb-1">
            <TrendingDown className="h-3 w-3 mr-1.5 text-red-500" />
            Prog. Tarefas: {Math.round(obj.progressWithBacklog || 0)}%
            <Progress value={obj.progressWithBacklog || 0} className="w-16 h-1.5 ml-2 mr-2" indicatorClassName={obj.calculatedStatus === 'Atrasado' || obj.overdueTasksCount > 0 ? 'bg-red-500' : 'bg-yellow-500'} />
            | Prog. KRs: {Math.round(obj.krCompletionRate || 0)}%
             <Progress value={obj.krCompletionRate || 0} className="w-16 h-1.5 ml-2" indicatorClassName={obj.calculatedStatus === 'Atrasado' || obj.overdueTasksCount > 0 ? 'bg-red-500' : 'bg-yellow-500'} />
          </div>
          
          {(obj.openTasksCount > 0 || obj.overdueTasksCount > 0) && (
            <div className="text-xs">
              {obj.openTasksCount > 0 && <span className="text-blue-600 dark:text-blue-400 mr-2">Pendentes: {obj.openTasksCount - obj.overdueTasksCount}</span>}
              {obj.overdueTasksCount > 0 && <span className="text-red-600 dark:text-red-400">Atrasadas: {obj.overdueTasksCount}</span>}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
};

export default CriticalObjectivesList;
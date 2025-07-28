import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from "@/components/ui/progress";
import { format, parseISO } from 'date-fns';

const ObjectivesTable = ({ objectives, allUsers }) => {
  const getUserName = (userId) => allUsers.find(u => u.id === userId)?.name || 'N/A';
  
  if (!objectives || objectives.length === 0) {
    return <p className="text-center text-muted-foreground py-8">Nenhum objetivo encontrado com os filtros aplicados.</p>;
  }

  return (
    <Card className="shadow-lg dark:bg-slate-800">
      <CardHeader>
        <CardTitle>Detalhes dos Objetivos</CardTitle>
        <CardDescription>Lista de objetivos com base nos filtros aplicados.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
          <thead className="bg-gray-50 dark:bg-slate-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Objetivo</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Responsável</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Empresa</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status (Tarefas)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Progresso (Tarefas)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Progresso (KRs)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tarefas (Total/Concl.)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Prazo</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
            {objectives.map(obj => {
              const totalTasks = obj.allObjectiveTasks?.length || 0;
              const completedTasks = obj.allObjectiveTasks?.filter(t => t.status === 'Concluído').length || 0;
              return (
                <tr key={obj.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{obj.title}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{getUserName(obj.responsible_id)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{obj.company}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                     <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        obj.calculatedStatus === 'Concluído' ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' :
                        obj.calculatedStatus === 'Atrasado' ? 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100' :
                        obj.calculatedStatus === 'Em Progresso' ? 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100' :
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100' // A Fazer
                      }`}>{obj.calculatedStatus}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    <div className="flex items-center">
                      <Progress value={obj.progressWithBacklog || 0} className="w-20 h-2 mr-2" />
                      <span>{Math.round(obj.progressWithBacklog || 0)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    <div className="flex items-center">
                      <Progress value={obj.krCompletionRate || 0} className="w-20 h-2 mr-2" />
                      <span>{Math.round(obj.krCompletionRate || 0)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{completedTasks} / {totalTasks}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{obj.due_date ? format(parseISO(obj.due_date), 'dd/MM/yyyy') : 'N/A'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};

export default ObjectivesTable;
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ListChecks, PlusCircle, User, CalendarDays } from 'lucide-react';
import TaskCreationForm from '@/components/create-okr/TaskCreationForm'; 
import { sortTasksByDeadline } from '@/lib/okrUtils'; // Alterado para sortTasksByDeadline

const KrTasksSelection = ({ 
  parentObjectiveTitle, 
  availableBacklogTasksForObjective = [], 
  selectedBacklogTaskIds = [], 
  onToggleBacklogTaskSelection, 
  getResponsibleName, 
  customAddedTasks = [], 
  setCustomAddedTasks, 
  teamMembersForCustomTasks = [], 
  showCustomTaskForm, 
  setShowCustomTaskForm,
  objectiveCompany,
  currentUser
}) => {
  // Usar sortTasksByDeadline para ordenar por data de conclusão
  const sortedAvailableBacklogTasks = sortTasksByDeadline([...availableBacklogTasksForObjective]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <Card className="shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-xl flex items-center text-teal-600 dark:text-teal-400">
          <ListChecks className="mr-2 h-6 w-6" /> Tarefas para o KR
        </CardTitle>
        <CardDescription>Selecione tarefas do backlog do Objetivo ou crie novas tarefas para este KR.</CardDescription>
      </CardHeader>
      <CardContent>
        <Label className="font-semibold text-md">Tarefas do Backlog do Objetivo "{parentObjectiveTitle}"</Label>
        {sortedAvailableBacklogTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground my-2">Nenhuma tarefa disponível no backlog para este Objetivo.</p>
        ) : (
          <ScrollArea className="h-[200px] max-h-[200px] pr-4 my-2 border rounded-md p-2">
            <div className="space-y-2">
              {sortedAvailableBacklogTasks.map(task => (
                <div key={task.id} className="flex items-center space-x-3 p-2 border rounded-md hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <Checkbox
                    id={`obj-backlog-task-${task.id}`}
                    checked={selectedBacklogTaskIds.includes(task.id)}
                    onCheckedChange={() => onToggleBacklogTaskSelection(task.id)}
                  />
                  <Label htmlFor={`obj-backlog-task-${task.id}`} className="flex-1 cursor-pointer">
                    <p className="font-medium">{task.title}</p>
                    <div className="text-xs text-muted-foreground flex items-center space-x-2">
                      <div className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        <span>{getResponsibleName(task.responsible_id) || 'N/A'}</span>
                      </div>
                      <div className="flex items-center">
                        <CalendarDays className="h-3 w-3 mr-1" />
                        <span>{formatDate(task.due_date) || 'N/A'}</span>
                      </div>
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <Label className="font-semibold text-md">Criar Novas Tarefas para este KR (Opcional)</Label>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowCustomTaskForm(!showCustomTaskForm)}>
              <PlusCircle className="mr-2 h-4 w-4" /> {showCustomTaskForm ? 'Fechar Formulário' : 'Adicionar Nova Tarefa'}
            </Button>
          </div>
          {showCustomTaskForm && (
             <TaskCreationForm
                tasks={customAddedTasks}
                setTasks={setCustomAddedTasks}
                teamMembersForTasks={teamMembersForCustomTasks}
                objectiveCompany={objectiveCompany} 
                currentUser={currentUser} 
                isKrCreationContext={true}
             />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default KrTasksSelection;
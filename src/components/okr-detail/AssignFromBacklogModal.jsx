import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { sortTasksByUrgency } from '@/lib/dateUtils'; 
import { User, CalendarDays } from 'lucide-react';

const AssignFromBacklogModal = ({ isOpen, onClose, onAssignTasks, currentOkrCompany, currentOkrTasks = [], targetObjectiveId }) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [availableTasks, setAvailableTasks] = useState([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [allUsers, setAllUsers] = useState([]);

  const fetchBacklogTasks = useCallback(async () => {
    if (!currentUser || !currentOkrCompany || !targetObjectiveId) return;
    setIsLoading(true);
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, name');
      if (usersError) throw usersError;
      setAllUsers(usersData || []);

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('company', currentOkrCompany)
        .eq('objective_id', targetObjectiveId)
        .is('kr_id', null); // Apenas tarefas do backlog do objetivo específico

      if (error) throw error;
      
      const tasksNotInCurrentKr = (data || []).filter(task => 
        !currentOkrTasks.some(krTask => krTask.id === task.id)
      );
      
      const sortedTasks = sortTasksByUrgency(tasksNotInCurrentKr);
      setAvailableTasks(sortedTasks);

    } catch (error) {
      console.error("Error fetching backlog tasks:", error);
      toast({ title: "Erro ao buscar tarefas do backlog", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, currentOkrCompany, currentOkrTasks, targetObjectiveId, toast]);

  useEffect(() => {
    if (isOpen) {
      fetchBacklogTasks();
    } else {
      setAvailableTasks([]);
      setSelectedTaskIds([]);
    }
  }, [isOpen, fetchBacklogTasks]);

  const handleToggleTaskSelection = (taskId) => {
    setSelectedTaskIds(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const handleSubmit = () => {
    const tasksToAssign = availableTasks.filter(task => selectedTaskIds.includes(task.id));
    if (tasksToAssign.length === 0) {
      toast({ title: "Nenhuma tarefa selecionada", description: "Por favor, selecione ao menos uma tarefa para atribuir.", variant: "info" });
      return;
    }
    onAssignTasks(tasksToAssign);
    onClose();
  };

  const getResponsibleName = (userId) => {
    const user = allUsers.find(u => u.id === userId);
    return user ? user.name : 'N/A';
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900">
        <DialogHeader>
          <DialogTitle className="text-primary dark:text-primary-foreground">Atribuir Tarefas do Backlog</DialogTitle>
          <DialogDescription>Selecione tarefas do backlog do objetivo para adicionar a este KR.</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <p className="text-center py-4">Carregando tarefas...</p>
        ) : availableTasks.length === 0 ? (
          <p className="text-center py-4 text-muted-foreground">Nenhuma tarefa disponível no backlog deste objetivo.</p>
        ) : (
          <ScrollArea className="max-h-[60vh] p-1 pr-3">
            <div className="space-y-3">
              {availableTasks.map(task => (
                <div key={task.id} className="flex items-start space-x-3 p-3 border rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <Checkbox
                    id={`task-${task.id}`}
                    checked={selectedTaskIds.includes(task.id)}
                    onCheckedChange={() => handleToggleTaskSelection(task.id)}
                    className="mt-1"
                  />
                  <Label htmlFor={`task-${task.id}`} className="flex-1 cursor-pointer">
                    <p className="font-medium text-gray-800 dark:text-gray-200">{task.title}</p>
                    <div className="text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center sm:space-x-2 mt-0.5">
                      <div className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        <span>{getResponsibleName(task.responsible_id)}</span>
                      </div>
                      <div className="flex items-center">
                        <CalendarDays className="h-3 w-3 mr-1" />
                        <span>{formatDate(task.due_date)}</span>
                      </div>
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        <DialogFooter className="pt-4 border-t dark:border-slate-700">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={selectedTaskIds.length === 0 || isLoading} className="bg-primary hover:bg-primary/90 text-white">
            Atribuir Selecionadas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignFromBacklogModal;
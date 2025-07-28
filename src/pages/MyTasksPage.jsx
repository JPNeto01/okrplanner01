import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import MyTasksSection from '@/components/my-tasks/MyTasksSection';
import MyTasksHeader from '@/components/my-tasks/MyTasksHeader';
import MyTasksEmptyState from '@/components/my-tasks/MyTasksEmptyState';
import { sanitizeFileName } from '@/lib/utils';
import { sortTasksByUrgency } from '@/lib/dateUtils';

const MyTasksPage = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [allTasks, setAllTasks] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedObjectiveId, setSelectedObjectiveId] = useState('');
  const [availableObjectives, setAvailableObjectives] = useState([]);

  const loadTasks = useCallback(async () => {
    if (!authLoading && currentUser) {
      setIsLoadingData(true);
      try {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name');
        if (profilesError) throw profilesError;

        const { data: tasksFromDb, error: tasksError } = await supabase
          .from('tasks')
          .select(`
            id, title, description, responsible_id, status, due_date, company, objective_id, kr_id, created_at, completed_at,
            key_results (
              id,
              title,
              responsible_id,
              objectives (
                id,
                title,
                company
              )
            )
          `)
          .eq('responsible_id', currentUser.id)
          .not('status', 'eq', 'Backlog'); 

        if (tasksError) throw tasksError;

        const processedTasks = [];

        (tasksFromDb || []).forEach(task => {
          if (!task.key_results || !task.key_results.objectives) return; 
          
          if (currentUser.group !== 'admin' && task.key_results.objectives.company !== currentUser.company) {
            return;
          }

          const kr = task.key_results;
          const objective = kr.objectives;
          const krScrumMasterProfile = profiles.find(p => p.id === kr.responsible_id);

          processedTasks.push({
            ...task,
            id: task.id,
            description: task.description || '',
            dueDate: task.due_date,
            completed_at: task.completed_at,
            krId: kr.id,
            krTitle: kr.title,
            objectiveId: objective.id,
            objectiveTitle: objective.title,
            krScrumMaster: krScrumMasterProfile?.name || 'N/A',
            krCompany: objective.company
          });
        });
        
        setAllTasks(processedTasks);
        
        const objectives = [...new Map(processedTasks.map(task => 
          [task.objectiveId, { id: task.objectiveId, title: task.objectiveTitle }]
        )).values()];
        setAvailableObjectives(objectives);

      } catch (error) {
        console.error("Error loading tasks:", error);
        toast({ title: "Erro ao Carregar Tarefas", description: error.message, variant: "destructive" });
      } finally {
        setIsLoadingData(false);
      }
    } else if (!authLoading && !currentUser) {
      setIsLoadingData(false);
    }
  }, [authLoading, currentUser, toast]);

  useEffect(() => {
    loadTasks();
    const handleForceReload = () => loadTasks();
    window.addEventListener('forceMyTasksReload', handleForceReload); 
    return () => window.removeEventListener('forceMyTasksReload', handleForceReload);
  }, [loadTasks]);

  const handleTaskStatusChange = async (objectiveId, krId, taskId, newStatus) => {
    try {
      const updatePayload = { status: newStatus };
      if (newStatus === 'Concluído') {
        updatePayload.completed_at = new Date().toISOString();
      } else {
        updatePayload.completed_at = null;
      }

      const { data: updatedTask, error } = await supabase
        .from('tasks')
        .update(updatePayload)
        .eq('id', taskId)
        .select('id, title') 
        .single();

      if (error) throw error;

      loadTasks(); 
      toast({
        title: "Status Atualizado",
        description: `Tarefa "${updatedTask.title}" atualizada para ${newStatus}.`,
      });
      window.dispatchEvent(new CustomEvent('okrDataChanged')); 
    } catch (error) {
      console.error("Error updating task status:", error);
      toast({ title: "Erro", description: `Não foi possível atualizar a tarefa: ${error.message}`, variant: "destructive" });
    }
  };

  const handleSaveTaskDetails = async (objectiveId, krId, taskId, description, newAttachments, attachmentsToRemove) => {
    try {
      const { data: updatedTask, error: updateError } = await supabase
        .from('tasks')
        .update({ description })
        .eq('id', taskId)
        .select('id, title') 
        .single();
      
      if (updateError) throw updateError;

      if (attachmentsToRemove && attachmentsToRemove.length > 0) {
        for (const attId of attachmentsToRemove) {
          await supabase.from('task_attachments').delete().eq('id', attId);
        }
      }

      if (newAttachments && newAttachments.length > 0) {
        for (const newAtt of newAttachments) {
          if (!newAtt.file) {
            console.warn("Tentativa de upload de anexo sem arquivo em Minhas Tarefas:", newAtt);
            continue;
          }
          const sanitizedFileNameString = sanitizeFileName(newAtt.name);
          const filePath = `task_files/${taskId}/${sanitizedFileNameString}`;
          const { error: uploadError } = await supabase.storage
            .from('task-attachments')
            .upload(filePath, newAtt.file, {
              cacheControl: '3600',
              upsert: true,
            });

          if (uploadError) {
            console.error('Error uploading file:', uploadError);
            toast({ title: "Erro de Upload", description: `Falha ao enviar o arquivo ${newAtt.name}: ${uploadError.message}`, variant: "destructive" });
            continue;
          }
          
          await supabase.from('task_attachments').insert({
              task_id: taskId,
              file_name: newAtt.name,
              file_path: filePath,
              file_type: newAtt.type,
              uploaded_by_id: currentUser.id,
          });
        }
      }

      loadTasks(); 
      toast({
        title: "Detalhes Salvos",
        description: `Detalhes da tarefa "${updatedTask.title}" foram atualizados.`,
      });
      window.dispatchEvent(new CustomEvent('okrDataChanged'));
    } catch (error) {
      console.error("Error saving task details:", error);
      toast({ title: "Erro", description: `Não foi possível salvar os detalhes da tarefa: ${error.message}`, variant: "destructive" });
    }
  };

  const filteredTasks = useMemo(() => {
    if (!selectedObjectiveId) {
      return allTasks;
    }
    return allTasks.filter(task => task.objectiveId === selectedObjectiveId);
  }, [allTasks, selectedObjectiveId]);

  const tasksByStatus = useMemo(() => {
    const pendingTasks = filteredTasks.filter(task => task.status === 'A Fazer');
    const inProgressTasks = filteredTasks.filter(task => task.status === 'Em Progresso');
    const completedTasks = filteredTasks.filter(task => task.status === 'Concluído');

    return {
      pending: sortTasksByUrgency(pendingTasks),
      inProgress: sortTasksByUrgency(inProgressTasks),
      completed: sortTasksByUrgency(completedTasks)
    };
  }, [filteredTasks]);
  
  if (isLoadingData || authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 text-white"><p>Carregando suas tarefas...</p></div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const totalAllTasks = allTasks.length;
  const totalFilteredTasks = filteredTasks.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 p-4 md:p-8">
      <MyTasksHeader 
        availableObjectives={availableObjectives}
        selectedObjectiveId={selectedObjectiveId}
        onObjectiveChange={setSelectedObjectiveId}
      />

      {totalAllTasks === 0 && !isLoadingData && (
        <MyTasksEmptyState />
      )}

      {totalAllTasks > 0 && totalFilteredTasks === 0 && !isLoadingData && (
        <MyTasksEmptyState isFilterActive={true} />
      )}

      {totalFilteredTasks > 0 && (
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <MyTasksSection
              title="Tarefas Pendentes"
              tasks={tasksByStatus.pending}
              status="A Fazer"
              onTaskStatusChange={handleTaskStatusChange}
              onSaveTaskDetails={handleSaveTaskDetails}
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <MyTasksSection
              title="Tarefas em Andamento"
              tasks={tasksByStatus.inProgress}
              status="Em Progresso"
              onTaskStatusChange={handleTaskStatusChange}
              onSaveTaskDetails={handleSaveTaskDetails}
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <MyTasksSection
              title="Tarefas Concluídas"
              tasks={tasksByStatus.completed}
              status="Concluído"
              onTaskStatusChange={handleTaskStatusChange}
              onSaveTaskDetails={handleSaveTaskDetails}
            />
          </motion.div>
        </div>
      )}

      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} OKR Manager. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default MyTasksPage;
import { supabase } from '@/lib/supabaseClient';
import { calculateKrProgress, determineOkrStatus } from '@/lib/okrUtils';
import { sanitizeFileName } from '@/lib/utils';

export const useKrOperations = (objective, currentUser, reloadObjectiveData, toast) => {

  const updateKrStatusIfNeeded = async (krId) => {
    if (!objective || !krId) return;
    
    const { data: reloadedObjective, error: reloadError } = await supabase
        .from('objectives')
        .select('id, key_results(id, status, completed_at, tasks(id, status, due_date))')
        .eq('id', objective.id)
        .single();

    if (reloadError || !reloadedObjective) {
        console.error("Failed to reload objective for KR status update:", reloadError);
        return;
    }
    
    const krToUpdate = reloadedObjective.key_results.find(kr => kr.id === krId);
    if (!krToUpdate) return;

    const krTasks = krToUpdate.tasks || [];
    const newKrStatus = determineOkrStatus(krTasks);
    
    let krCompletedAt = krToUpdate.completed_at;
    if (newKrStatus === 'Concluído' && !krToUpdate.completed_at) {
        krCompletedAt = new Date().toISOString();
    } else if (newKrStatus !== 'Concluído') {
        krCompletedAt = null;
    }

    if (krToUpdate.status !== newKrStatus || krToUpdate.completed_at !== krCompletedAt) {
      try {
        const { error: updateKrError } = await supabase
          .from('key_results')
          .update({ status: newKrStatus, completed_at: krCompletedAt })
          .eq('id', krId);
        if (updateKrError) throw updateKrError;
      } catch (error) {
        console.error("Error updating KR status:", error);
        toast({ title: "Erro", description: `Falha ao atualizar status do KR: ${error.message}`, variant: "destructive" });
      }
    }
  };

  const handleAssignTasksToKr = async (selectedKrForTask, tasksToAssign) => {
    if (!selectedKrForTask || !selectedKrForTask.id || !objective) return;
    const krId = selectedKrForTask.id;
    try {
      const updates = tasksToAssign.map(task =>
        supabase.from('tasks').update({ kr_id: krId, status: 'A Fazer', completed_at: null }).eq('id', task.id)
      );
      const results = await Promise.all(updates);
      results.forEach(result => { if (result.error) throw result.error; });
      
      await reloadObjectiveData();
      await updateKrStatusIfNeeded(krId);
      window.dispatchEvent(new CustomEvent('okrDataChanged'));
      window.dispatchEvent(new CustomEvent('forceBacklogReload'));
      toast({ title: "Tarefas Atribuídas", description: `${tasksToAssign.length} tarefa(s) atribuída(s) ao KR.` });
    } catch (error) {
      console.error("Error assigning tasks to KR:", error);
      toast({ title: "Erro", description: `Falha ao atribuir tarefas: ${error.message}`, variant: "destructive" });
    }
  };

  const handleDirectAddTaskToKr = async (selectedKrForTask, newTaskData) => {
    if (!selectedKrForTask || !selectedKrForTask.id || !objective) return;
    const taskToInsert = {
      title: newTaskData.title,
      responsible_id: newTaskData.responsible,
      due_date: newTaskData.dueDate,
      description: newTaskData.description || '',
      status: 'A Fazer', 
      company: objective.company,
      objective_id: objective.id,
      kr_id: selectedKrForTask.id,
      created_by_id: currentUser.id,
      completed_at: null,
    };
    try {
      const { data: insertedTask, error } = await supabase.from('tasks').insert(taskToInsert).select().single();
      if (error) throw error;

      if (newTaskData.newAttachments && newTaskData.newAttachments.length > 0) {
          for (const att of newTaskData.newAttachments) {
            if (!att.file) {
                console.warn("Tentativa de upload de anexo sem arquivo ao adicionar tarefa ao KR:", att);
                continue;
            }
            const sanitizedFileNameString = sanitizeFileName(att.name);
            const filePath = `task_files/${insertedTask.id}/${sanitizedFileNameString}`;
            
            const { error: uploadError } = await supabase.storage
              .from('task-attachments')
              .upload(filePath, att.file, {
                cacheControl: '3600',
                upsert: true,
              });

            if (uploadError) {
              console.error('Error uploading file:', uploadError);
              toast({ title: "Erro de Upload", description: `Falha ao enviar o arquivo ${att.name}: ${uploadError.message}`, variant: "destructive" });
              continue;
            }

            await supabase.from('task_attachments').insert({
                task_id: insertedTask.id,
                file_name: att.name, 
                file_path: filePath, 
                file_type: att.type,
                uploaded_by_id: currentUser.id
            });
          }
      }
      
      await reloadObjectiveData();
      await updateKrStatusIfNeeded(selectedKrForTask.id);
      window.dispatchEvent(new CustomEvent('okrDataChanged'));
      toast({ title: "Tarefa Adicionada", description: `Nova tarefa "${newTaskData.title}" adicionada ao KR.` });
    } catch (error) {
      console.error("Error adding task to KR:", error);
      toast({ title: "Erro", description: `Falha ao adicionar tarefa: ${error.message}`, variant: "destructive" });
    }
  };

  const handleDeleteKr = async (krIdToDelete) => {
    try {
      
      await supabase
        .from('tasks')
        .update({ kr_id: null, status: 'Backlog', completed_at: null })
        .eq('kr_id', krIdToDelete);
      
      
      await supabase.from('key_results').delete().eq('id', krIdToDelete);

      reloadObjectiveData();
      window.dispatchEvent(new CustomEvent('okrDataChanged'));
      window.dispatchEvent(new CustomEvent('forceBacklogReload'));
      toast({ title: "KR Excluído", description: "Key Result excluído. Suas tarefas foram movidas para o backlog." });
    } catch (error) {
      console.error("Error deleting KR:", error);
      toast({ title: "Erro", description: `Falha ao excluir KR: ${error.message}`, variant: "destructive" });
    }
  };

  const handleUpdateKrDescription = async (krId, newDescription) => {
    try {
      const { error } = await supabase
        .from('key_results')
        .update({ description: newDescription })
        .eq('id', krId);
      if (error) throw error;
      
      await reloadObjectiveData();
      window.dispatchEvent(new CustomEvent('okrDataChanged'));
    } catch (error) {
      console.error("Error updating KR description:", error);
      throw error; 
    }
  };

  const handleUpdateKrTitle = async (krId, newTitle) => {
    try {
      const { error } = await supabase
        .from('key_results')
        .update({ title: newTitle })
        .eq('id', krId);
      if (error) throw error;
      
      await reloadObjectiveData();
      window.dispatchEvent(new CustomEvent('okrDataChanged'));
    } catch (error) {
      console.error("Error updating KR title:", error);
      throw error;
    }
  };

  const handleUpdateKrDueDate = async (krId, newDueDate) => {
    try {
      const { error } = await supabase
        .from('key_results')
        .update({ due_date: newDueDate })
        .eq('id', krId);
      if (error) throw error;
      
      await reloadObjectiveData();
      window.dispatchEvent(new CustomEvent('okrDataChanged'));
    } catch (error) {
      console.error("Error updating KR due date:", error);
      throw error;
    }
  };

  return {
    updateKrStatusIfNeeded,
    handleAssignTasksToKr,
    handleDirectAddTaskToKr,
    handleDeleteKr,
    handleUpdateKrDescription,
    handleUpdateKrTitle,
    handleUpdateKrDueDate,
  };
};
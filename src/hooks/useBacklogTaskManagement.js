import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { sanitizeFileName } from '@/lib/utils';
import { determineOkrStatus } from '@/lib/okrUtils';

export const useBacklogTaskManagement = (currentUser, objectives, allTasks, loadBacklogData) => {
  const { toast } = useToast();

  const updateKrStatusIfNeededForBacklog = async (krId) => {
    if (!krId) return;
    try {
      const { data: krWithTasks, error: fetchError } = await supabase
        .from('key_results')
        .select('id, status, completed_at, objective_id, tasks(id, status, due_date)')
        .eq('id', krId)
        .single();
      if (fetchError || !krWithTasks) throw new Error(fetchError?.message || "KR não encontrado");

      const newKrStatus = determineOkrStatus(krWithTasks.tasks || []);
      const krCompletedAt = newKrStatus === 'Concluído' && !krWithTasks.completed_at ? new Date().toISOString() : (newKrStatus !== 'Concluído' ? null : krWithTasks.completed_at);

      if (krWithTasks.status !== newKrStatus || krWithTasks.completed_at !== krCompletedAt) {
        const { error: updateKrError } = await supabase.from('key_results').update({ status: newKrStatus, completed_at: krCompletedAt }).eq('id', krId);
        if (updateKrError) throw updateKrError;
        window.dispatchEvent(new CustomEvent('okrDataChanged', { detail: { objectiveId: krWithTasks.objective_id } }));
      }
    } catch (error) {
      console.error("Error updating KR status from Backlog:", error);
      toast({ title: "Erro ao atualizar status do KR", description: error.message, variant: "destructive" });
    }
  };

  const handleRemoveTaskFromKr = async (krId, taskId) => {
    if (!krId || !taskId) {
      toast({ title: "Erro Interno", description: "IDs ausentes para remoção.", variant: "destructive" });
      return;
    }
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('desvincular_tarefa_do_kr', { p_task_id: taskId, p_kr_id: krId });
      if (rpcError) throw rpcError;

      const result = rpcData?.[0];
      if (!result || (result.message && result.message.startsWith('ERRO'))) {
        toast({ title: "Falha ao Desvincular", description: result?.message || "A operação não retornou resultado.", variant: "destructive" });
      } else {
        toast({ title: "Tarefa Removida do KR", description: "A tarefa voltou para o backlog do objetivo." });
        await updateKrStatusIfNeededForBacklog(krId);
        loadBacklogData();
      }
    } catch (error) {
      toast({ title: "Erro ao Desvincular Tarefa", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteTask = async (taskId) => {
    const taskToDelete = allTasks.find(t => t.id === taskId);
    if (!taskToDelete) {
      toast({ title: "Erro", description: "Tarefa não encontrada.", variant: "destructive" });
      return;
    }
    const objectiveOfTask = objectives.find(obj => obj.id === taskToDelete.objective_id);
    const canDelete = currentUser.group === 'admin' ||
      (currentUser.group === 'product_owner' && objectiveOfTask?.responsible_id === currentUser.id) ||
      (currentUser.group === 'scrum_master' && objectiveOfTask?.coordinator_scrum_master_id === currentUser.id);

    if (!canDelete || taskToDelete.kr_id) {
      toast({ title: "Ação não permitida", description: "Você não tem permissão para excluir esta tarefa ou ela pertence a um KR.", variant: "destructive" });
      return;
    }

    try {
      await supabase.from('task_attachments').delete().eq('task_id', taskId);
      await supabase.from('tasks').delete().eq('id', taskId);
      loadBacklogData();
      toast({ title: "Tarefa Removida", description: `Tarefa "${taskToDelete.title}" removida do backlog.` });
    } catch (error) {
      toast({ title: "Erro ao Remover Tarefa", description: error.message, variant: "destructive" });
    }
  };

  const handleUpdateTask = async (taskId, updatedData) => {
    const { newAttachments, attachmentsToRemove, ...taskData } = updatedData;
    const finalData = {
      description: taskData.description,
    };
    try {
      await supabase.from('tasks').update(finalData).eq('id', taskId);
      if (attachmentsToRemove?.length > 0) {
        await supabase.from('task_attachments').delete().in('id', attachmentsToRemove);
      }
      if (newAttachments?.length > 0) {
        for (const newAtt of newAttachments) {
          if (!newAtt.file) continue;
          const sanitizedFileNameString = sanitizeFileName(newAtt.name);
          const filePath = `task_files/${taskId}/${sanitizedFileNameString}`;
          const { error: uploadError } = await supabase.storage.from('task-attachments').upload(filePath, newAtt.file, { upsert: true });
          if (uploadError) throw uploadError;
          await supabase.from('task_attachments').insert({ task_id: taskId, file_name: newAtt.name, file_path: filePath, file_type: newAtt.type, uploaded_by_id: currentUser.id });
        }
      }
      loadBacklogData();
      toast({ title: "Tarefa Atualizada", description: `Detalhes da tarefa foram salvos.` });
    } catch (error) {
      toast({ title: "Erro ao Atualizar Tarefa", description: error.message, variant: "destructive" });
    }
  };

  return { handleRemoveTaskFromKr, handleDeleteTask, handleUpdateTask };
};

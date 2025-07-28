import { supabase } from '@/lib/supabaseClient';
import { sanitizeFileName } from '@/lib/utils';

export const useTaskOperations = (objective, currentUser, reloadObjectiveData, updateKrStatusIfNeededCallback, toast) => {

  const handleTaskStatusChange = async (krId, taskId, newStatus) => {
    if (!taskId) {
      toast({ title: "Erro", description: "ID da tarefa inválido.", variant: "destructive" });
      return;
    }
    try {
      const updatePayload = { status: newStatus };
      if (newStatus === 'Concluído') {
        updatePayload.completed_at = new Date().toISOString();
      } else {
        updatePayload.completed_at = null;
      }

      const { error } = await supabase.from('tasks').update(updatePayload).eq('id', taskId);
      if (error) throw error;
      
      
      if (krId && updateKrStatusIfNeededCallback) {
        await updateKrStatusIfNeededCallback(krId); 
      }
      window.dispatchEvent(new CustomEvent('okrDataChanged')); 
      window.dispatchEvent(new CustomEvent('forceMyTasksReload')); 
      window.dispatchEvent(new CustomEvent('forceBacklogReload'));

      toast({ title: "Status da Tarefa Atualizado", description: `Tarefa movida para ${newStatus}.` });
    } catch (error) {
      console.error("Error updating task status:", error);
      toast({ title: "Erro", description: `Falha ao atualizar status da tarefa: ${error.message}`, variant: "destructive" });
    }
  };
  
  const handleSaveTaskChanges = async (editingTask, updatedTaskData) => {
    if(!editingTask || !editingTask.id) {
      toast({ title: "Erro", description: "Dados da tarefa inválidos para edição.", variant: "destructive" });
      return;
    }
    try {
      const payload = {
        title: updatedTaskData.title,
        responsible_id: updatedTaskData.responsible,
        due_date: updatedTaskData.dueDate,
        description: updatedTaskData.description,
        objective_id: updatedTaskData.objectiveId,
        status: updatedTaskData.status, 
      };
      
      if (updatedTaskData.status === 'Concluído' && !editingTask.completed_at) {
        payload.completed_at = new Date().toISOString();
      } else if (updatedTaskData.status !== 'Concluído' && editingTask.completed_at) {
        payload.completed_at = null;
      }
      
      const { data: updatedTaskResult, error: updateError } = await supabase
        .from('tasks')
        .update(payload)
        .eq('id', editingTask.id)
        .select('id, title') 
        .single();

      if (updateError) {
        console.error("Error saving task details:", updateError);
        toast({ title: "Erro ao Salvar", description: `Falha ao salvar detalhes da tarefa: ${updateError.message}`, variant: "destructive" });
        return;
      }
      
      if (updatedTaskData.attachmentsToRemove && updatedTaskData.attachmentsToRemove.length > 0) {
        for (const attId of updatedTaskData.attachmentsToRemove) {
          
          await supabase.from('task_attachments').delete().eq('id', attId);
        }
      }
      if (updatedTaskData.newAttachments && updatedTaskData.newAttachments.length > 0) {
         for (const newAtt of updatedTaskData.newAttachments) {
            if (!newAtt.file) {
                console.warn("Tentativa de upload de anexo sem arquivo:", newAtt);
                continue;
            }
            const sanitizedFileNameString = sanitizeFileName(newAtt.name);
            const filePath = `task_files/${editingTask.id}/${sanitizedFileNameString}`;
            
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
                task_id: editingTask.id,
                file_name: newAtt.name, 
                file_path: filePath, 
                file_type: newAtt.type,
                uploaded_by_id: currentUser.id,
            });
         }
      }
      
      if (editingTask.kr_id && updateKrStatusIfNeededCallback) {
        await updateKrStatusIfNeededCallback(editingTask.kr_id);
      }
      window.dispatchEvent(new CustomEvent('okrDataChanged'));
      window.dispatchEvent(new CustomEvent('forceBacklogReload'));
      window.dispatchEvent(new CustomEvent('forceMyTasksReload'));
      toast({ title: "Tarefa Atualizada", description: `Detalhes da tarefa "${updatedTaskResult.title}" foram salvos.` });
    } catch (error)      {
      console.error("Error in handleSaveTaskChanges:", error);
      toast({ title: "Erro", description: `Falha ao atualizar tarefa: ${error.message}`, variant: "destructive" });
    }
  };
  
  const handleRemoveTaskFromKr = async (krId, taskId) => {
    if (!krId || !taskId) {
      toast({ title: "Erro Interno", description: "Não foi possível identificar o KR ou a tarefa para remoção. IDs ausentes.", variant: "destructive" });
      return;
    }

    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('desvincular_tarefa_do_kr', {
        p_task_id: taskId,
        p_kr_id: krId
      });

      if (rpcError) {
        console.error("Supabase RPC error (desvincular_tarefa_do_kr):", rpcError);
        toast({ title: "Erro RPC", description: `Falha na operação do banco: ${rpcError.message}`, variant: "destructive" });
        return; 
      }
      
      const result = rpcData && rpcData.length > 0 ? rpcData[0] : null;

      if (!result) {
         console.warn("RPC desvincular_tarefa_do_kr: Nenhuma resposta da operação.", { taskId, krId });
         toast({ title: "Falha ao Desvincular", description: "Operação não retornou resultado.", variant: "destructive" });
         return;
      }

      if (result.message && result.message.startsWith('ERRO')) {
         console.warn("RPC desvincular_tarefa_do_kr (ERRO):", result.message, { taskId, krId, result });
         toast({ title: "Falha ao Desvincular", description: result.message, variant: "destructive" });
         
         if (result.message.includes("acesso negado") || result.message.includes("Permissão negada")) {
            return; 
         }
      } else if (result.message && result.message.startsWith('INFO')) {
        console.info("RPC desvincular_tarefa_do_kr (INFO):", result.message, { taskId, krId });
        toast({ title: "Informação", description: result.message, variant: "info" });
      } else if (result.message && result.message.startsWith('SUCESSO')) {
        toast({ title: "Tarefa Removida do KR", description: result.message });
      } else {
         toast({ title: "Resultado Inesperado", description: result.message || "A operação retornou um estado inesperado.", variant: "warning" });
      }
      
      if (krId && updateKrStatusIfNeededCallback) {
        await updateKrStatusIfNeededCallback(krId);
      }
      window.dispatchEvent(new CustomEvent('okrDataChanged'));
      window.dispatchEvent(new CustomEvent('forceBacklogReload'));
      window.dispatchEvent(new CustomEvent('forceMyTasksReload'));
      
    } catch (error) {
      console.error("General error in handleRemoveTaskFromKr (RPC call):", error);
      toast({ title: "Erro ao Desvincular Tarefa", description: `Falha ao remover tarefa do KR: ${error.message || 'Erro desconhecido.'}`, variant: "destructive" });
    }
  };

  return {
    handleTaskStatusChange,
    handleSaveTaskChanges,
    handleRemoveTaskFromKr,
  };
};
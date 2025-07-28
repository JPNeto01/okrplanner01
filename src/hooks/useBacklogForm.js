import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { sanitizeFileName } from '@/lib/utils';

export const useBacklogForm = (currentUser, objectives, loadBacklogData) => {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [objectiveId, setObjectiveId] = useState('');
  const [responsibleId, setResponsibleId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState([]);

  const toggleForm = () => setShowForm(!showForm);

  const resetForm = () => {
    setTitle('');
    setObjectiveId('');
    setResponsibleId('');
    setDueDate('');
    setDescription('');
    setAttachments([]);
    setShowForm(false);
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!title || !responsibleId || !dueDate || !objectiveId) {
      toast({ title: "Erro", description: "Por favor, preencha todos os campos obrigatórios da tarefa, incluindo o Objetivo.", variant: "destructive" });
      return;
    }

    const selectedObjective = objectives.find(obj => obj.id === objectiveId);
    if (!selectedObjective) {
      toast({ title: "Erro", description: "Objetivo selecionado não encontrado.", variant: "destructive" });
      return;
    }

    const canAdd = currentUser.group === 'admin' ||
                   (currentUser.group === 'product_owner' && selectedObjective.responsible_id === currentUser.id) ||
                   (currentUser.group === 'scrum_master' && selectedObjective.coordinator_scrum_master_id === currentUser.id);

    if (!canAdd) {
      toast({ title: "Acesso Negado", description: "Você não tem permissão para adicionar tarefas a este Objetivo.", variant: "destructive" });
      return;
    }

    const taskToInsert = {
      title,
      responsible_id: responsibleId,
      due_date: dueDate,
      status: 'Backlog',
      company: selectedObjective.company,
      objective_id: objectiveId,
      description,
      created_by_id: currentUser.id,
    };

    try {
      const { data: insertedTask, error } = await supabase.from('tasks').insert(taskToInsert).select('id, title').single();
      if (error) throw error;

      if (attachments.length > 0) {
        for (const attachment of attachments) {
          if (!attachment.file) continue;
          const sanitizedFileNameString = sanitizeFileName(attachment.name);
          const filePath = `task_files/${insertedTask.id}/${sanitizedFileNameString}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('task-attachments')
            .upload(filePath, attachment.file, { cacheControl: '3600', upsert: true });

          if (uploadError) {
            console.error('Error uploading file:', uploadError);
            toast({ title: "Erro de Upload", description: `Falha ao enviar o arquivo ${attachment.name}: ${uploadError.message}`, variant: "destructive" });
            continue;
          }

          await supabase.from('task_attachments').insert({
            task_id: insertedTask.id,
            file_name: attachment.name,
            file_path: uploadData.path,
            file_type: attachment.type,
            uploaded_by_id: currentUser.id,
          });
        }
      }

      resetForm();
      loadBacklogData();
      toast({ title: "Sucesso!", description: `Tarefa "${insertedTask.title}" adicionada ao backlog.` });
    } catch (error) {
      console.error("Error adding task to backlog:", error);
      toast({ title: "Erro ao Adicionar Tarefa", description: error.message, variant: "destructive" });
    }
  };

  return {
    showForm,
    toggleForm,
    formState: {
      title, setTitle,
      objectiveId, setObjectiveId,
      responsibleId, setResponsibleId,
      dueDate, setDueDate,
      description, setDescription,
      attachments, setAttachments,
    },
    handleAddTask,
  };
};

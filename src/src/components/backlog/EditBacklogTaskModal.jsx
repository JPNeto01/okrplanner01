import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Paperclip, Trash2, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';

const EditBacklogTaskModal = ({ isOpen, onClose, task, onSave, allUsers, objectives, currentUser }) => {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [responsibleId, setResponsibleId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [objectiveId, setObjectiveId] = useState('');
  const [description, setDescription] = useState('');
  
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [newAttachments, setNewAttachments] = useState([]);
  const [attachmentsToRemove, setAttachmentsToRemove] = useState([]);
  
  const fileInputRef = useRef(null);

  const [taskAssignableUsers, setTaskAssignableUsers] = useState([]);
  const [availableObjectives, setAvailableObjectives] = useState([]);

  useEffect(() => {
    const fetchTaskAttachments = async () => {
      if (task?.id) {
        const { data, error } = await supabase
          .from('task_attachments')
          .select('id, file_name, file_path, file_type')
          .eq('task_id', task.id);
        if (error) {
          console.error("Error fetching task attachments:", error);
          toast({ title: "Erro ao buscar anexos", description: error.message, variant: "destructive" });
          setExistingAttachments([]);
        } else {
          setExistingAttachments(data.map(att => ({ ...att, name: att.file_name })));
        }
      } else {
        setExistingAttachments([]);
      }
    };

    if (isOpen && task) {
      fetchTaskAttachments();
      setTitle(task.title || '');
      setResponsibleId(task.responsible_id || task.responsible || '');
      setDueDate(task.due_date || task.dueDate || '');
      setObjectiveId(task.objective_id || task.objectiveId || '');
      setDescription(task.description || '');
      setNewAttachments([]);
      setAttachmentsToRemove([]);

      if (allUsers.length > 0 && objectives.length > 0 && currentUser) {
        const filteredAssignableUsers = allUsers.filter(user => 
          ['team_member', 'scrum_master', 'product_owner', 'admin'].includes(user.user_group) &&
          (currentUser.group === 'admin' || user.company === task.company)
        );
        setTaskAssignableUsers(filteredAssignableUsers);

        const filteredObjectives = objectives.filter(obj => 
          currentUser.group === 'admin' || 
          (obj.company === (task.company || currentUser.company) && 
            (
              currentUser.group === 'product_owner' || 
              (currentUser.group === 'scrum_master' && obj.coordinator_scrum_master_id === currentUser.id)
            )
          )
        );
        setAvailableObjectives(filteredObjectives);
      }
    }
  }, [task, allUsers, objectives, currentUser, isOpen, toast]);


  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    const totalAttachments = existingAttachments.length + newAttachments.length + files.length - attachmentsToRemove.length;
    if (totalAttachments > 5) {
      toast({
        title: "Limite de anexos",
        description: `Você pode anexar no máximo 5 arquivos.`,
        variant: "destructive",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const newlySelectedFiles = [];
    for (const file of files) {
      const allowedTypes = [
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
        'application/vnd.ms-excel', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
        'image/jpeg', 
        'image/png', 
        'image/gif',
        'application/pdf'
      ];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Tipo de arquivo inválido",
          description: `O arquivo "${file.name}" não é suportado.`,
          variant: "destructive",
        });
        continue;
      }
      newlySelectedFiles.push({ name: file.name, type: file.type, id: `new-file-${Date.now()}-${Math.random()}`, file: file });
    }
    setNewAttachments(prev => [...prev, ...newlySelectedFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeExistingAttachment = (attachmentId) => {
    setExistingAttachments(prev => prev.filter(att => att.id !== attachmentId));
    setAttachmentsToRemove(prev => [...prev, attachmentId]);
  };

  const removeNewAttachment = (attachmentId) => {
    setNewAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      title: task.title, 
      responsible: task.responsible_id, 
      dueDate: task.due_date, 
      objectiveId: task.objective_id, 
      description,
      newAttachments,
      attachmentsToRemove,
    });
  };

  if (!isOpen || !task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px] bg-white dark:bg-slate-900">
        <DialogHeader>
          <DialogTitle className="text-xl text-primary dark:text-primary-foreground">Editar Tarefa do Backlog</DialogTitle>
          <DialogDescription>
            Modifique a descrição ou anexos da tarefa "{task.title}". Outros campos não podem ser alterados aqui.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <ScrollArea className="max-h-[60vh] p-1 pr-3">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right col-span-1">Título</Label>
                <Input id="title" value={title} className="col-span-3" disabled={true} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="objectiveId" className="text-right col-span-1">Objetivo</Label>
                <Select value={objectiveId} disabled={true}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione o Objetivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableObjectives.map(obj => (
                      <SelectItem key={obj.id} value={obj.id}>{obj.title}</SelectItem>
                    ))}
                    {objectiveId && !availableObjectives.find(o => o.id === objectiveId) && objectives.find(o => o.id === objectiveId) && (
                        <SelectItem value={objectiveId} disabled>
                          {objectives.find(o => o.id === objectiveId)?.title || 'Objetivo desconhecido'}
                        </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="responsible" className="text-right col-span-1">Responsável</Label>
                <Select value={responsibleId} disabled={true}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione o Responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    {taskAssignableUsers.map(user => (
                      <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))}
                     {responsibleId && !taskAssignableUsers.find(u => u.id === responsibleId) && (
                        <SelectItem value={responsibleId} disabled>
                          {allUsers.find(u => u.id === responsibleId)?.name || 'Usuário desconhecido'}
                        </SelectItem>
                      )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dueDate" className="text-right col-span-1">Prazo</Label>
                <Input id="dueDate" type="date" value={dueDate} className="col-span-3" disabled={true} />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="description" className="text-right col-span-1 pt-2">Descrição</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" rows={3} placeholder="Adicione uma descrição detalhada..." />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="attachments" className="text-right col-span-1 pt-2">Anexos</Label>
                <div className="col-span-3 space-y-2">
                  <Input id="attachments" type="file" multiple ref={fileInputRef} onChange={handleFileChange} 
                    accept=".doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/*"
                  />
                  {(existingAttachments.length > 0 || newAttachments.length > 0) && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Arquivos anexados:</p>
                      {existingAttachments.map((att) => (
                        <div key={att.id} className="flex items-center justify-between text-xs p-1.5 bg-slate-100 dark:bg-slate-800 rounded">
                          <div className="flex items-center truncate">
                            <Paperclip className="h-3 w-3 mr-1.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                            <span className="truncate">{att.name}</span>
                          </div>
                          <Button type="button" variant="ghost" size="icon" className="h-5 w-5 flex-shrink-0" onClick={() => removeExistingAttachment(att.id)}>
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      ))}
                      {newAttachments.map((att) => (
                        <div key={att.id} className="flex items-center justify-between text-xs p-1.5 bg-blue-100 dark:bg-blue-800/30 rounded">
                          <div className="flex items-center truncate">
                            <Paperclip className="h-3 w-3 mr-1.5 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                            <span className="truncate">{att.name} (Novo)</span>
                          </div>
                          <Button type="button" variant="ghost" size="icon" className="h-5 w-5 flex-shrink-0" onClick={() => removeNewAttachment(att.id)}>
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="pt-4 border-t dark:border-slate-700">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-white">
              <Save className="h-4 w-4 mr-2" /> Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditBacklogTaskModal;
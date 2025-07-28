import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Paperclip, Trash2, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

const EditTaskInKrModal = ({ isOpen, onClose, task, onSave, allUsers }) => {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [responsible, setResponsible] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [newAttachments, setNewAttachments] = useState([]);
  const [attachmentsToRemove, setAttachmentsToRemove] = useState([]);

  const fileInputRef = useRef(null);
  const [taskAssignableUsers, setTaskAssignableUsers] = useState([]);

  useEffect(() => {
    const fetchTaskAttachments = async () => {
      if (task?.id) {
        const { data, error } = await supabase
          .from('task_attachments')
          .select('id, file_name, file_path, file_type')
          .eq('task_id', task.id);
        if (error) {
          console.error("Error fetching task attachments for EditTaskInKrModal:", error);
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
      setResponsible(task.responsible_id || task.responsible || '');
      setDueDate(task.due_date || task.dueDate || '');
      setDescription(task.description || '');
      setNewAttachments([]);
      setAttachmentsToRemove([]);

      if (allUsers && allUsers.length > 0 && currentUser) {
        const companyContext = task.company || currentUser.company || '';
        setTaskAssignableUsers(allUsers.filter(user => 
          ['team_member', 'scrum_master', 'product_owner', 'admin'].includes(user.user_group) &&
          (currentUser.group === 'admin' || user.company === companyContext)
        ));
      }
    }
  }, [isOpen, task, allUsers, currentUser]);


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
    // Validar dueDate se estiver preenchido
    if (dueDate) {
      const dateParts = dueDate.split('-');
      if (dateParts.length !== 3 || isNaN(new Date(dueDate).getTime())) {
        toast({
          title: "Data Inválida",
          description: "O formato da data do prazo é inválido. Use AAAA-MM-DD.",
          variant: "destructive",
        });
        return;
      }
    }

    onSave({
      title: task.title, 
      responsible: task.responsible_id, 
      dueDate: dueDate, 
      description, 
      newAttachments,
      attachmentsToRemove,
      status: task.status, 
      objectiveId: task.objective_id,
    });
  };

  if (!isOpen || !task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px] bg-white dark:bg-slate-900">
        <DialogHeader>
          <DialogTitle className="text-xl text-primary dark:text-primary-foreground">Editar Tarefa</DialogTitle>
          <DialogDescription>
            Modifique os detalhes da tarefa "{task.title}". O título e o responsável não podem ser alterados aqui.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto p-1 pr-3">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-task-title-modal" className="text-right col-span-1">Título</Label>
              <Input id="edit-task-title-modal" value={title} className="col-span-3" disabled={true} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-task-responsible-modal" className="text-right col-span-1">Responsável</Label>
              <Select value={responsible} disabled={true}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o Responsável" />
                </SelectTrigger>
                <SelectContent>
                  {taskAssignableUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                  ))}
                  {responsible && !taskAssignableUsers.find(u => u.id === responsible) && allUsers && allUsers.length > 0 && (
                    <SelectItem value={responsible} disabled>
                      {allUsers.find(u => u.id === responsible)?.name || 'Usuário desconhecido'}
                    </SelectItem>
                  )}
                   {responsible && !taskAssignableUsers.find(u => u.id === responsible) && (!allUsers || allUsers.length === 0) && (
                     <SelectItem value={responsible} disabled>Responsável (Carregando...)</SelectItem>
                   )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-task-dueDate-modal" className="text-right col-span-1">Prazo</Label>
              <Input id="edit-task-dueDate-modal" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="edit-task-description-modal" className="text-right col-span-1 pt-2">Descrição</Label>
              <Textarea id="edit-task-description-modal" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" rows={3} placeholder="Adicione uma descrição detalhada..." />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="edit-task-attachments-modal" className="text-right col-span-1 pt-2">Anexos (Máx. 5)</Label>
              <div className="col-span-3 space-y-2">
                <Input id="edit-task-attachments-modal" type="file" multiple ref={fileInputRef} onChange={handleFileChange} 
                  accept=".doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/*,application/pdf"
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

export default EditTaskInKrModal;
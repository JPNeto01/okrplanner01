import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Paperclip, Trash2, Save, CalendarDays, User } from 'lucide-react';

const AddTaskForm = ({ isOpen, onClose, onAddTask, allUsers = [], currentUser, objectiveCompany }) => {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [responsible, setResponsible] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [newAttachments, setNewAttachments] = useState([]); // Apenas novos anexos
  const fileInputRef = React.useRef(null);
  const [taskAssignableUsers, setTaskAssignableUsers] = useState([]);

  useEffect(() => {
    if (isOpen) { // Resetar estado ao abrir
        setTitle('');
        setResponsible('');
        setDueDate('');
        setDescription('');
        setNewAttachments([]);
        if (allUsers.length > 0 && currentUser && objectiveCompany !== undefined) {
          const filtered = allUsers.filter(user => 
            ['team_member', 'scrum_master', 'product_owner', 'admin'].includes(user.user_group) &&
            (currentUser.group === 'admin' || user.company === objectiveCompany)
          );
          setTaskAssignableUsers(filtered);
        } else {
          setTaskAssignableUsers([]);
        }
    }
  }, [isOpen, allUsers, currentUser, objectiveCompany]);


  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    const totalAttachments = newAttachments.length + files.length;
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

  const removeNewAttachment = (attachmentId) => {
    setNewAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !responsible || !dueDate) {
      toast({ title: "Campos Obrigatórios", description: "Título, Responsável e Prazo são obrigatórios.", variant: "destructive" });
      return;
    }
    onAddTask({ title, responsible, dueDate, description, newAttachments }); // Passar newAttachments
    onClose(); // Fechar e resetar será feito pelo useEffect no isOpen
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[525px] bg-white dark:bg-slate-900">
        <DialogHeader>
          <DialogTitle className="text-xl text-primary dark:text-primary-foreground">Adicionar Nova Tarefa ao KR</DialogTitle>
          <DialogDescription>Preencha os detalhes da nova tarefa.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto p-1 pr-3">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="task-title" className="text-right col-span-1">Título</Label>
              <Input id="task-title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="task-responsible" className="text-right col-span-1">Responsável</Label>
              <div className="col-span-3 relative">
                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Select value={responsible} onValueChange={setResponsible} required>
                  <SelectTrigger id="task-responsible" className="pl-8" disabled={taskAssignableUsers.length === 0}>
                    <SelectValue placeholder={taskAssignableUsers.length === 0 ? "Nenhum usuário para atribuir" : "Selecione o Responsável"} />
                  </SelectTrigger>
                  <SelectContent>
                    {taskAssignableUsers.map(user => (
                      <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="task-dueDate" className="text-right col-span-1">Prazo</Label>
              <div className="col-span-3 relative">
                <CalendarDays className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="task-dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="col-span-3 pl-8" required />
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="task-description" className="text-right col-span-1 pt-2">Descrição</Label>
              <Textarea id="task-description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" rows={3} placeholder="Adicione uma descrição detalhada..." />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="task-attachments" className="text-right col-span-1 pt-2">Anexos (Máx. 5)</Label>
              <div className="col-span-3 space-y-2">
                <Input id="task-attachments" type="file" multiple ref={fileInputRef} onChange={handleFileChange} 
                  accept=".doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/*,application/pdf"
                />
                {newAttachments.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Arquivos a serem anexados:</p>
                    {newAttachments.map((att) => (
                      <div key={att.id} className="flex items-center justify-between text-xs p-1.5 bg-blue-100 dark:bg-blue-800/30 rounded">
                        <div className="flex items-center truncate">
                          <Paperclip className="h-3 w-3 mr-1.5 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                          <span className="truncate">{att.name}</span>
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
              <Save className="h-4 w-4 mr-2" /> Adicionar Tarefa
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTaskForm;
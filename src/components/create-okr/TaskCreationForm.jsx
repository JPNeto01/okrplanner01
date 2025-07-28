import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, PlusCircle, CalendarDays, User, Paperclip } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/components/ui/use-toast';

const TaskCreationForm = ({ 
  tasks, 
  setTasks, 
  teamMembersForTasks, 
  objectiveCompany, 
  currentUser, 
  isKrCreationContext = false 
}) => {
  const { toast } = useToast();
  
  const filteredTeamMembers = teamMembersForTasks.filter(user =>
    currentUser.group === 'admin' || user.company === objectiveCompany
  );

  const handleAddTask = () => {
    setTasks([...tasks, { 
      id: `new-task-${Date.now()}-${Math.random()}`, 
      title: '', 
      responsible: '', 
      dueDate: '', 
      status: 'A Fazer', 
      description: '', 
      attachments: [] 
    }]);
  };

  const handleRemoveTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const handleTaskChange = (id, field, value) => {
    setTasks(tasks.map(task => task.id === id ? { ...task, [field]: value } : task));
  };

  const handleFileChange = (taskId, event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    const currentTask = tasks.find(t => t.id === taskId);
    if (!currentTask) return;

    const totalAttachments = (currentTask.attachments?.length || 0) + files.length;
    if (totalAttachments > 5) {
      toast({
        title: "Limite de anexos",
        description: "Você pode anexar no máximo 5 arquivos por tarefa.",
        variant: "destructive",
      });
      if (event.target) event.target.value = "";
      return;
    }
    
    const newFilesToAdd = [];
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
      newFilesToAdd.push({ name: file.name, type: file.type, id: `new-file-${Date.now()}-${Math.random()}`, file: file });
    }

    if (newFilesToAdd.length > 0) {
      handleTaskChange(taskId, 'attachments', [...(currentTask.attachments || []), ...newFilesToAdd]);
    }
    
    if (event.target) event.target.value = "";
  };

  const removeAttachment = (taskId, attachmentId) => {
    const currentTask = tasks.find(t => t.id === taskId);
    if (currentTask) {
      handleTaskChange(taskId, 'attachments', currentTask.attachments.filter(att => att.id !== attachmentId));
    }
  };

  return (
    <div className="space-y-4">
      {tasks.map((task, index) => (
        <div key={task.id} className="p-4 border rounded-lg shadow-sm bg-slate-50 dark:bg-slate-700/50 space-y-3">
          <div className="flex justify-between items-center">
            <Label className="font-medium text-primary dark:text-primary-foreground">Tarefa {index + 1}</Label>
            <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveTask(task.id)} className="text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4 mr-1" /> Remover
            </Button>
          </div>
          <div>
            <Label htmlFor={`taskTitle-${task.id}`}>Título da Tarefa</Label>
            <Input
              id={`taskTitle-${task.id}`}
              type="text"
              value={task.title}
              onChange={e => handleTaskChange(task.id, 'title', e.target.value)}
              placeholder="Ex: Desenvolver nova funcionalidade X"
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor={`taskResponsible-${task.id}`}>Responsável</Label>
               <div className="relative">
                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Select value={task.responsible} onValueChange={value => handleTaskChange(task.id, 'responsible', value)} required>
                    <SelectTrigger id={`taskResponsible-${task.id}`} className="pl-8" disabled={filteredTeamMembers.length === 0}>
                        <SelectValue placeholder={filteredTeamMembers.length === 0 ? "Nenhum usuário para atribuir" : "Selecione um responsável"} />
                    </SelectTrigger>
                    <SelectContent>
                        {filteredTeamMembers.map(user => (
                            <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor={`taskDueDate-${task.id}`}>Data de Entrega</Label>
              <div className="relative">
                <CalendarDays className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id={`taskDueDate-${task.id}`}
                  type="date"
                  value={task.dueDate}
                  onChange={e => handleTaskChange(task.id, 'dueDate', e.target.value)}
                  className="pl-8"
                  required
                />
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor={`taskDescription-${task.id}`}>Descrição</Label>
            <Textarea
              id={`taskDescription-${task.id}`}
              value={task.description}
              onChange={(e) => handleTaskChange(task.id, 'description', e.target.value)}
              placeholder="Detalhes sobre a tarefa (opcional)"
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor={`taskAttachments-${task.id}`}>Anexos (Opcional, Máx. 5)</Label>
            <Input 
              id={`taskAttachments-${task.id}`} 
              type="file" 
              multiple
              onChange={(e) => handleFileChange(task.id, e)} 
              className="mt-1"
              accept=".doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/*,application/pdf"
            />
            {task.attachments && task.attachments.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-xs text-muted-foreground">Arquivos a serem anexados:</p>
                {task.attachments.map((att) => (
                  <div key={att.id} className="flex items-center justify-between text-xs p-1.5 bg-slate-100 dark:bg-slate-700 rounded">
                    <div className="flex items-center">
                      <Paperclip className="h-3 w-3 mr-1.5 text-gray-500 dark:text-gray-400" />
                      <span>{att.name}</span>
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeAttachment(task.id, att.id)}>
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
           {!isKrCreationContext && (
             <div>
                <Label htmlFor={`taskStatus-${task.id}`}>Status Inicial</Label>
                <Select value={task.status} onValueChange={value => handleTaskChange(task.id, 'status', value)}>
                    <SelectTrigger id={`taskStatus-${task.id}`}>
                        <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="A Fazer">A Fazer</SelectItem>
                        <SelectItem value="Em Progresso">Em Progresso</SelectItem>
                        <SelectItem value="Concluído">Concluído</SelectItem>
                    </SelectContent>
                </Select>
            </div>
           )}
        </div>
      ))}
      <Button type="button" variant="outline" onClick={handleAddTask} className="w-full text-primary border-primary hover:bg-primary/10">
        <PlusCircle className="h-4 w-4 mr-2" /> Adicionar {isKrCreationContext ? 'Outra Tarefa Customizada' : 'Tarefa'}
      </Button>
    </div>
  );
};

export default TaskCreationForm;
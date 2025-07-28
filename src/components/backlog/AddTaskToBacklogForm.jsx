import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CalendarDays, Paperclip, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/components/ui/use-toast';

const AddTaskToBacklogForm = ({
  onSubmit,
  newTaskTitle, setNewTaskTitle,
  newTaskObjectiveId, setNewTaskObjectiveId,
  newTaskResponsible, setNewTaskResponsible,
  newTaskDueDate, setNewTaskDueDate,
  newTaskDescription, setNewTaskDescription,
  newTaskAttachments, setNewTaskAttachments,
  objectives,
  taskAssignableUsers,
  currentUser
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files); 
    
    if (files.length === 0) return;

    const currentAttachments = newTaskAttachments || [];
    const totalAttachments = currentAttachments.length + files.length;

    if (totalAttachments > 5) {
      toast({
        title: "Limite de anexos",
        description: `Você pode anexar no máximo 5 arquivos. Você já tem ${currentAttachments.length} e tentou adicionar ${files.length}.`,
        variant: "destructive",
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; 
      }
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
          description: `O arquivo "${file.name}" não é suportado. Por favor, selecione Word, Excel, PDF ou imagens (JPG, PNG, GIF).`,
          variant: "destructive",
        });
        continue;
      }
      newFilesToAdd.push({ name: file.name, type: file.type, id: `new-file-${Date.now()}-${Math.random()}`, file: file });
    }

    if (newFilesToAdd.length > 0) {
      setNewTaskAttachments([...currentAttachments, ...newFilesToAdd]);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; 
    }
  };

  const removeAttachment = (attachmentId) => {
    const currentAttachments = newTaskAttachments || [];
    setNewTaskAttachments(currentAttachments.filter(att => att.id !== attachmentId));
  };

  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
      <Card className="max-w-2xl mx-auto shadow-lg bg-white/90 dark:bg-slate-800/90">
        <CardHeader>
          <CardTitle>Nova Tarefa para o Backlog da Empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="newTaskTitle">Título da Tarefa</Label>
              <Input id="newTaskTitle" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Ex: Pesquisar novas tecnologias" required />
            </div>
            <div>
                <Label htmlFor="newTaskObjectiveId">Vincular ao Objetivo</Label>
                <Select value={newTaskObjectiveId} onValueChange={setNewTaskObjectiveId} required>
                    <SelectTrigger id="newTaskObjectiveId">
                        <SelectValue placeholder="Selecione um Objetivo" />
                    </SelectTrigger>
                    <SelectContent>
                        {objectives.map(obj => (
                            <SelectItem key={obj.id} value={obj.id}>{obj.title} ({obj.company})</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="newTaskResponsible">Responsável Sugerido</Label>
                 <Select value={newTaskResponsible} onValueChange={setNewTaskResponsible} required>
                    <SelectTrigger id="newTaskResponsible">
                        <SelectValue placeholder="Selecione um responsável" />
                    </SelectTrigger>
                    <SelectContent>
                        {taskAssignableUsers
                            .filter(u => currentUser.group === 'admin' || u.company === currentUser.company)
                            .map(user => (
                                <SelectItem key={user.id} value={user.id}>{user.name} ({user.company})</SelectItem>
                            ))
                        }
                    </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="newTaskDueDate">Data de Entrega Sugerida</Label>
                <div className="relative">
                    <CalendarDays className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="newTaskDueDate" type="date" value={newTaskDueDate} onChange={(e) => setNewTaskDueDate(e.target.value)} className="pl-8" required />
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="newTaskDescription">Descrição da Tarefa</Label>
              <Textarea id="newTaskDescription" value={newTaskDescription} onChange={(e) => setNewTaskDescription(e.target.value)} placeholder="Detalhes sobre a tarefa..." />
            </div>
            <div>
              <Label htmlFor="newTaskAttachments">Anexos (Máx. 5)</Label>
              <Input 
                id="newTaskAttachments" 
                type="file" 
                multiple
                ref={fileInputRef}
                onChange={handleFileChange} 
                className="mt-1"
                accept=".doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/*,application/pdf"
              />
              {(newTaskAttachments && newTaskAttachments.length > 0) && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-muted-foreground">Arquivos a serem anexados:</p>
                  {newTaskAttachments.map((att) => (
                    <div key={att.id} className="flex items-center justify-between text-xs p-1.5 bg-slate-100 dark:bg-slate-700 rounded">
                      <div className="flex items-center">
                        <Paperclip className="h-3 w-3 mr-1.5 text-gray-500 dark:text-gray-400" />
                        <span>{att.name}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeAttachment(att.id)}>
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90">Adicionar Tarefa</Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AddTaskToBacklogForm;
import React, { useState, useRef, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle, CheckCircle, Clock, CalendarClock, Paperclip, FileText, Trash2, ChevronDown, ChevronUp, Save, Zap, Target } from 'lucide-react';
import { getTaskUrgency, getDaysUntilDue } from '@/lib/dateUtils';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';

const MyTaskItem = ({ task, objectiveId, krId, onTaskStatusChange, onSaveTaskDetails }) => {
  const { toast } = useToast();
  const urgency = getTaskUrgency(task.dueDate, task.status);
  const daysUntilDue = getDaysUntilDue(task.dueDate);
  const [isExpanded, setIsExpanded] = useState(false);
  const [description, setDescription] = useState(task.description || '');
  
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [newAttachments, setNewAttachments] = useState([]);
  const [attachmentsToRemove, setAttachmentsToRemove] = useState([]);

  const fileInputRef = useRef(null);

  useEffect(() => {
    setDescription(task.description || '');
    const fetchTaskAttachments = async () => {
      if (task?.id) {
        const { data, error } = await supabase
          .from('task_attachments')
          .select('id, file_name, file_path, file_type')
          .eq('task_id', task.id);
        if (error) {
          console.error("Error fetching task attachments for MyTaskItem:", error);
          setExistingAttachments([]);
        } else {
          setExistingAttachments(data.map(att => ({ ...att, name: att.file_name })));
        }
      } else {
        setExistingAttachments([]);
      }
    };
    if (isExpanded) {
      fetchTaskAttachments();
    }
    setNewAttachments([]);
    setAttachmentsToRemove([]);
  }, [task, isExpanded]);

  const getTaskUrgencyStyles = () => {
    const baseStyle = {
        bgColor: 'bg-slate-100 dark:bg-slate-700/60',
        textColor: 'text-gray-700 dark:text-gray-300',
        icon: <Clock className="h-5 w-5 text-gray-400 mr-2" />,
        titleText: `Prazo: ${task.dueDate ? new Date(task.dueDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não definido'}`,
        titleTextClass: '',
        contextTextColor: 'text-muted-foreground',
    };

    if (task.status === 'Concluído') {
        return {
            ...baseStyle,
            bgColor: 'bg-green-50/70 dark:bg-green-900/30',
            textColor: 'text-green-600 dark:text-green-400',
            icon: <CheckCircle className="h-5 w-5 text-green-500 mr-2" />,
            titleText: 'Concluído',
        };
    }

    switch (urgency) {
        case 'overdue':
            return {
                ...baseStyle,
                bgColor: 'bg-red-600 dark:bg-red-800',
                textColor: 'text-white font-bold',
                icon: <AlertTriangle className="h-5 w-5 text-white mr-2" />,
                titleText: `Atrasado (${Math.abs(daysUntilDue)} ${Math.abs(daysUntilDue) === 1 ? 'dia' : 'dias'})`,
                contextTextColor: 'text-red-100',
            };
        case 'due_today':
            return {
                ...baseStyle,
                bgColor: 'bg-red-100 dark:bg-red-900/40',
                textColor: 'text-red-700 dark:text-red-300 font-semibold',
                icon: <Zap className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />,
                titleText: 'Para entregar Hoje',
                titleTextClass: 'text-sm'
            };
        case 'due_in_1_day':
            return {
                ...baseStyle,
                bgColor: 'bg-yellow-50/80 dark:bg-yellow-800/40',
                textColor: 'text-yellow-700 dark:text-yellow-400 font-semibold',
                icon: <CalendarClock className="h-5 w-5 text-yellow-600 mr-2" />,
                titleText: 'Falta 1 dia para entregar',
            };
        case 'due_in_2_days':
            return {
                ...baseStyle,
                textColor: 'text-sky-700 dark:text-sky-400',
                icon: <CalendarClock className="h-5 w-5 text-sky-600 mr-2" />,
                titleText: 'Faltam 2 dias para entregar',
            };
        case 'due_in_3_days':
            return {
                ...baseStyle,
                textColor: 'text-sky-700 dark:text-sky-400',
                icon: <CalendarClock className="h-5 w-5 text-sky-600 mr-2" />,
                titleText: 'Faltam 3 dias para entregar',
            };
        default:
            return baseStyle;
    }
  };

  const styles = getTaskUrgencyStyles();

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

  const handleSaveDetails = () => {
    onSaveTaskDetails(objectiveId, krId, task.id, description, newAttachments, attachmentsToRemove);
  };
  
  const formattedDueDate = task.dueDate ? new Date(task.dueDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não definido';
  const formattedCompletedAt = task.completed_at ? new Date(task.completed_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;

  return (
    <div className={`p-4 border rounded-lg ${styles.bgColor} transition-all duration-300`}>
      <div className="flex flex-col space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <div className="flex-1">
            <div className={`flex items-center font-medium ${styles.textColor} mb-1`}>
              {styles.icon}
              <span className={task.status === 'Concluído' ? 'line-through' : ''}>{task.title}</span>
            </div>
            <div className={`flex items-center text-xs ${styles.contextTextColor} space-x-2`}>
              <Target className="h-3 w-3" />
              <span>KR: {task.krTitle}</span>
              <span>•</span>
              <span>Objetivo: {task.objectiveTitle}</span>
            </div>
            {task.status !== 'Concluído' && (
              <p className="text-xs text-muted-foreground mt-1">
                  <span className={`font-medium ${styles.textColor} ${styles.titleTextClass}`}>{styles.titleText}</span>
              </p>
            )}
            {task.status === 'Concluído' && formattedCompletedAt && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                Concluído em: {formattedCompletedAt}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Select value={task.status} onValueChange={(newStatus) => onTaskStatusChange(objectiveId, krId, task.id, newStatus)}>
              <SelectTrigger className="w-full sm:w-[140px] h-9 text-xs bg-white dark:bg-slate-600">
                <SelectValue placeholder="Mudar status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A Fazer" className="text-xs">A Fazer</SelectItem>
                <SelectItem value="Em Progresso" className="text-xs">Em Progresso</SelectItem>
                <SelectItem value="Concluído" className="text-xs">Concluído</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => setIsExpanded(!isExpanded)} className="h-9 w-9 bg-white dark:bg-slate-600">
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {isExpanded && (
          <div className="pt-3 border-t border-slate-300 dark:border-slate-600 space-y-4">
            <div>
              <Label htmlFor={`desc-${task.id}`} className="text-sm font-medium text-gray-700 dark:text-gray-300">Descrição da Tarefa</Label>
              <Textarea
                id={`desc-${task.id}`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Adicione uma descrição detalhada para esta tarefa..."
                className="mt-1 bg-white/70 dark:bg-slate-700/70"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor={`attach-${task.id}`} className="text-sm font-medium text-gray-700 dark:text-gray-300">Anexos (Máx. 5)</Label>
              <Input
                id={`attach-${task.id}`}
                type="file"
                multiple
                ref={fileInputRef}
                onChange={handleFileChange}
                className="mt-1 bg-white/70 dark:bg-slate-700/70"
                accept=".doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/*,application/pdf"
              />
              {(existingAttachments.length > 0 || newAttachments.length > 0) && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-muted-foreground">Arquivos anexados:</p>
                  {existingAttachments.map((att) => (
                    <div key={att.id} className="flex items-center justify-between text-xs p-1.5 bg-slate-200 dark:bg-slate-600 rounded">
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
            <Button onClick={handleSaveDetails} size="sm" className="bg-primary hover:bg-primary/90 text-white">
              <Save className="h-4 w-4 mr-2" /> Salvar Detalhes
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTaskItem;
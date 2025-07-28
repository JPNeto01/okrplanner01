import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, CalendarDays, AlertTriangle, CheckCircle, Clock, FileText, Paperclip, Download } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';

const TaskDetailItem = ({ 
  task, 
  allUsers, 
  currentUser, 
  okrResponsibleId, 
  okrScrumMasterId, 
  onUpdate, 
  onStatusChange, 
  onRemove, 
  canEditTaskDetails, 
  canEditTaskStatusDirectly // This prop will now effectively be false for rendering the Select
}) => {
  const { toast } = useToast();
  const taskResponsibleUser = allUsers.find(u => u.id === task.responsible_id);
  const isOverdue = task.due_date && task.due_date < new Date().toISOString().split('T')[0] && task.status !== 'Concluído';
  
  const getTaskStatusIndicator = () => {
    const today = new Date().toISOString().split('T')[0];
    if (task.status === 'Concluído') {
      return <CheckCircle className="h-4 w-4 text-green-500" title="Concluído" />;
    }
    if (task.due_date && task.due_date < today) {
      return <AlertTriangle className="h-4 w-4 text-red-500" title={`Atrasado (Prazo: ${new Date(task.due_date + 'T00:00:00').toLocaleDateString()})`} />;
    }
    if (task.status === 'Em Progresso') {
      return <Clock className="h-4 w-4 text-yellow-500" title="Em Progresso" />;
    }
    return <Clock className="h-4 w-4 text-gray-400" title="A Fazer" />;
  };

  const formattedDueDate = task.due_date ? new Date(task.due_date + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A';
  const formattedCompletedAt = task.completed_at ? new Date(task.completed_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null;

  const handleDownloadAttachment = async (attachment) => {
    try {
      const { data, error } = await supabase.storage
        .from('task-attachments')
        .download(attachment.file_path);

      if (error) throw error;

      const blob = data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', attachment.file_name);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({ title: "Download Iniciado", description: `Baixando ${attachment.file_name}...` });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({ title: "Erro de Download", description: `Falha ao baixar o arquivo: ${error.message}`, variant: "destructive" });
    }
  };

  return (
    <div className={`p-3 border rounded-md space-y-2 text-sm ${isOverdue ? 'bg-red-50/70 dark:bg-red-900/40 border-red-300 dark:border-red-600' : 'bg-slate-50/70 dark:bg-slate-700/60'}`}>
      <div className="flex justify-between items-start">
        <p className="font-semibold text-gray-800 dark:text-gray-200 flex-grow break-words cursor-pointer hover:text-primary" onClick={() => onUpdate(task.id, 'viewDetails', true)} title="Clique para ver detalhes e editar">
            {task.title}
        </p>
        <div className="ml-2 flex-shrink-0">{getTaskStatusIndicator()}</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div>
          <span className="text-muted-foreground">Responsável: </span>
          <span className="font-medium">
            {taskResponsibleUser?.name || 'N/A'}
            {taskResponsibleUser?.avatar_url && <img  src={taskResponsibleUser.avatar_url} alt={taskResponsibleUser.name} className="w-4 h-4 rounded-full ml-1 inline-block"  src="https://images.unsplash.com/photo-1673432204136-48b48d1af6ca" />}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Status: </span>
          {/* Select for status change removed as per request */}
          <span className="font-medium">{task.status}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Prazo: </span>
          <span className={`font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : ''}`}>
            {formattedDueDate}
          </span>
        </div>
        {task.status === 'Concluído' && formattedCompletedAt && (
          <div>
            <span className="text-muted-foreground">Concluído em: </span>
            <span className="font-medium text-green-600 dark:text-green-400">{formattedCompletedAt}</span>
          </div>
        )}
      </div>
      
      {task.description && (
        <div className="mt-1 pt-1 border-t border-slate-200 dark:border-slate-600">
          <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-0.5 flex items-center">
            <FileText className="h-3 w-3 mr-1" /> Descrição:
          </h4>
          <p className="text-xs text-muted-foreground whitespace-pre-wrap truncate max-h-10 overflow-hidden" title={task.description}>{task.description}</p>
        </div>
      )}

      {task.attachments && task.attachments.length > 0 && (
        <div className="mt-1 pt-1 border-t border-slate-200 dark:border-slate-600">
          <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-0.5 flex items-center">
            <Paperclip className="h-3 w-3 mr-1" /> Anexos:
          </h4>
          <ul className="text-xs text-muted-foreground list-none space-y-0.5">
            {task.attachments.slice(0,2).map((att, index) => ( 
              <li key={att.id || index} className="truncate flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-600/50 p-0.5 rounded">
                <span className="truncate" title={att.file_name}>- {att.file_name || att.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 ml-2 flex-shrink-0 text-blue-500 hover:text-blue-700"
                  onClick={() => handleDownloadAttachment(att)}
                  title={`Baixar ${att.file_name || att.name}`}
                >
                  <Download className="h-3 w-3" />
                </Button>
              </li>
            ))}
            {task.attachments.length > 2 && <li className="text-blue-500 cursor-pointer" onClick={() => onUpdate(task.id, 'viewDetails', true)} >...e mais {task.attachments.length - 2}</li>}
          </ul>
        </div>
      )}

      {/* Message to guide users to "My Tasks" for status change */}
      {(currentUser.group === 'team_member' || (currentUser.group === 'scrum_master' && task.responsible_id === currentUser.id)) && task.status !== 'Concluído' &&
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Para alterar o status desta tarefa, vá para "Minhas Tarefas".</p>
      }
       {/* Make task title clickable to open edit modal */}
        <Button variant="link" size="sm" className="text-xs p-0 h-auto mt-1 text-primary hover:underline" onClick={() => onUpdate(task.id, 'viewDetails', true)}>
          Ver/Editar Detalhes
        </Button>
    </div>
  );
};

export default TaskDetailItem;
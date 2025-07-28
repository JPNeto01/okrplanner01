import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Target, CheckCircle, Clock, FileText, Edit, LogOut, Paperclip, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog.jsx";
import EditBacklogTaskModal from '@/components/backlog/EditBacklogTaskModal';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';

const BacklogTaskList = ({ tasks, allAppUsers, objectives, currentUser, onDeleteTask, onUpdateTask, onRemoveTaskFromKr }) => {
  const [editingTask, setEditingTask] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [taskAttachments, setTaskAttachments] = useState({});
  const { toast } = useToast();

  const fetchAttachmentsForTask = async (taskId) => {
    if (!taskId || taskAttachments[taskId]) return; 
    try {
      const { data, error } = await supabase
        .from('task_attachments')
        .select('id, file_name, file_path, file_type')
        .eq('task_id', taskId);
      if (error) {
        console.error("Error fetching attachments:", error);
        setTaskAttachments(prev => ({ ...prev, [taskId]: [] }));
      } else {
        setTaskAttachments(prev => ({ ...prev, [taskId]: data.map(att => ({ ...att, name: att.file_name })) }));
      }
    } catch (error) {
      console.error("Error in fetchAttachmentsForTask:", error);
      setTaskAttachments(prev => ({ ...prev, [taskId]: [] }));
    }
  };
  
  useEffect(() => {
    tasks.forEach(task => {
      if (task.id && !taskAttachments[task.id]) {
        fetchAttachmentsForTask(task.id);
      }
    });
  }, [tasks]);


  const getObjectiveTitleById = (objId) => {
    const obj = objectives.find(o => o.id === objId);
    return obj ? obj.title : 'Objetivo Desconhecido';
  };

  const getTaskStatusBadge = (task) => {
    if (task.kr_id && task.status === 'Concluído') {
      return <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white"><CheckCircle className="mr-1 h-3 w-3" />Concluída no KR</Badge>;
    }
    if (task.kr_id && task.status === 'Em Progresso') {
      return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Em Andamento no KR</Badge>;
    }
    if (task.kr_id && task.status === 'A Fazer') {
      return <Badge variant="secondary" className="bg-yellow-400/80 text-yellow-800"><Clock className="mr-1 h-3 w-3" />Em KR (A Fazer)</Badge>;
    }
     if (task.status === 'Backlog') {
      return <Badge variant="outline">No Backlog</Badge>;
    }
    return <Badge variant="outline">{task.status}</Badge>;
  };

  const handleEditTask = async (task) => {
    setEditingTask(task);
    await fetchAttachmentsForTask(task.id); 
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditingTask(null);
    setIsEditModalOpen(false);
  };

  const handleSaveChanges = (updatedTaskData) => {
    onUpdateTask(editingTask.id, updatedTaskData);
    handleCloseEditModal();
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR');
  };
  
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    return new Date(dateTimeString).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

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

  const handleDownloadAllAttachments = async (taskId) => {
    const attachmentsToDownload = taskAttachments[taskId];
    if (!attachmentsToDownload || attachmentsToDownload.length === 0) {
      toast({ title: "Sem Anexos", description: "Não há anexos para baixar nesta tarefa.", variant: "info" });
      return;
    }
    toast({ title: "Iniciando Downloads", description: `Baixando ${attachmentsToDownload.length} anexo(s)... Por favor, aguarde.` });
    for (const att of attachmentsToDownload) {
      await handleDownloadAttachment(att); 
    }
  };


  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.map(task => {
          const responsibleUser = allAppUsers.find(u => u.id === task.responsible_id); 
          const objectiveOfTask = objectives.find(obj => obj.id === task.objective_id); 
          
          const isAdmin = currentUser.group === 'admin';
          const isProductOwnerOfObjective = currentUser.group === 'product_owner' && objectiveOfTask && objectiveOfTask.responsible_id === currentUser.id && currentUser.company === task.company;
          const isScrumMasterOfObjective = currentUser.group === 'scrum_master' && objectiveOfTask && objectiveOfTask.coordinator_scrum_master_id === currentUser.id && currentUser.company === task.company;
          const isScrumMasterOfKr = currentUser.group === 'scrum_master' && task.kr_responsible_id === currentUser.id && currentUser.company === task.company;

          const canEditTask = isAdmin || isProductOwnerOfObjective || isScrumMasterOfObjective;
          const canDeleteTask = (isAdmin || isProductOwnerOfObjective || isScrumMasterOfObjective) && !task.kr_id;
          const canRemoveFromKr = (isAdmin || isProductOwnerOfObjective || isScrumMasterOfObjective || isScrumMasterOfKr) && task.kr_id && task.status !== 'Concluído';
          const hasAttachments = taskAttachments[task.id] && taskAttachments[task.id].length > 0;

          return (
            <motion.div key={task.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card className="h-full flex flex-col bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-semibold text-primary dark:text-primary-foreground mb-1 leading-tight">{task.title}</CardTitle>
                    {getTaskStatusBadge(task)}
                  </div>
                  <CardDescription className="text-xs text-muted-foreground">
                    Prazo: {formatDate(task.dueDate)}
                    {task.status === 'Concluído' && task.completed_at && (
                      <span className="block text-green-600 dark:text-green-400">Concluído em: {formatDateTime(task.completed_at)}</span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-2 text-sm">
                  <div className="flex items-center">
                    <Target className="h-4 w-4 mr-2 text-indigo-500" />
                    <span className="font-medium">Objetivo:</span>&nbsp;
                    <span className="text-muted-foreground truncate" title={getObjectiveTitleById(task.objective_id)}>{getObjectiveTitleById(task.objective_id)}</span>
                  </div>
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="font-medium">Responsável:</span>&nbsp;
                    <span className="text-muted-foreground">{responsibleUser ? responsibleUser.name : 'Não atribuído'}</span>
                  </div>
                  {task.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 pt-1 line-clamp-2" title={task.description}>
                      {task.description}
                    </p>
                  )}
                  {hasAttachments && (
                    <div className="pt-1">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5">Anexos ({taskAttachments[task.id].length}):</p>
                      <div className="space-y-1 max-h-20 overflow-y-auto pr-1">
                        {taskAttachments[task.id].slice(0, 3).map(att => (
                          <div 
                            key={att.id} 
                            className="flex items-center justify-between text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                          >
                            <Paperclip className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span className="truncate" title={att.file_name}>{att.file_name}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 ml-1 flex-shrink-0 text-blue-500 hover:text-blue-700"
                              onClick={() => handleDownloadAttachment(att)}
                              title={`Baixar ${att.file_name}`}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        {taskAttachments[task.id].length > 3 && (
                           <p className="text-xs text-muted-foreground italic">... e mais {taskAttachments[task.id].length - 3}.</p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end space-x-2 pt-3 border-t dark:border-slate-700/50">
                  {hasAttachments && (
                    <Button variant="outline" size="sm" onClick={() => handleDownloadAllAttachments(task.id)} className="text-xs">
                      <Download className="mr-1 h-3 w-3" /> Baixar Todos
                    </Button>
                  )}
                  {canEditTask && (
                    <Button variant="outline" size="sm" onClick={() => handleEditTask(task)} className="text-xs">
                      <Edit className="mr-1 h-3 w-3" /> Detalhes
                    </Button>
                  )}
                  {canRemoveFromKr && (
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" className="text-xs bg-red-500/20 text-red-700 hover:bg-red-500/30 dark:bg-red-700/20 dark:text-red-400 dark:hover:bg-red-700/30 border-red-500/30 hover:border-red-500/40">
                                <LogOut className="mr-1 h-3 w-3" /> Remover do KR
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
                            <AlertDialogDescription>
                                Tem certeza que deseja remover a tarefa "{task.title}" deste KR? Ela voltará para o backlog do objetivo.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onRemoveTaskFromKr(task.kr_id, task.id)} className="bg-destructive hover:bg-destructive/90">
                                Confirmar Remoção
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  )}
                  {canDeleteTask && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="text-xs">
                          <Trash2 className="mr-1 h-3 w-3" /> Excluir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir a tarefa "{task.title}" do backlog? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDeleteTask(task.id)} className="bg-destructive hover:bg-destructive/90">
                            Confirmar Exclusão
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </CardFooter>
              </Card>
            </motion.div>
          );
        })}
      </div>
      {editingTask && (
        <EditBacklogTaskModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          task={editingTask}
          onSave={handleSaveChanges}
          allUsers={allAppUsers}
          objectives={objectives}
          currentUser={currentUser}
          initialAttachments={taskAttachments[editingTask.id] || []}
        />
      )}
    </>
  );
};

export default BacklogTaskList;
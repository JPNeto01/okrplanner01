import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { PlusCircle, Upload } from 'lucide-react'; 

import KrCard from '@/components/okr-detail/KrCard';
import AssignFromBacklogModal from '@/components/okr-detail/AssignFromBacklogModal';
import AddTaskForm from '@/components/okr-detail/AddTaskForm';
import OkrDetailHeader from '@/components/okr-detail/OkrDetailHeader';
import EditObjectiveModal from '@/components/okr-detail/EditObjectiveModal';
import EditTaskInKrModal from '@/components/okr-detail/EditTaskInKrModal';
import ObjectiveBatchTaskUploadModal from '@/components/okr-detail/ObjectiveBatchTaskUploadModal'; 
import EditKrDescriptionModal from '@/components/okr-detail/EditKrDescriptionModal';
import EditKrTitleModal from '@/components/okr-detail/EditKrTitleModal';
import EditKrDueDateModal from '@/components/okr-detail/EditKrDueDateModal';

import { useObjectiveDetailData } from '@/hooks/useObjectiveDetailData';
import { useObjectiveOperations } from '@/hooks/useObjectiveOperations';
import { useKrOperations } from '@/hooks/useKrOperations';
import { useTaskOperations } from '@/hooks/useTaskOperations';
import { calculateKrProgress } from '@/lib/okrUtils';


const OkrDetailPage = () => {
  const { objectiveId } = useParams();
  const { currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const { objective, allUsersState, isLoadingData, reloadObjectiveData } = useObjectiveDetailData(objectiveId, currentUser, authLoading, toast);
  
  const objectiveOps = useObjectiveOperations(objective, currentUser, reloadObjectiveData, toast);
  const krOps = useKrOperations(objective, currentUser, reloadObjectiveData, toast);
  const taskOps = useTaskOperations(objective, currentUser, reloadObjectiveData, krOps.updateKrStatusIfNeeded, toast);


  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isDirectAddTaskModalOpen, setIsDirectAddTaskModalOpen] = useState(false);
  const [selectedKrForTask, setSelectedKrForTask] = useState(null);
  const [currentKrTasks, setCurrentKrTasks] = useState([]);
  const [isEditingObjective, setIsEditingObjective] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [isObjectiveBatchUploadModalOpen, setIsObjectiveBatchUploadModalOpen] = useState(false); 
  const [isEditKrDescriptionModalOpen, setIsEditKrDescriptionModalOpen] = useState(false);
  const [isEditKrTitleModalOpen, setIsEditKrTitleModalOpen] = useState(false);
  const [isEditKrDueDateModalOpen, setIsEditKrDueDateModalOpen] = useState(false);
  const [editingKr, setEditingKr] = useState(null);


  const handleOpenAssignModal = (kr) => {
    setSelectedKrForTask(kr);
    setCurrentKrTasks(kr.tasks || []);
    setIsAssignModalOpen(true);
  };

  const handleOpenDirectAddTaskModal = (kr) => {
    setSelectedKrForTask(kr);
    setIsDirectAddTaskModalOpen(true);
  };
  
  const handleOpenEditTaskModal = (task) => {
    setEditingTask(task);
    setIsEditTaskModalOpen(true);
  };

  const handleOpenEditKrDescriptionModal = (kr) => {
    setEditingKr(kr);
    setIsEditKrDescriptionModalOpen(true);
  };

  const handleOpenEditKrTitleModal = (kr) => {
    setEditingKr(kr);
    setIsEditKrTitleModalOpen(true);
  };

  const handleOpenEditKrDueDateModal = (kr) => {
    setEditingKr(kr);
    setIsEditKrDueDateModalOpen(true);
  };

  const responsibleUser = useMemo(() => allUsersState.find(u => u.id === objective?.responsible_id), [allUsersState, objective]);
  const coordinatorScrumMasterUser = useMemo(() => allUsersState.find(u => u.id === objective?.coordinator_scrum_master_id), [allUsersState, objective]);

  const canAdministerObjective = useMemo(() => {
    if (!currentUser || !objective) return false;
    return currentUser.group === 'admin' || (currentUser.group === 'product_owner' && currentUser.id === objective.responsible_id);
  }, [currentUser, objective]);

  const canCoordinateObjectiveAsSM = useMemo(() => {
    if (!currentUser || !objective) return false;
    return currentUser.group === 'scrum_master' && currentUser.id === objective.coordinator_scrum_master_id;
  }, [currentUser, objective]);

  const showManagementButtons = canAdministerObjective || canCoordinateObjectiveAsSM;

  const sortedKeyResults = useMemo(() => {
    if (!objective || !objective.keyResults) return [];
    return [...objective.keyResults].sort((a, b) => {
      const progressA = calculateKrProgress(a.tasks || []);
      const progressB = calculateKrProgress(b.tasks || []);
      const isACompleted = progressA === 100 || a.status === 'Concluído';
      const isBCompleted = progressB === 100 || b.status === 'Concluído';

      if (isACompleted && !isBCompleted) return 1; 
      if (!isACompleted && isBCompleted) return -1; 
      
      
      const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
      const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
      return dateA.getTime() - dateB.getTime();
    });
  }, [objective]);

  if (authLoading || isLoadingData) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 text-white"><p>Carregando detalhes do objetivo...</p></div>;
  }

  if (!currentUser || !objective) {
    return <div className="min-h-screen flex items-center justify-center"><p>Objetivo não encontrado ou usuário não autenticado.</p></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 p-4 md:p-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <OkrDetailHeader
          objective={objective}
          responsibleUser={responsibleUser}
          coordinatorScrumMasterUser={coordinatorScrumMasterUser}
          canEditObjective={canAdministerObjective}
          canDeleteObjective={canAdministerObjective}
          onEditObjective={() => setIsEditingObjective(true)}
          onDeleteObjective={() => objectiveOps.handleDeleteObjective(navigate)}
        />
      </motion.div>

      <motion.div
        className="mt-6 mb-8 flex flex-col sm:flex-row justify-between items-center gap-3"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
      >
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">Key Results</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          {showManagementButtons && (
            <Button 
              onClick={() => setIsObjectiveBatchUploadModalOpen(true)} 
              variant="outline" 
              className="text-primary border-primary hover:bg-primary/10"
            >
              <Upload className="mr-2 h-5 w-5" /> Criar Tarefas em Lote
            </Button>
          )}
          {showManagementButtons && (
            <Button asChild className="bg-primary hover:bg-primary/90 text-white">
              <Link to={`/objective/${objectiveId}/create-kr`}>
                <PlusCircle className="mr-2 h-5 w-5" /> Adicionar Novo KR
              </Link>
            </Button>
          )}
        </div>
      </motion.div>

      {sortedKeyResults && sortedKeyResults.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedKeyResults.map(kr => (
            <KrCard
              key={kr.id}
              kr={kr}
              objectiveId={objective.id}
              allUsers={allUsersState}
              currentUser={currentUser}
              onTaskStatusChange={(taskId, newStatus) => taskOps.handleTaskStatusChange(kr.id, taskId, newStatus)}
              onOpenAssignModal={() => handleOpenAssignModal(kr)}
              onOpenDirectAddTaskModal={() => handleOpenDirectAddTaskModal(kr)}
              onDeleteKr={() => krOps.handleDeleteKr(kr.id)}
              onEditTask={(task) => handleOpenEditTaskModal(task)}
              onOpenEditKrDescriptionModal={handleOpenEditKrDescriptionModal}
              onOpenEditKrTitleModal={handleOpenEditKrTitleModal}
              onOpenEditKrDueDateModal={handleOpenEditKrDueDateModal}
              objectiveResponsible={objective.responsible_id}
              objectiveCoordinatorScrumMaster={objective.coordinator_scrum_master_id}
            />
          ))}
        </div>
      ) : (
        <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="text-center text-muted-foreground py-8"
        >
            Nenhum Key Result definido para este objetivo ainda.
        </motion.p>
      )}

      {isAssignModalOpen && selectedKrForTask && objective && (
        <AssignFromBacklogModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          onAssignTasks={(tasks) => krOps.handleAssignTasksToKr(selectedKrForTask, tasks)}
          currentOkrCompany={objective.company}
          currentOkrTasks={currentKrTasks}
          targetObjectiveId={objective.id}
        />
      )}

      {isDirectAddTaskModalOpen && selectedKrForTask && objective && (
        <AddTaskForm
          isOpen={isDirectAddTaskModalOpen}
          onClose={() => setIsDirectAddTaskModalOpen(false)}
          onAddTask={(data) => krOps.handleDirectAddTaskToKr(selectedKrForTask, data)}
          allUsers={allUsersState}
          currentUser={currentUser}
          objectiveCompany={objective.company}
        />
      )}

      {isEditingObjective && objective && (
        <EditObjectiveModal
          isOpen={isEditingObjective}
          onClose={() => setIsEditingObjective(false)}
          objectiveData={{
            title: objective.title,
            description: objective.description,
            responsible: objective.responsible_id,
            coordinatorScrumMaster: objective.coordinator_scrum_master_id || '_none_',
            dueDate: objective.due_date,
          }}
          onSave={(data) => {
            objectiveOps.handleSaveObjectiveChanges(data);
            setIsEditingObjective(false);
          }}
        />
      )}
      
      {isEditTaskModalOpen && editingTask && (
        <EditTaskInKrModal
          isOpen={isEditTaskModalOpen}
          onClose={() => { setIsEditTaskModalOpen(false); setEditingTask(null);}}
          task={editingTask}
          allUsers={allUsersState} 
          onSave={(data) => {
            taskOps.handleSaveTaskChanges(editingTask, data);
            setIsEditTaskModalOpen(false);
            setEditingTask(null);
          }}
        />
      )}

      {isObjectiveBatchUploadModalOpen && objective && (
        <ObjectiveBatchTaskUploadModal
          isOpen={isObjectiveBatchUploadModalOpen}
          onClose={() => setIsObjectiveBatchUploadModalOpen(false)}
          objective={objective}
          allAppUsers={allUsersState}
          currentUser={currentUser}
          onTasksCreated={() => {
            reloadObjectiveData(); 
            setIsObjectiveBatchUploadModalOpen(false); 
          }}
        />
      )}

      {isEditKrDescriptionModalOpen && editingKr && (
        <EditKrDescriptionModal
          isOpen={isEditKrDescriptionModalOpen}
          onClose={() => {
            setIsEditKrDescriptionModalOpen(false);
            setEditingKr(null);
          }}
          kr={editingKr}
          onSave={krOps.handleUpdateKrDescription}
        />
      )}

      {isEditKrTitleModalOpen && editingKr && (
        <EditKrTitleModal
          isOpen={isEditKrTitleModalOpen}
          onClose={() => {
            setIsEditKrTitleModalOpen(false);
            setEditingKr(null);
          }}
          kr={editingKr}
          onSave={krOps.handleUpdateKrTitle}
        />
      )}

      {isEditKrDueDateModalOpen && editingKr && (
        <EditKrDueDateModal
          isOpen={isEditKrDueDateModalOpen}
          onClose={() => {
            setIsEditKrDueDateModalOpen(false);
            setEditingKr(null);
          }}
          kr={editingKr}
          onSave={krOps.handleUpdateKrDueDate}
        />
      )}

      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} OKR Manager. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default OkrDetailPage;
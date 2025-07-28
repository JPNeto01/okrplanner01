import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Archive, ListChecks, CheckCircle, Clock } from 'lucide-react';
import BacklogHeader from '@/components/backlog/BacklogHeader';
import AddTaskToBacklogForm from '@/components/backlog/AddTaskToBacklogForm';
import BacklogSection from '@/components/backlog/BacklogSection';
import BacklogFilter from '@/components/backlog/BacklogFilter';
import { sortTasksByDeadline } from '@/lib/okrUtils';
import { useBacklogData } from '@/hooks/useBacklogData';
import { useBacklogForm } from '@/hooks/useBacklogForm';
import { useBacklogTaskManagement } from '@/hooks/useBacklogTaskManagement';
import BatchTaskUploadModal from '@/components/backlog/BatchTaskUploadModal';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

const BacklogPage = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const {
    allTasks,
    isLoadingData,
    allAppUsers,
    taskAssignableUsers,
    objectives,
    filteredObjectivesForSM,
    loadBacklogData,
  } = useBacklogData(currentUser, authLoading, toast);

  const {
    showForm,
    toggleForm,
    formState,
    handleAddTask,
  } = useBacklogForm(currentUser, objectives, loadBacklogData);

  const {
    handleRemoveTaskFromKr,
    handleDeleteTask,
    handleUpdateTask,
  } = useBacklogTaskManagement(currentUser, objectives, allTasks, loadBacklogData);

  const [selectedObjectiveFilter, setSelectedObjectiveFilter] = useState('all');
  const [isBatchUploadModalOpen, setIsBatchUploadModalOpen] = useState(false);
  const [hasShownAccessDeniedToast, setHasShownAccessDeniedToast] = useState(false);

  useEffect(() => {
    const handleForceReload = () => loadBacklogData();
    window.addEventListener('forceBacklogReload', handleForceReload);
    return () => window.removeEventListener('forceBacklogReload', handleForceReload);
  }, [loadBacklogData]);
  
  useEffect(() => {
    if (!isLoadingData && !authLoading && !(currentUser?.group === 'admin' || currentUser?.group === 'product_owner' || currentUser?.group === 'scrum_master') && !hasShownAccessDeniedToast) {
      toast({ title: "Acesso Negado", description: "Você não tem permissão para visualizar o backlog da empresa.", variant: "destructive" });
      setHasShownAccessDeniedToast(true);
    }
  }, [isLoadingData, authLoading, currentUser, toast, hasShownAccessDeniedToast]);

  const distributedTasks = useMemo(() => {
    const filteredByObjective = selectedObjectiveFilter === 'all' 
      ? allTasks 
      : allTasks.filter(task => task.objective_id === selectedObjectiveFilter);

    return {
      inProgress: sortTasksByDeadline(filteredByObjective.filter(task => task.kr_id && task.status !== 'Concluído')),
      pureBacklog: sortTasksByDeadline(filteredByObjective.filter(task => !task.kr_id && task.status !== 'Concluído')),
      completed: sortTasksByDeadline(filteredByObjective.filter(task => task.status === 'Concluído')),
    };
  }, [selectedObjectiveFilter, allTasks]);

  const objectivesForFilter = currentUser?.group === 'scrum_master' ? filteredObjectivesForSM : objectives;
  const showCreateOptions = currentUser?.group === 'admin' || currentUser?.group === 'product_owner' || (currentUser?.group === 'scrum_master' && filteredObjectivesForSM.length > 0);

  if (isLoadingData || authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 text-white"><p>Carregando backlog...</p></div>;
  }

  if (!currentUser || !(currentUser.group === 'admin' || currentUser.group === 'product_owner' || currentUser.group === 'scrum_master')) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 p-4 md:p-8">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-8 pb-4 border-b border-slate-300 dark:border-slate-700">
        <BacklogHeader 
          canManageBacklogGlobal={showCreateOptions}
          onToggleAddTaskForm={toggleForm}
          showAddTaskForm={showForm}
        />
        {showCreateOptions && (
          <Button onClick={() => setIsBatchUploadModalOpen(true)} variant="secondary" className="mt-4 sm:mt-0">
            <Upload className="mr-2 h-4 w-4" /> Importar Tarefas em Lote
          </Button>
        )}
      </header>
      
      <BacklogFilter
        objectives={objectivesForFilter}
        selectedObjectiveFilter={selectedObjectiveFilter}
        onObjectiveFilterChange={setSelectedObjectiveFilter}
      />

      {showForm && <AddTaskToBacklogForm onSubmit={handleAddTask} {...formState} objectives={objectivesForFilter} taskAssignableUsers={taskAssignableUsers} currentUser={currentUser} />}

      {Object.values(distributedTasks).every(arr => arr.length === 0) && !showForm && !isLoadingData ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10">
          <Archive className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Backlog Vazio!</h2>
          <p className="text-muted-foreground">Nenhuma tarefa encontrada.</p>
        </motion.div>
      ) : (
        <>
          <BacklogSection title="Em Andamento (Em KRs)" tasks={distributedTasks.inProgress} icon={<Clock className="mr-2 h-6 w-6 text-yellow-500" />} {...{ selectedObjectiveFilter, allAppUsers, objectives, currentUser, onRemoveTaskFromKr: handleRemoveTaskFromKr, onDeleteTask: handleDeleteTask, onUpdateTask: handleUpdateTask }} />
          <BacklogSection title="No Backlog (Aguardando Atribuição)" tasks={distributedTasks.pureBacklog} icon={<ListChecks className="mr-2 h-6 w-6 text-blue-500" />} {...{ selectedObjectiveFilter, allAppUsers, objectives, currentUser, onRemoveTaskFromKr: handleRemoveTaskFromKr, onDeleteTask: handleDeleteTask, onUpdateTask: handleUpdateTask }} />
          <BacklogSection title="Concluídas" tasks={distributedTasks.completed} icon={<CheckCircle className="mr-2 h-6 w-6 text-green-500" />} {...{ selectedObjectiveFilter, allAppUsers, objectives, currentUser, onRemoveTaskFromKr: handleRemoveTaskFromKr, onDeleteTask: handleDeleteTask, onUpdateTask: handleUpdateTask }} />
        </>
      )}

      {isBatchUploadModalOpen && <BatchTaskUploadModal isOpen={isBatchUploadModalOpen} onClose={() => setIsBatchUploadModalOpen(false)} objectives={objectivesForFilter} allAppUsers={allAppUsers} currentUser={currentUser} onTasksCreated={loadBacklogData} />}

      <footer className="mt-12 text-center text-sm text-muted-foreground"><p>&copy; {new Date().getFullYear()} OKR Manager. Todos os direitos reservados.</p></footer>
    </div>
  );
};

export default BacklogPage;
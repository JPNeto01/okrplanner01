import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import KrDetailsForm from '@/components/create-kr/KrDetailsForm';
import KrTasksSelection from '@/components/create-kr/KrTasksSelection';

const CreateKrPage = () => {
  const { objectiveId } = useParams();
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [objective, setObjective] = useState(null);
  const [allUsersState, setAllUsersState] = useState([]); 
  const [scrumMastersForKr, setScrumMastersForKr] = useState([]);
  const [teamMembersForTasks, setTeamMembersForTasks] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true); 

  const [krTitle, setKrTitle] = useState('');
  const [krDescription, setKrDescription] = useState('');
  const [krScrumMaster, setKrScrumMaster] = useState('');
  const [isKrScrumMasterDisabled, setIsKrScrumMasterDisabled] = useState(false);
  const [krDueDate, setKrDueDate] = useState('');
  const [krStatus, setKrStatus] = useState('A Fazer');
  
  const [selectedBacklogTaskIds, setSelectedBacklogTaskIds] = useState([]);
  const [customAddedTasks, setCustomAddedTasks] = useState([]);
  const [showCustomTaskForm, setShowCustomTaskForm] = useState(false);
  const [backlogTasksForObjective, setBacklogTasksForObjective] = useState([]);

  const loadKrPageData = useCallback(async () => {
    if (authLoading) {
      setIsLoadingData(true);
      return;
    }
    if (!currentUser) { 
      setIsLoadingData(false); 
      navigate('/login');
      return;
    }
    setIsLoadingData(true);
    try {
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, name, email, user_group, company');
      if (usersError) throw usersError;
      setAllUsersState(users || []);

      const { data: currentObjective, error: objectiveError } = await supabase
        .from('objectives')
        .select('*')
        .eq('id', objectiveId)
        .single();
      if (objectiveError) throw objectiveError;

      if (currentObjective) {
        if (currentUser.group !== 'admin' && currentObjective.company !== currentUser.company) {
          toast({ title: "Acesso Negado", description: "Você não tem permissão para adicionar KRs a este objetivo.", variant: "destructive" });
          navigate(`/objective/${objectiveId}`);
          return;
        }
        setObjective(currentObjective);
        
        const companyUsers = users.filter(u => currentUser.group === 'admin' || u.company === currentObjective.company);
        const smUsersForKr = companyUsers.filter(u => u.user_group === 'scrum_master' || u.user_group === 'admin');
        setScrumMastersForKr(smUsersForKr);
        
        if (currentObjective.coordinator_scrum_master_id && smUsersForKr.some(sm => sm.id === currentObjective.coordinator_scrum_master_id)) {
          setKrScrumMaster(currentObjective.coordinator_scrum_master_id);
          setIsKrScrumMasterDisabled(true); // Desabilita se o SM do objetivo estiver definido
        } else {
          setIsKrScrumMasterDisabled(false); // Permite edição se SM do objetivo não estiver definido ou não for válido
        }

        setTeamMembersForTasks(companyUsers.filter(u => ['team_member', 'scrum_master', 'product_owner', 'admin'].includes(u.user_group)));
        
        const { data: backlogData, error: backlogError } = await supabase
          .from('tasks')
          .select('*')
          .eq('objective_id', objectiveId)
          .is('kr_id', null) 
          .eq('company', currentObjective.company);
        if (backlogError) throw backlogError;
        setBacklogTasksForObjective(backlogData || []);

      } else {
        toast({ title: "Erro", description: "Objetivo pai não encontrado.", variant: "destructive" });
        navigate('/dashboard');
      }
    } catch (error) {
        console.error("Error loading KR page data:", error);
        toast({ title: "Erro ao Carregar Dados", description: `Não foi possível carregar os dados: ${error.message}`, variant: "destructive" });
    } finally {
      setIsLoadingData(false);
    }
  }, [objectiveId, currentUser, authLoading, toast, navigate]);

  useEffect(() => {
    loadKrPageData();
  }, [loadKrPageData]);

  const handleToggleBacklogTaskSelection = (taskId) => {
    setSelectedBacklogTaskIds(prevSelected =>
      prevSelected.includes(taskId)
        ? prevSelected.filter(id => id !== taskId)
        : [...prevSelected, taskId]
    );
  };

  const getResponsibleName = (userId) => {
    const user = allUsersState.find(u => u.id === userId);
    return user ? user.name : 'Desconhecido';
  };

  const handleCreateKr = async (e) => {
    e.preventDefault();
    // Validação: Título, SM do KR e Prazo são obrigatórios
    if (!krTitle.trim()) {
        toast({ title: "Campo Obrigatório", description: "O título do KR é obrigatório.", variant: "destructive" });
        return;
    }
    if (!krScrumMaster) { // krScrumMaster é um ID
        toast({ title: "Campo Obrigatório", description: "O Scrum Master do KR é obrigatório.", variant: "destructive" });
        return;
    }
    if (!krDueDate) {
        toast({ title: "Campo Obrigatório", description: "A Data de Conclusão do KR é obrigatória.", variant: "destructive" });
        return;
    }

    const finalKrScrumMaster = (objective?.coordinator_scrum_master_id && scrumMastersForKr.some(sm => sm.id === objective.coordinator_scrum_master_id)) 
                               ? objective.coordinator_scrum_master_id 
                               : krScrumMaster;

    if (!finalKrScrumMaster) {
        toast({ title: "Erro de Validação", description: "Não foi possível determinar o Scrum Master para o KR.", variant: "destructive" });
        return;
    }


    try {
      const { data: newKr, error: krError } = await supabase
        .from('key_results')
        .insert({
          objective_id: objective.id,
          title: krTitle,
          description: krDescription,
          responsible_id: finalKrScrumMaster, 
          due_date: krDueDate,
          status: krStatus,
          created_by_id: currentUser.id,
        })
        .select()
        .single();

      if (krError) throw krError;

      const tasksToProcess = [];

      backlogTasksForObjective
        .filter(task => selectedBacklogTaskIds.includes(task.id))
        .forEach(task => {
          tasksToProcess.push({
            id: task.id, 
            kr_id: newKr.id, 
            status: 'A Fazer', 
            title: task.title,
            responsible_id: task.responsible_id,
            due_date: task.due_date,
            description: task.description,
            objective_id: objective.id,
            company: objective.company,
          });
        });

      customAddedTasks.forEach(task => {
        if (!task.title || !task.responsible || !task.dueDate) {
          toast({ title: "Tarefa Customizada Inválida", description: `Uma tarefa customizada (${task.title || 'sem título'}) está sem título, responsável ou prazo.`, variant: "warning" });
          return; 
        }
        tasksToProcess.push({
          title: task.title,
          responsible_id: task.responsible, 
          due_date: task.dueDate,
          status: 'A Fazer',
          kr_id: newKr.id,
          objective_id: objective.id,
          company: objective.company,
          created_by_id: currentUser.id,
          description: task.description || '',
        });
      });
      
      if (tasksToProcess.length > 0) {
        const tasksToInsert = tasksToProcess
            .filter(t => !t.id) 
            .map(t => {
                const { id, attachments, ...dbTask } = t; 
                return dbTask;
            });

        const tasksToUpdate = tasksToProcess.filter(t => t.id);

        if (tasksToInsert.length > 0) {
          const { error: insertTasksError } = await supabase
            .from('tasks')
            .insert(tasksToInsert); 
          if (insertTasksError) throw insertTasksError;
        }

        for (const task of tasksToUpdate) {
          const { error: updateTaskError } = await supabase
            .from('tasks')
            .update({ kr_id: task.kr_id, status: task.status })
            .eq('id', task.id);
          if (updateTaskError) throw updateTaskError;
        }
      }
      window.dispatchEvent(new CustomEvent('okrDataChanged'));
      toast({ title: "Sucesso!", description: `Key Result "${krTitle}" criado e tarefas processadas.` });
      navigate(`/objective/${objectiveId}`);

    } catch (error) {
      console.error("Error creating KR:", error);
      toast({ title: "Erro ao Criar KR", description: `Detalhe: ${error.message}`, variant: "destructive" });
    }
  };

  if (authLoading || isLoadingData) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 text-white"><p>Carregando...</p></div>;
  }

  if (!currentUser || !objective) {
    return <div className="min-h-screen flex items-center justify-center"><p>Dados do objetivo não encontrados ou usuário não autenticado.</p></div>;
  }
  
  const canCreateKr = currentUser.group === 'admin' || 
                      (currentUser.group === 'product_owner' && currentUser.id === objective.responsible_id) ||
                      (currentUser.group === 'scrum_master' && currentUser.id === objective.coordinator_scrum_master_id);

  if (!canCreateKr) {
    return <Navigate to={`/objective/${objectiveId}`} replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 p-4 md:p-8">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-8 pb-4 border-b border-slate-300 dark:border-slate-700">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center">
          <Button variant="outline" size="icon" asChild className="mr-4">
            <Link to={`/objective/${objectiveId}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              Criar Novo Key Result (KR)
            </h1>
            <p className="text-muted-foreground">Para o Objetivo: <span className="font-semibold">{objective.title}</span></p>
          </div>
        </motion.div>
      </header>

      <form onSubmit={handleCreateKr} className="space-y-8">
        <KrDetailsForm
          krTitle={krTitle} setKrTitle={setKrTitle}
          krDescription={krDescription} setKrDescription={setKrDescription}
          krScrumMaster={krScrumMaster} setKrScrumMaster={setKrScrumMaster}
          scrumMasters={scrumMastersForKr}
          krDueDate={krDueDate} setKrDueDate={setKrDueDate}
          krStatus={krStatus} setKrStatus={setKrStatus}
          isKrScrumMasterDisabled={isKrScrumMasterDisabled} // Passa a propriedade
        />

        <KrTasksSelection
          parentObjectiveTitle={objective.title}
          availableBacklogTasksForObjective={backlogTasksForObjective}
          selectedBacklogTaskIds={selectedBacklogTaskIds}
          onToggleBacklogTaskSelection={handleToggleBacklogTaskSelection}
          getResponsibleName={getResponsibleName}
          customAddedTasks={customAddedTasks}
          setCustomAddedTasks={setCustomAddedTasks}
          teamMembersForCustomTasks={teamMembersForTasks}
          showCustomTaskForm={showCustomTaskForm}
          setShowCustomTaskForm={setShowCustomTaskForm}
          objectiveCompany={objective.company}
          currentUser={currentUser}
        />

        <motion.div 
          className="flex justify-end pt-6 border-t border-slate-300 dark:border-slate-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button type="submit" size="lg" className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg">
            <Save className="mr-2 h-5 w-5" /> Salvar Key Result
          </Button>
        </motion.div>
      </form>

      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} OKR Manager. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default CreateKrPage;
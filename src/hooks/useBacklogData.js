import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

export const useBacklogData = (currentUser, authLoading, toast) => {
  const navigate = useNavigate();
  const [allTasks, setAllTasks] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [allAppUsers, setAllAppUsers] = useState([]);
  const [taskAssignableUsers, setTaskAssignableUsers] = useState([]);
  const [objectives, setObjectives] = useState([]);
  const [keyResults, setKeyResults] = useState([]);
  const [filteredObjectivesForSM, setFilteredObjectivesForSM] = useState([]);

  const loadBacklogData = useCallback(async () => {
    if (authLoading || !currentUser) {
      setIsLoadingData(false);
      if (!authLoading && !currentUser) navigate('/login');
      return;
    }
    setIsLoadingData(true);
    try {
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, name, email, user_group, company');
      if (usersError) throw usersError;
      setAllAppUsers(users || []);
      setTaskAssignableUsers((users || []).filter(user => 
        ['team_member', 'scrum_master', 'product_owner', 'admin'].includes(user.user_group) && 
        (currentUser.group === 'admin' || user.company === currentUser.company)
      ));

      let objectivesQuery = supabase.from('objectives').select('id, title, company, responsible_id, coordinator_scrum_master_id');
      if (currentUser.group !== 'admin') {
        objectivesQuery = objectivesQuery.eq('company', currentUser.company);
      }
      const { data: objectivesFromDb, error: objectivesError } = await objectivesQuery;
      if (objectivesError) throw objectivesError;
      
      const companyObjectives = objectivesFromDb || [];
      setObjectives(companyObjectives);

      if (currentUser.group === 'scrum_master') {
        setFilteredObjectivesForSM(companyObjectives.filter(obj => obj.coordinator_scrum_master_id === currentUser.id));
      }
      
      let krsQuery = supabase.from('key_results').select('id, responsible_id, objective_id');
       if (currentUser.group !== 'admin') {
        const companyObjectiveIds = companyObjectives.map(o => o.id);
        if (companyObjectiveIds.length > 0) {
            krsQuery = krsQuery.in('objective_id', companyObjectiveIds);
        } else {
            krsQuery = krsQuery.eq('objective_id', '00000000-0000-0000-0000-000000000000');
        }
      }
      const { data: krsFromDb, error: krsError } = await krsQuery;
      if (krsError) throw krsError;
      setKeyResults(krsFromDb || []);

      let tasksQuery = supabase.from('tasks').select(`
        id, title, responsible_id, due_date, status, company, objective_id, kr_id, description, completed_at,
        objectives(id, title, company, responsible_id, coordinator_scrum_master_id)
      `);
      
      if (currentUser.group !== 'admin') {
        tasksQuery = tasksQuery.eq('company', currentUser.company);
        if (currentUser.group === 'scrum_master') {
          const smObjectiveIds = companyObjectives.filter(obj => obj.coordinator_scrum_master_id === currentUser.id).map(o => o.id);
          if (smObjectiveIds.length > 0) {
            tasksQuery = tasksQuery.in('objective_id', smObjectiveIds);
          } else {
             tasksQuery = tasksQuery.eq('objective_id', '00000000-0000-0000-0000-000000000000');
          }
        }
      }

      const { data: allTasksFromDb, error: tasksError } = await tasksQuery;
      if (tasksError) {
        console.error("Supabase error details:", tasksError);
        throw tasksError;
      }
      
      const processedTasks = (allTasksFromDb || []).map(t => {
        const krInfo = krsFromDb.find(kr => kr.id === t.kr_id);
        return {
          ...t,
          responsible: t.responsible_id, 
          dueDate: t.due_date,
          objectiveId: t.objective_id,
          krId: t.kr_id,
          kr_responsible_id: krInfo ? krInfo.responsible_id : null,
          description: t.description || '',
        };
      });
      setAllTasks(processedTasks);

    } catch (error) {
      console.error("Error loading backlog data:", error);
      toast({ title: "Erro ao Carregar Backlog", description: `Detalhe: ${error.message}`, variant: "destructive" });
    } finally {
      setIsLoadingData(false);
    }
  }, [authLoading, currentUser, toast, navigate]);

  useEffect(() => {
    loadBacklogData();
  }, [loadBacklogData]);

  return {
    allTasks,
    isLoadingData,
    allAppUsers,
    taskAssignableUsers,
    objectives,
    keyResults,
    filteredObjectivesForSM,
    loadBacklogData,
  };
};
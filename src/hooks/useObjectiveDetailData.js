import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

export const useObjectiveDetailData = (objectiveId, currentUser, authLoading, toast) => {
  const [objective, setObjective] = useState(null);
  const [allUsersState, setAllUsersState] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
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
        .select('id, name, email, user_group, company, avatar_url');
      if (usersError) throw usersError;
      setAllUsersState(users || []);

      const { data: currentObjectiveFromDb, error: objectiveError } = await supabase
        .from('objectives')
        .select(`
          id, title, description, responsible_id, coordinator_scrum_master_id, company, status, due_date, created_at,
          key_results (
            id, title, description, responsible_id, due_date, status, created_at, completed_at,
            tasks (
              id, title, description, responsible_id, status, due_date, company, objective_id, kr_id, created_at, completed_at
            )
          )
        `)
        .eq('id', objectiveId)
        .maybeSingle();
      if (objectiveError) throw objectiveError;

      if (currentObjectiveFromDb) {
        if (currentUser.group !== 'admin' && currentObjectiveFromDb.company !== currentUser.company) {
          toast({ title: "Acesso Negado", description: "Você não tem permissão para ver este objetivo.", variant: "destructive" });
          navigate('/dashboard');
          return;
        }
        setObjective({
          ...currentObjectiveFromDb,
          keyResults: (currentObjectiveFromDb.key_results || []).map(kr => ({
            ...kr,
            tasks: (kr.tasks || []).filter(t => t.kr_id === kr.id).map(t => ({
              ...t,
              description: t.description || '',
              dueDate: t.due_date, 
              completed_at: t.completed_at,
            })),
          })),
        });
      } else {
        toast({ title: "Erro", description: "Objetivo não encontrado.", variant: "destructive" });
        navigate('/dashboard');
      }
    } catch (error) {
      console.error("Error loading OKR detail page data:", error);
      toast({ title: "Erro ao Carregar Dados", description: `Não foi possível carregar os detalhes do objetivo: ${error.message}`, variant: "destructive" });
    } finally {
      setIsLoadingData(false);
    }
  }, [objectiveId, currentUser, authLoading, navigate, toast]);

  useEffect(() => {
    loadData();
    const handleOkrDataChanged = () => loadData();
    window.addEventListener('okrDataChanged', handleOkrDataChanged);
    return () => window.removeEventListener('okrDataChanged', handleOkrDataChanged);
  }, [loadData]);

  return { objective, allUsersState, isLoadingData, reloadObjectiveData: loadData };
};
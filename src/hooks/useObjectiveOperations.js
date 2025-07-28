import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { calculateOkrProgress } from '@/lib/okrUtils';

export const useObjectiveOperations = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [objectives, setObjectives] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ poId: null, smId: null });

  const fetchObjectives = useCallback(async () => {
    if (!currentUser?.company) return;
    setLoading(true);

    try {
      let query = supabase
        .from('objectives')
        .select(`
          *,
          key_results (
            *,
            tasks (*)
          )
        `)
        .eq('company', currentUser.company);

      if (filters.poId) {
        query = query.eq('responsible_id', filters.poId);
      }
      if (filters.smId) {
        query = query.eq('coordinator_scrum_master_id', filters.smId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      const objectivesWithProgress = data.map(obj => {
        const allTasks = obj.key_results.flatMap(kr => kr.tasks || []);
        const progress = calculateOkrProgress(allTasks);
        return { ...obj, progressWithBacklog: progress };
      });

      setObjectives(objectivesWithProgress);
    } catch (error) {
      console.error("Error fetching objectives:", error);
      toast({
        title: "Erro ao buscar objetivos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [currentUser?.company, filters.poId, filters.smId, toast]);

  const fetchUsers = useCallback(async () => {
    if (!currentUser?.company) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('company', currentUser.company);
      if (error) throw error;
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Erro ao buscar usuários",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [currentUser?.company, toast]);

  useEffect(() => {
    if (currentUser) {
      fetchObjectives();
      fetchUsers();
    }
  }, [currentUser, fetchObjectives, fetchUsers]);

  useEffect(() => {
    const channel = supabase.channel('realtime-objectives')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'objectives' }, () => fetchObjectives())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'key_results' }, () => fetchObjectives())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchObjectives())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchObjectives]);

  const updateObjectiveStatus = async (objectiveId, newStatus) => {
    try {
      const { error } = await supabase
        .from('objectives')
        .update({ status: newStatus })
        .eq('id', objectiveId);
      if (error) throw error;
      fetchObjectives();
      return true;
    } catch (error) {
      console.error("Error updating objective status:", error);
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const updateObjectiveTag = async (objectiveId, newTag) => {
    try {
      const { error } = await supabase
        .from('objectives')
        .update({ objective_tag: newTag })
        .eq('id', objectiveId);
      if (error) throw error;
      fetchObjectives();
      return true;
    } catch (error) {
      console.error("Error updating objective tag:", error);
      toast({
        title: "Erro ao atualizar etiqueta",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const clearFilters = () => {
    setFilters({ poId: null, smId: null });
  };

  return {
    objectives,
    users,
    loading,
    filters,
    setFilters: handleFilterChange,
    clearFilters,
    updateObjectiveStatus,
    updateObjectiveTag,
    refetchObjectives: fetchObjectives,
  };
};
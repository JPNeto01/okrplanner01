import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  processObjectivesForBi,
  calculateWorkload,
  calculateCompletedTasksByResponsible,
  calculateTaskStatusCounts,
  calculateObjectivesWithOpenTasks,
  identifyCriticalObjectives,
  calculateSuccessRateByCycle,
  calculateDeadlineAdherence,
  calculateTaskLeadTime,
  calculateTaskThroughput,
} from '@/lib/biUtils';

export const useBiData = (currentUser, filters) => {
  const [biData, setBiData] = useState({
    objectives: [],
    allUsers: [],
    workloadByResponsible: [],
    completedTasksByResponsible: [],
    taskStatusCounts: {},
    objectivesWithOpenTasks: [],
    criticalObjectives: [],
    objectiveSuccessRateByCycle: [],
    deadlineAdherence: { onTime: 0, late: 0, notCompleted: 0 },
    taskLeadTimeByPeriod: [],
    taskThroughputByPeriod: [],
  });
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [responsibles, setResponsibles] = useState([]);
  const [taskResponsibles, setTaskResponsibles] = useState([]);
  const [scrumMasters, setScrumMasters] = useState([]);
  const [availableObjectives, setAvailableObjectives] = useState([]);

  const fetchData = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const { data: usersData, error: usersError } = await supabase.from('profiles').select('*');
      if (usersError) throw usersError;

      const uniqueCompanies = [...new Set(usersData.map(u => u.company).filter(Boolean))];
      setCompanies(uniqueCompanies);
      
      let objectivesQuery = supabase.from('objectives').select(`
        id, title, description, responsible_id, coordinator_scrum_master_id, company, status, due_date, created_at,
        key_results (
          id, title, status, due_date, created_at,
          tasks (id, status, due_date, responsible_id, created_at, completed_at)
        )
      `);
      
      if (currentUser.group === 'product_owner') {
        objectivesQuery = objectivesQuery.eq('company', currentUser.company);
      } else if (currentUser.group === 'admin' && filters.company) {
        objectivesQuery = objectivesQuery.eq('company', filters.company);
      }

      const { data: objectivesData, error: objectivesError } = await objectivesQuery;
      if (objectivesError) throw objectivesError;
      
      const uniqueObjectiveResponsibleIds = [...new Set(objectivesData.map(o => o.responsible_id).filter(Boolean))];
      setResponsibles(usersData.filter(u => uniqueObjectiveResponsibleIds.includes(u.id)));

      const uniqueScrumMasterIds = [...new Set(objectivesData.map(o => o.coordinator_scrum_master_id).filter(Boolean))];
      setScrumMasters(usersData.filter(u => uniqueScrumMasterIds.includes(u.id)));

      const allTasks = objectivesData.flatMap(o => o.key_results.flatMap(kr => kr.tasks || []));
      const uniqueTaskResponsibleIds = [...new Set(allTasks.map(t => t.responsible_id).filter(Boolean))];
      setTaskResponsibles(usersData.filter(u => uniqueTaskResponsibleIds.includes(u.id)));

      setAvailableObjectives(objectivesData);
      
      const filteredObjectives = processObjectivesForBi(objectivesData, filters);
      
      const tasksForAnalysis = filteredObjectives.flatMap(obj => 
        filters.taskResponsibleId
          ? obj.allObjectiveTasks.filter(task => task.responsible_id === filters.taskResponsibleId)
          : obj.allObjectiveTasks
      );

      setBiData({ 
        objectives: filteredObjectives, 
        allUsers: usersData || [],
        workloadByResponsible: calculateWorkload(tasksForAnalysis, usersData),
        completedTasksByResponsible: calculateCompletedTasksByResponsible(tasksForAnalysis, usersData),
        taskStatusCounts: calculateTaskStatusCounts(tasksForAnalysis),
        objectivesWithOpenTasks: calculateObjectivesWithOpenTasks(filteredObjectives, filters),
        criticalObjectives: identifyCriticalObjectives(filteredObjectives, filters),
        objectiveSuccessRateByCycle: calculateSuccessRateByCycle(filteredObjectives),
        deadlineAdherence: calculateDeadlineAdherence(filteredObjectives),
        taskLeadTimeByPeriod: calculateTaskLeadTime(tasksForAnalysis),
        taskThroughputByPeriod: calculateTaskThroughput(tasksForAnalysis),
      });

    } catch (error) {
      console.error("Error fetching BI data:", error);
      setBiData(prev => ({ 
        ...prev, 
        objectives: [], 
        workloadByResponsible: [], 
        completedTasksByResponsible: [],
        taskStatusCounts: {}, 
        objectivesWithOpenTasks: [], 
        criticalObjectives: [],
        objectiveSuccessRateByCycle: [],
        deadlineAdherence: { onTime: 0, late: 0, notCompletedYet: 0 },
        taskLeadTimeByPeriod: [],
        taskThroughputByPeriod: [],
      }));
    } finally {
      setLoading(false);
    }
  }, [currentUser, filters]);

  return { biData, loading, companies, responsibles, taskResponsibles, scrumMasters, availableObjectives, fetchData };
};

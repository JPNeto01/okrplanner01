import { 
  isBefore, 
  startOfToday, 
  parseISO, 
  differenceInDays, 
  getQuarter, 
  getYear, 
  format
} from 'date-fns';
import { calculateOkrProgress } from '@/lib/okrUtils';

export const processObjectivesForBi = (objectivesData, filters) => {
  const today = startOfToday();
  let processedObjectives = objectivesData.map(obj => {
    const allObjectiveTasks = obj.key_results.flatMap(kr => kr.tasks || []);
    const progressByTasks = calculateOkrProgress(allObjectiveTasks);
    // Simplificando o status aqui. A lógica completa pode ser adicionada se necessário.
    const statusByTasks = progressByTasks === 100 ? 'Concluído' : 'Em Progresso';

    let completedKrs = 0;
    let allKrsTasksCompletedForObjective = true;
    if (obj.key_results.length === 0) {
        allKrsTasksCompletedForObjective = false;
    } else {
        obj.key_results.forEach(kr => {
          const krTasks = kr.tasks || [];
          if (krTasks.length > 0 && krTasks.every(t => t.status === 'Concluído')) {
            completedKrs++;
          } else if (krTasks.length > 0) {
            allKrsTasksCompletedForObjective = false;
          } else {
            allKrsTasksCompletedForObjective = false;
          }
        });
    }

    const krCompletionRate = obj.key_results.length > 0 ? (completedKrs / obj.key_results.length) * 100 : 0;
    
    const openTasksCount = allObjectiveTasks.filter(t => t.status !== 'Concluído').length;
    const overdueTasksCount = allObjectiveTasks.filter(t => t.due_date && isBefore(parseISO(t.due_date), today) && t.status !== 'Concluído').length;
    
    let objectiveCompletedDate = null;
    if (krCompletionRate === 100 && allKrsTasksCompletedForObjective) {
        const taskCompletionDates = allObjectiveTasks
            .filter(t => t.status === 'Concluído' && t.completed_at)
            .map(t => parseISO(t.completed_at));
        if (taskCompletionDates.length > 0) {
            objectiveCompletedDate = new Date(Math.max(...taskCompletionDates));
        }
    }

    return { 
      ...obj, 
      allObjectiveTasks, 
      progressWithBacklog: progressByTasks, 
      calculatedStatus: statusByTasks,
      krCompletionRate,
      openTasksCount,
      overdueTasksCount,
      objectiveCompletedDate,
    };
  });

  if (filters.taskResponsibleId) {
    processedObjectives = processedObjectives.filter(obj => 
      obj.allObjectiveTasks.some(task => task.responsible_id === filters.taskResponsibleId)
    );
  }
  
  return processedObjectives;
};

export const calculateWorkload = (tasks, usersData) => {
  const workloadData = tasks.reduce((acc, task) => {
    if (task.responsible_id) {
      const responsible = usersData.find(u => u.id === task.responsible_id);
      if (responsible) {
        const respName = responsible.name || 'Desconhecido';
        if (!acc[respName]) {
          acc[respName] = { name: respName, 'A Fazer': 0, 'Em Progresso': 0, 'Concluído': 0, 'Backlog': 0 };
        }
        if (task.status === 'A Fazer') acc[respName]['A Fazer']++;
        else if (task.status === 'Em Progresso') acc[respName]['Em Progresso']++;
        else if (task.status === 'Concluído') acc[respName]['Concluído']++;
        else if (task.status === 'Backlog') acc[respName]['Backlog']++;
      }
    }
    return acc;
  }, {});
  return Object.values(workloadData);
};

export const calculateCompletedTasksByResponsible = (tasks, usersData) => {
  const completedData = tasks.reduce((acc, task) => {
    if (task.responsible_id && task.status === 'Concluído') {
      const responsible = usersData.find(u => u.id === task.responsible_id);
      if (responsible) {
        const respName = responsible.name || 'Desconhecido';
        if (!acc[respName]) {
          acc[respName] = { name: respName, completedCount: 0 };
        }
        acc[respName].completedCount++;
      }
    }
    return acc;
  }, {});
  return Object.values(completedData).filter(r => r.completedCount > 0).sort((a, b) => b.completedCount - a.completedCount);
};

export const calculateTaskStatusCounts = (tasks) => {
  return tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {});
};

export const calculateObjectivesWithOpenTasks = (objectives, filters) => {
  const today = startOfToday();
  return objectives
    .map(obj => {
      let objTasks = obj.allObjectiveTasks;
      if (filters.taskResponsibleId) {
        objTasks = obj.allObjectiveTasks.filter(task => task.responsible_id === filters.taskResponsibleId);
      }
      
      const openTasks = objTasks.filter(t => t.status !== 'Concluído').length;
      const overdueTasks = objTasks.filter(t => t.due_date && isBefore(parseISO(t.due_date), today) && t.status !== 'Concluído').length;
      
      return {
        name: obj.title,
        openTasks,
        overdueTasks,
      };
    })
    .filter(obj => obj.openTasks > 0 || obj.overdueTasks > 0);
};

export const identifyCriticalObjectives = (objectives, filters) => {
  const today = startOfToday();
  return objectives
    .filter(obj => {
      let objTasks = obj.allObjectiveTasks;
      if (filters.taskResponsibleId) {
        objTasks = obj.allObjectiveTasks.filter(task => task.responsible_id === filters.taskResponsibleId);
      }
      
      const objOverdueTasksCount = objTasks.filter(t => t.due_date && isBefore(parseISO(t.due_date), today) && t.status !== 'Concluído').length;
      const objProgressByTasks = calculateOkrProgress(objTasks);
      
      return obj.calculatedStatus === 'Atrasado' || objOverdueTasksCount > 0 || (objProgressByTasks < 50 && obj.due_date && isBefore(parseISO(obj.due_date), new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)));
    })
    .sort((a, b) => {
      if (a.calculatedStatus === 'Atrasado' && b.calculatedStatus !== 'Atrasado') return -1;
      if (b.calculatedStatus === 'Atrasado' && a.calculatedStatus !== 'Atrasado') return 1;
      return (b.overdueTasksCount + b.openTasksCount) - (a.overdueTasksCount + a.openTasksCount) || a.progressWithBacklog - b.progressWithBacklog;
    })
    .slice(0, 10);
};

export const calculateSuccessRateByCycle = (objectives) => {
  const successRateByCycle = objectives.reduce((acc, obj) => {
    if (obj.created_at) {
      const createdAtDate = parseISO(obj.created_at);
      const cycle = `T${getQuarter(createdAtDate)} ${getYear(createdAtDate)}`;
      if (!acc[cycle]) {
        acc[cycle] = { total: 0, success: 0 };
      }
      acc[cycle].total++;
      if (obj.krCompletionRate === 100) {
        acc[cycle].success++;
      }
    }
    return acc;
  }, {});
  return Object.entries(successRateByCycle)
    .map(([cycle, data]) => ({
      cycle,
      successRate: data.total > 0 ? Math.round((data.success / data.total) * 100) : 0,
    }))
    .sort((a,b) => a.cycle.localeCompare(b.cycle));
};

export const calculateDeadlineAdherence = (objectives) => {
  const today = startOfToday();
  const deadlineAdherenceData = { onTime: 0, late: 0, notCompletedYet: 0, noDueDate: 0 };
  objectives.forEach(obj => {
    if (obj.krCompletionRate === 100) {
      if (!obj.due_date) { 
        deadlineAdherenceData.onTime++; 
      } else if (obj.objectiveCompletedDate && isBefore(obj.objectiveCompletedDate, parseISO(obj.due_date))) {
        deadlineAdherenceData.onTime++;
      } else if (obj.objectiveCompletedDate && !isBefore(obj.objectiveCompletedDate, parseISO(obj.due_date))) {
         deadlineAdherenceData.late++; 
      } else { 
        if (obj.calculatedStatus !== 'Atrasado') {
          deadlineAdherenceData.onTime++;
        } else {
          deadlineAdherenceData.late++;
        }
      }
    } else { 
      if (!obj.due_date) {
         deadlineAdherenceData.noDueDate++; 
      } else if (isBefore(parseISO(obj.due_date), today)) {
         deadlineAdherenceData.late++; 
      } else {
         deadlineAdherenceData.notCompletedYet++; 
      }
    }
  });
  return deadlineAdherenceData;
};

export const calculateTaskLeadTime = (tasks) => {
  const leadTimeData = {};
  tasks.forEach(task => {
    if (task.status === 'Concluído' && task.created_at && task.completed_at) {
      const createdAt = parseISO(task.created_at);
      const completedAt = parseISO(task.completed_at);
      const leadTime = differenceInDays(completedAt, createdAt);
      const period = format(completedAt, 'yyyy-MM'); 
      if (!leadTimeData[period]) {
        leadTimeData[period] = { totalLeadTime: 0, count: 0 };
      }
      leadTimeData[period].totalLeadTime += leadTime;
      leadTimeData[period].count++;
    }
  });
  return Object.entries(leadTimeData)
    .map(([period, data]) => ({
      period,
      avgLeadTime: data.count > 0 ? Math.round(data.totalLeadTime / data.count) : 0,
    }))
    .sort((a,b) => a.period.localeCompare(b.period));
};

export const calculateTaskThroughput = (tasks) => {
  const throughputData = {};
  tasks.forEach(task => {
    if (task.status === 'Concluído' && task.completed_at) {
      const completedAt = parseISO(task.completed_at);
      const period = format(completedAt, 'yyyy-MM'); 
      if (!throughputData[period]) {
        throughputData[period] = 0;
      }
      throughputData[period]++;
    }
  });
  return Object.entries(throughputData)
    .map(([period, count]) => ({
      period,
      count,
    }))
    .sort((a,b) => a.period.localeCompare(b.period));
};

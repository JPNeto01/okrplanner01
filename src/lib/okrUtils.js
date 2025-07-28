export const determineOkrStatus = (tasks) => {
  if (!tasks || tasks.length === 0) return 'A Fazer';
  
  const allTasksCompleted = tasks.every(task => task.status === 'Concluído' || task.status === 'Concluída no KR');
  if (allTasksCompleted) return 'Concluído';

  const anyTaskInProgress = tasks.some(task => task.status === 'Em Progresso');
  const anyTaskCompleted = tasks.some(task => task.status === 'Concluído' || task.status === 'Concluída no KR');
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); 
  const anyTaskOverdue = tasks.some(task => {
    if (task.status === 'Concluído' || task.status === 'Concluída no KR') return false;
    if (!task.due_date) return false;
    const taskDueDate = new Date(task.due_date + 'T00:00:00');
    return taskDueDate < today;
  });

  if (anyTaskInProgress || anyTaskOverdue || (anyTaskCompleted && !allTasksCompleted)) {
    return 'Em Progresso';
  }
  
  const allTasksAreToDo = tasks.every(task => task.status === 'A Fazer');
  if (allTasksAreToDo) return 'A Fazer';

  return 'A Fazer'; 
};

export const calculateOkrProgress = (tasks) => {
  if (!tasks || tasks.length === 0) return 0;
  const completedTasks = tasks.filter(task => task.status === 'Concluído' || task.status === 'Concluída no KR').length;
  return (completedTasks / tasks.length) * 100;
};

export const getTaskDeadlineCategory = (dueDate, status) => {
    if (status === 'Concluído' || status === 'Concluída no KR') return 'concluido';
    if (!dueDate) return 'sem-prazo';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDueDate = new Date(dueDate + 'T00:00:00'); 
    taskDueDate.setHours(0,0,0,0);


    const diffTime = taskDueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'atrasado';
    if (diffDays <= 1) return 'critico'; 
    if (diffDays <= 2) return 'alerta'; 
    if (diffDays <= 5) return 'atencao'; 
    return 'ok'; 
};

export const sortTasksByDeadline = (tasks) => {
  if (!Array.isArray(tasks)) return [];
  
  const categoryOrder = {
    'atrasado': 1,
    'critico': 2,
    'alerta': 3,
    'atencao': 4,
    'ok': 5,
    'sem-prazo': 6,
    'concluido': 7 
  };
  
  return [...tasks].sort((a, b) => {
    const categoryA = getTaskDeadlineCategory(a.due_date || a.dueDate, a.status);
    const categoryB = getTaskDeadlineCategory(b.due_date || b.dueDate, b.status);
    
    const orderA = categoryOrder[categoryA] ?? 99;
    const orderB = categoryOrder[categoryB] ?? 99;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    const dateAValue = a.due_date || a.dueDate;
    const dateBValue = b.due_date || b.dueDate;

    if (dateAValue && dateBValue) {
      const dateA = new Date(dateAValue + 'T00:00:00');
      const dateB = new Date(dateBValue + 'T00:00:00');
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
    } else if (dateAValue) { 
      return -1;
    } else if (dateBValue) { 
      return 1;
    }

    return (a.title || '').localeCompare(b.title || '');
  });
};

export const calculateKrProgress = (tasks) => {
  if (!tasks || tasks.length === 0) return 0;
  const completedTasks = tasks.filter(task => task.status === 'Concluído' || task.status === 'Concluída no KR').length;
  return (completedTasks / tasks.length) * 100;
};

export const getTaskCounts = (tasks) => {
  return tasks.reduce((acc, task) => {
    if (task.status === 'A Fazer') acc.toDo++;
    else if (task.status === 'Em Progresso') acc.inProgress++;
    else if (task.status === 'Concluído' || task.status === 'Concluída no KR') acc.done++;
    return acc;
  }, { toDo: 0, inProgress: 0, done: 0 });
};

export const getStatusColor = (status, progress) => {
  progress = Math.round(progress || 0);
  const effectiveStatus = progress === 100 ? 'Concluído' : status;

  if (effectiveStatus === 'Concluído') {
    return {
      textColor: 'text-green-700 dark:text-green-400',
      bgColor: 'bg-green-500 dark:bg-green-600',
      indicatorColor: 'bg-green-600 dark:bg-green-500',
      borderColor: 'border-green-500 dark:border-green-600',
      bgColorSoft: 'bg-green-100 dark:bg-green-900/50',
    };
  }
  if (effectiveStatus === 'Atrasado') { 
    return {
      textColor: 'text-red-700 dark:text-red-400',
      bgColor: 'bg-red-500 dark:bg-red-600',
      indicatorColor: 'bg-red-600 dark:bg-red-500',
      borderColor: 'border-red-500 dark:border-red-600',
      bgColorSoft: 'bg-red-100 dark:bg-red-900/50',
    };
  }
  if (effectiveStatus === 'Em Progresso') {
    if (progress < 30) {
      return {
        textColor: 'text-yellow-700 dark:text-yellow-400',
        bgColor: 'bg-yellow-500 dark:bg-yellow-600',
        indicatorColor: 'bg-yellow-600 dark:bg-yellow-500',
        borderColor: 'border-yellow-500 dark:border-yellow-600',
        bgColorSoft: 'bg-yellow-100 dark:bg-yellow-900/50',
      };
    }
    return {
      textColor: 'text-blue-700 dark:text-blue-400',
      bgColor: 'bg-blue-500 dark:bg-blue-600',
      indicatorColor: 'bg-blue-600 dark:bg-blue-500',
      borderColor: 'border-blue-500 dark:border-blue-600',
      bgColorSoft: 'bg-blue-100 dark:bg-blue-900/50',
    };
  }
  if (effectiveStatus === 'A Fazer') {
    return {
      textColor: 'text-gray-700 dark:text-gray-400',
      bgColor: 'bg-gray-400 dark:bg-gray-500',
      indicatorColor: 'bg-gray-500 dark:bg-gray-400',
      borderColor: 'border-gray-400 dark:border-gray-500',
      bgColorSoft: 'bg-gray-100 dark:bg-gray-700/50',
    };
  }
  // Default
  return {
    textColor: 'text-slate-700 dark:text-slate-400',
    bgColor: 'bg-slate-400 dark:bg-slate-500',
    indicatorColor: 'bg-slate-500 dark:bg-slate-400',
    borderColor: 'border-slate-400 dark:border-slate-500',
    bgColorSoft: 'bg-slate-100 dark:bg-slate-700/50',
  };
};
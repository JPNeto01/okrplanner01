export const getDaysUntilDue = (dueDate) => {
  if (!dueDate) return null;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const parts = dueDate.split('-');
  if (parts.length !== 3) return null;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

  const taskDueDate = new Date(Date.UTC(year, month, day, 0, 0, 0));

  const diffTime = taskDueDate.getTime() - today.getTime();
  
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

export const getTaskUrgency = (dueDate, status) => {
  if (status === 'Concluído') return 'completed';
  if (!dueDate) return 'no_due_date';

  const days = getDaysUntilDue(dueDate);

  if (days === null) return 'no_due_date';

  if (days < 0) return 'overdue';
  if (days === 0) return 'due_today';
  if (days === 1) return 'due_in_1_day';
  if (days === 2) return 'due_in_2_days';
  if (days === 3) return 'due_in_3_days';
  
  return 'far_future';
};

export const sortTasksByUrgency = (tasks) => {
  if (!Array.isArray(tasks)) return [];

  const categoryOrder = {
    'overdue': 1,
    'due_today': 2,
    'due_in_1_day': 3,
    'due_in_2_days': 4,
    'due_in_3_days': 5,
    'far_future': 6,
    'no-due-date': 7,
    'completed': 8,
  };

  return [...tasks].sort((a, b) => {
    const urgencyA = getTaskUrgency(a.due_date || a.dueDate, a.status);
    const urgencyB = getTaskUrgency(b.due_date || b.dueDate, b.status);
    
    const orderA = categoryOrder[urgencyA] ?? 99;
    const orderB = categoryOrder[urgencyB] ?? 99;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    const dateA = a.due_date || a.dueDate;
    const dateB = b.due_date || b.dueDate;

    if (dateA && dateB) {
      const daysA = getDaysUntilDue(dateA);
      const daysB = getDaysUntilDue(dateB);

      if (daysA !== null && daysB !== null && daysA !== daysB) {
        return daysA - daysB;
      }
    } else if (dateA) {
      return -1; 
    } else if (dateB) {
      return 1;
    }
    
    return (a.title || '').localeCompare(b.title || '');
  });
};
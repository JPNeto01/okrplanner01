import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target as KrIcon, ChevronDown, ChevronUp, AlertTriangle, Clock, Zap } from 'lucide-react';
import MyTaskItem from '@/components/my-tasks/MyTaskItem';
import { sortTasksByUrgency, getTaskUrgency } from '@/lib/dateUtils';

const MyTasksKrCard = ({ krData, onTaskStatusChange, onSaveTaskDetails }) => {
  const [isTasksExpanded, setIsTasksExpanded] = useState(false);
  
  const sortedTasks = useMemo(() => sortTasksByUrgency(krData.tasks || []), [krData.tasks]);

  const overdueTasksCount = useMemo(() => {
    return (krData.tasks || []).filter(task => getTaskUrgency(task.dueDate, task.status) === 'overdue').length;
  }, [krData.tasks]);

  const dueTodayOrTomorrowCount = useMemo(() => {
    if (overdueTasksCount > 0) return 0; 
    return (krData.tasks || []).filter(task => {
      const urgency = getTaskUrgency(task.dueDate, task.status);
      return urgency === 'due_today' || urgency === 'due_tomorrow';
    }).length;
  }, [krData.tasks, overdueTasksCount]);

  const dueIn2DaysCount = useMemo(() => {
    if (overdueTasksCount > 0 || dueTodayOrTomorrowCount > 0) return 0;
    return (krData.tasks || []).filter(task => getTaskUrgency(task.dueDate, task.status) === 'due_in_2_days').length;
  }, [krData.tasks, overdueTasksCount, dueTodayOrTomorrowCount]);


  const toggleTasks = () => setIsTasksExpanded(!isTasksExpanded);

  let cardBorderClass = 'border-transparent';
  let badgeToShow = null;

  if (overdueTasksCount > 0) {
    cardBorderClass = 'border-red-500 dark:border-red-700 border-2';
    badgeToShow = (
      <Badge variant="destructive" className="ml-2 mt-1 sm:mt-0 animate-pulse">
        <AlertTriangle className="h-3 w-3 mr-1" />
        {overdueTasksCount} Atrasada{overdueTasksCount > 1 ? 's' : ''}
      </Badge>
    );
  } else if (dueTodayOrTomorrowCount > 0) {
    cardBorderClass = 'border-red-400 dark:border-red-500 border-2';
    badgeToShow = (
      <Badge variant="outline" className="ml-2 mt-1 sm:mt-0 border-red-400 text-red-600 dark:text-red-300 dark:border-red-500 animate-pulse">
        <Zap className="h-3 w-3 mr-1" />
        {dueTodayOrTomorrowCount} Para Hoje
      </Badge>
    );
  } else if (dueIn2DaysCount > 0) {
    cardBorderClass = 'border-yellow-500 dark:border-yellow-600 border-2';
    badgeToShow = (
      <Badge variant="outline" className="ml-2 mt-1 sm:mt-0 border-yellow-500 text-yellow-700 dark:text-yellow-400 dark:border-yellow-600 animate-pulse">
        <Clock className="h-3 w-3 mr-1" />
        {dueIn2DaysCount} Entrega Próxima
      </Badge>
    );
  }


  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
      <Card className={`shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm ${cardBorderClass}`}>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center flex-wrap">
                <KrIcon className="h-5 w-5 mr-2 flex-shrink-0 text-primary dark:text-primary-foreground" />
                <CardTitle className="text-xl text-primary dark:text-primary-foreground">
                  <Link to={`/objective/${krData.objectiveId}`} className="hover:underline break-all">
                    {krData.krTitle}
                  </Link>
                </CardTitle>
                {badgeToShow}
              </div>
              <CardDescription className="mt-1 text-xs">
                Objetivo: <span className="font-medium">"{krData.objectiveTitle}"</span> | SM do KR: {krData.krScrumMaster}
              </CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTasks} 
              className="ml-2 flex-shrink-0 h-8 w-8"
              aria-label={isTasksExpanded ? "Recolher tarefas" : "Expandir tarefas"}
            >
              {isTasksExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </Button>
          </div>
        </CardHeader>
        <AnimatePresence initial={false}>
          {isTasksExpanded && (
            <motion.div
              key="taskListContent"
              initial={{ height: 0, opacity: 0, marginTop: 0, paddingTop:0, paddingBottom:0 }}
              animate={{ height: 'auto', opacity: 1, marginTop: '0', paddingTop: '1rem', paddingBottom: '1rem' }}
              exit={{ height: 0, opacity: 0, marginTop: 0, paddingTop:0, paddingBottom:0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <CardContent className="space-y-3 pt-0">
                {sortedTasks.map(task => (
                  <MyTaskItem
                    key={task.id}
                    task={task}
                    objectiveId={krData.objectiveId}
                    krId={krData.krId}
                    onTaskStatusChange={onTaskStatusChange}
                    onSaveTaskDetails={onSaveTaskDetails}
                  />
                ))}
                {sortedTasks.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhuma tarefa sua neste KR.</p>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
        {!isTasksExpanded && sortedTasks.length > 0 && (
           <CardContent className="pt-0 pb-4">
            <p className="text-xs text-muted-foreground text-center">
              {sortedTasks.length} tarefa{sortedTasks.length !== 1 ? 's' : ''} atribuída{sortedTasks.length !== 1 ? 's' : ''} a você neste KR. 
              {overdueTasksCount > 0 && <span className="font-bold text-red-600 dark:text-red-400"> ({overdueTasksCount} atrasada{overdueTasksCount > 1 ? 's' : ''}!)</span>}
              {overdueTasksCount === 0 && dueTodayOrTomorrowCount > 0 && <span className="font-bold text-red-500 dark:text-red-400"> ({dueTodayOrTomorrowCount} para hoje!)</span>}
              {overdueTasksCount === 0 && dueTodayOrTomorrowCount === 0 && dueIn2DaysCount > 0 && <span className="font-bold text-yellow-600 dark:text-yellow-400"> ({dueIn2DaysCount} com entrega próxima!)</span>}
              {' '}Clique para expandir.
            </p>
          </CardContent>
        )}
         {!isTasksExpanded && sortedTasks.length === 0 && (
           <CardContent className="pt-0 pb-4">
            <p className="text-xs text-muted-foreground text-center">Nenhuma tarefa sua neste KR.</p>
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
};

export default MyTasksKrCard;
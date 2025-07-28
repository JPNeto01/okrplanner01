import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Clock, Play, CheckCircle } from 'lucide-react';
import MyTaskItem from '@/components/my-tasks/MyTaskItem';

const MyTasksSection = ({ title, tasks, status, onTaskStatusChange, onSaveTaskDetails }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusIcon = () => {
    switch (status) {
      case 'A Fazer':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'Em Progresso':
        return <Play className="h-5 w-5 text-orange-500" />;
      case 'Concluído':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'A Fazer':
        return 'border-blue-200 dark:border-blue-800';
      case 'Em Progresso':
        return 'border-orange-200 dark:border-orange-800';
      case 'Concluído':
        return 'border-green-200 dark:border-green-800';
      default:
        return 'border-gray-200 dark:border-gray-800';
    }
  };

  const getBadgeVariant = () => {
    switch (status) {
      case 'A Fazer':
        return 'default';
      case 'Em Progresso':
        return 'secondary';
      case 'Concluído':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <Card className={`shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-2 ${getStatusColor()}`}>
      <CardHeader 
        className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <CardTitle className="text-xl">{title}</CardTitle>
            <Badge variant={getBadgeVariant()} className="ml-2">
              {tasks.length} {tasks.length === 1 ? 'tarefa' : 'tarefas'}
            </Badge>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            aria-label={isExpanded ? "Recolher seção" : "Expandir seção"}
          >
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </Button>
        </div>
      </CardHeader>
      
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="taskSectionContent"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <CardContent className="space-y-3 pt-0">
              {tasks.map(task => (
                <MyTaskItem
                  key={task.id}
                  task={task}
                  objectiveId={task.objectiveId}
                  krId={task.krId}
                  onTaskStatusChange={onTaskStatusChange}
                  onSaveTaskDetails={onSaveTaskDetails}
                />
              ))}
              {tasks.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma tarefa {status.toLowerCase()}.
                </p>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
      
      {!isExpanded && (
        <CardContent className="pt-0 pb-4">
          <p className="text-xs text-muted-foreground text-center">
            {tasks.length === 0 
              ? `Nenhuma tarefa ${status.toLowerCase()}.`
              : `${tasks.length} tarefa${tasks.length !== 1 ? 's' : ''} ${status.toLowerCase()}. Clique para expandir.`
            }
          </p>
        </CardContent>
      )}
    </Card>
  );
};

export default MyTasksSection;
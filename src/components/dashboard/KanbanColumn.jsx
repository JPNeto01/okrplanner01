import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TaskItem from '@/components/dashboard/TaskItem'; 
import { ChevronDown, ChevronUp, CalendarDays, Target, Eye, EyeOff, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { calculateOkrProgress } from '@/lib/okrUtils';
import { sortTasksByUrgency, getDaysUntilDue } from '@/lib/dateUtils'; 
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import ObjectiveTag from './ObjectiveTag';

const ProgressBar = ({ percentage, small }) => {
  const bgColor = percentage === 100 ? 'bg-green-500' : 'bg-blue-500';
  const height = small ? 'h-1.5' : 'h-2.5';
  return (
    <div className={`w-full bg-slate-200 dark:bg-slate-700 rounded-full ${height} my-1`}>
      <div
        className={`${bgColor} ${height} rounded-full transition-all duration-500 ease-out`}
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
};

const KanbanColumn = ({ title, objectives, allUsers = [], currentUser, onUpdateTaskStatusInKr, onUpdateObjectiveTag }) => {
  const navigate = useNavigate();
  const getResponsibleUser = (userId) => Array.isArray(allUsers) ? allUsers.find(u => u.id === userId) : null;
  
  const [expandedObjectives, setExpandedObjectives] = useState({});
  const [expandedKrsInObjective, setExpandedKrsInObjective] = useState({});

  const toggleObjectiveExpansion = (objectiveId) => {
    setExpandedObjectives(prev => ({ ...prev, [objectiveId]: !prev[objectiveId] }));
  };

  const toggleAllKrsInObjective = (objectiveId) => {
    setExpandedKrsInObjective(prev => ({ ...prev, [objectiveId]: !prev[objectiveId] }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleNavigateToObjectiveDetail = (objectiveId) => {
    navigate(`/objective/${objectiveId}`);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
  };

  const sortKrsByDueDate = (krs) => {
    if (!Array.isArray(krs)) return [];
    return [...krs].sort((a, b) => {
      if (!a.due_date && !b.due_date) return 0; 
      if (!a.due_date) return 1; 
      if (!b.due_date) return -1; 

      const dateA = new Date(a.due_date);
      const dateB = new Date(b.due_date);
      
      return dateA.getTime() - dateB.getTime(); 
    });
  };

  if (!currentUser) {
    return <p>Carregando dados do usuário...</p>;
  }

  return (
    <motion.div
      className="bg-slate-100/70 dark:bg-slate-800/70 p-4 rounded-lg shadow-lg flex-1 kanban-column backdrop-blur-sm min-w-[300px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-xl font-semibold mb-6 text-primary dark:text-primary-foreground border-b pb-2 border-primary/30">{title} ({objectives.length})</h2>
      <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-280px)] pr-1 custom-scrollbar">
        {objectives.map(objective => {
          const responsibleUser = getResponsibleUser(objective.responsible_id);
          const coordinatorScrumMasterUser = getResponsibleUser(objective.coordinator_scrum_master_id);
          const isObjectiveExpanded = !!expandedObjectives[objective.id];
          const areKrsInObjectiveExpanded = !!expandedKrsInObjective[objective.id]; 
          
          const isPO = currentUser.group === 'product_owner' && currentUser.id === objective.responsible_id;
          const isCoordinatorSM = currentUser.group === 'scrum_master' && currentUser.id === objective.coordinator_scrum_master_id;
          
          const canManageObjectiveLink = currentUser.group === 'admin' || isPO || isCoordinatorSM;
          const canEditTag = isPO || currentUser.group === 'admin';
          
          const progressPercentage = objective.progressWithBacklog !== undefined ? objective.progressWithBacklog : 0;
          const daysRemaining = getDaysUntilDue(objective.due_date);
          const dueDateFormatted = formatDate(objective.due_date);

          const sortedKrs = sortKrsByDueDate(objective.key_results || []);

          return (
            <Card key={objective.id} className="bg-white dark:bg-slate-900/80 hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div 
                    className="flex-1 cursor-pointer group" 
                    onClick={() => handleNavigateToObjectiveDetail(objective.id)}
                  >
                    <CardTitle className="text-lg text-gray-800 dark:text-gray-200 group-hover:text-primary transition-colors">
                      {objective.title}
                    </CardTitle>
                  </div>
                  <div className="flex items-center">
                    <button onClick={() => toggleObjectiveExpansion(objective.id)} className="p-1 text-muted-foreground hover:text-primary">
                        {isObjectiveExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <div 
                  className="text-xs text-muted-foreground mt-1 space-y-0.5 cursor-pointer group"
                  onClick={() => handleNavigateToObjectiveDetail(objective.id)}
                >
                    {responsibleUser && (
                        <div className="flex items-center">
                            <Avatar className="w-5 h-5 mr-1.5 border border-primary/30">
                                <AvatarImage src={responsibleUser.avatar_url || undefined} alt={responsibleUser.name} />
                                <AvatarFallback className="text-xs">{getInitials(responsibleUser.name)}</AvatarFallback>
                            </Avatar>
                            PO: {responsibleUser.name}
                        </div>
                    )}
                    {coordinatorScrumMasterUser && (
                        <div className="flex items-center">
                            <Avatar className="w-5 h-5 mr-1.5 border border-teal-500/30">
                                <AvatarImage src={coordinatorScrumMasterUser.avatar_url || undefined} alt={coordinatorScrumMasterUser.name} />
                                <AvatarFallback className="text-xs">{getInitials(coordinatorScrumMasterUser.name)}</AvatarFallback>
                            </Avatar>
                            SM Coordenador: {coordinatorScrumMasterUser.name}
                        </div>
                    )}
                    {objective.due_date && (
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <CalendarDays className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                        Conclusão Obj.: {dueDateFormatted}
                        {daysRemaining !== null && objective.status !== 'Concluído' && (
                          <span className={`ml-1.5 font-medium ${daysRemaining < 0 ? 'text-red-500' : daysRemaining <= 7 ? 'text-orange-500' : 'text-green-500'}`}>
                            ({daysRemaining < 0 ? `${Math.abs(daysRemaining)} dias atrasado` : daysRemaining === 0 ? 'Hoje!' : `${daysRemaining} dias restantes`})
                          </span>
                        )}
                      </div>
                    )}
                </div>
                <div className="mt-2">
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Progresso Geral do Objetivo:</span>
                    <span className="font-semibold text-primary dark:text-primary-foreground">{progressPercentage.toFixed(0)}%</span>
                  </div>
                  <ProgressBar percentage={progressPercentage} />
                </div>
                <ObjectiveTag 
                  objectiveId={objective.id}
                  initialTag={objective.objective_tag}
                  onUpdate={onUpdateObjectiveTag}
                  canEdit={canEditTag}
                />
              </CardHeader>
              {isObjectiveExpanded && (
                <CardContent className="pt-2">
                  <div className="flex justify-between items-center mb-3 border-t pt-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Key Results e Tarefas:</p>
                    {(sortedKrs || []).length > 0 && (
                      <Button variant="ghost" size="sm" onClick={() => toggleAllKrsInObjective(objective.id)} className="text-xs">
                        {areKrsInObjectiveExpanded ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                        {areKrsInObjectiveExpanded ? 'Recolher KRs' : 'Expandir KRs'}
                      </Button>
                    )}
                  </div>
                  
                  {sortedKrs.length > 0 ? (
                    sortedKrs.map(kr => {
                      const sortedKrTasks = sortTasksByUrgency(kr.tasks || []); 
                      const krScrumMasterUser = getResponsibleUser(kr.responsible_id);
                      const krProgress = calculateOkrProgress(kr.tasks || []);
                      const krDueDateFormatted = formatDate(kr.due_date);
                      const krDaysRemaining = getDaysUntilDue(kr.due_date);
                      return (
                        <div key={kr.id} className="mb-4 pl-2 border-l-2 border-slate-200 dark:border-slate-700">
                          <div className="flex items-center mb-1">
                            <Target className="h-4 w-4 mr-2 text-accent" />
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{kr.title}</h4>
                          </div>
                          {kr.due_date && (
                            <div className="flex items-center text-xs text-muted-foreground ml-6 mb-1">
                                <CalendarDays className="h-3 w-3 mr-1 text-accent/80" />
                                Conclusão KR: {krDueDateFormatted}
                                {krDaysRemaining !== null && krProgress < 100 && (
                                <span className={`ml-1.5 font-medium ${krDaysRemaining < 0 ? 'text-red-400' : krDaysRemaining <= 7 ? 'text-orange-400' : 'text-green-400'}`}>
                                    ({krDaysRemaining < 0 ? `${Math.abs(krDaysRemaining)} dias atrasado` : krDaysRemaining === 0 ? 'Hoje!' : `${krDaysRemaining} dias restantes`})
                                </span>
                                )}
                            </div>
                          )}
                          <div className="ml-6 mb-1">
                            <div className="flex justify-between items-center text-xs text-muted-foreground">
                                <span>Progresso do KR:</span>
                                <span className="font-semibold text-accent">{krProgress.toFixed(0)}%</span>
                            </div>
                            <ProgressBar percentage={krProgress} small />
                          </div>
                          {krScrumMasterUser && (
                            <div className="flex items-center text-xs text-muted-foreground mb-2 ml-6">
                                <Avatar className="w-4 h-4 mr-1.5 border border-purple-500/30">
                                    <AvatarImage src={krScrumMasterUser.avatar_url || undefined} alt={krScrumMasterUser.name} />
                                    <AvatarFallback className="text-xs">{getInitials(krScrumMasterUser.name)}</AvatarFallback>
                                </Avatar>
                                SM do KR: {krScrumMasterUser.name}
                            </div>
                          )}
                          {areKrsInObjectiveExpanded && (
                            <>
                              {sortedKrTasks.length > 0 ? (
                                <ul className="space-y-1 ml-6">
                                  {sortedKrTasks.map(task => (
                                    <TaskItem 
                                      key={task.id} 
                                      task={task} 
                                      responsibleUser={getResponsibleUser(task.responsible_id)} 
                                      currentUser={currentUser}
                                      onUpdateTaskStatus={(taskId, newStatus) => onUpdateTaskStatusInKr(objective.id, kr.id, taskId, newStatus)}
                                      isDetailedView={false}
                                      okrResponsibleId={objective.responsible_id} 
                                      okrScrumMasterId={kr.responsible_id} 
                                      objectiveCoordinatorScrumMasterId={objective.coordinator_scrum_master_id}
                                    />
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-xs text-muted-foreground ml-6">Nenhuma tarefa neste KR.</p>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-muted-foreground">Nenhum KR definido para este Objetivo.</p>
                  )}
                   {canManageObjectiveLink && (
                     <div className="mt-3 border-t pt-3">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full text-primary border-primary hover:bg-primary/10"
                            onClick={() => handleNavigateToObjectiveDetail(objective.id)}
                        >
                            <PlusCircle className="mr-2 h-4 w-4" /> Gerenciar Objetivo / Adicionar KR
                        </Button>
                     </div>
                    )}
                </CardContent>
              )}
            </Card>
          );
        })}
         {objectives.length === 0 && (
          <p className="text-sm text-center text-muted-foreground py-10">Nenhum Objetivo nesta coluna.</p>
        )}
      </div>
    </motion.div>
  );
};

export default KanbanColumn;
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BacklogTaskList from '@/components/backlog/BacklogTaskList';

const BacklogSection = ({ title, tasks, icon, selectedObjectiveFilter, allAppUsers, objectives, currentUser, onDeleteTask, onUpdateTask, onRemoveTaskFromKr }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => setIsExpanded(!isExpanded);

  return (
    <section className="mb-10 p-4 rounded-lg shadow-md bg-white dark:bg-slate-800/50">
      <div 
        className="flex items-center justify-between cursor-pointer mb-4 pb-2 border-b-2 border-primary/30 dark:border-primary/20"
        onClick={toggleExpand}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleExpand();}}
        aria-expanded={isExpanded}
        aria-controls={`section-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <motion.h2 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="text-xl md:text-2xl font-semibold text-gray-700 dark:text-gray-300 flex items-center"
        >
          {icon} {title} <span className="ml-2 text-sm md:text-base font-normal text-muted-foreground">({tasks.length} {tasks.length === 1 ? 'tarefa' : 'tarefas'})</span>
        </motion.h2>
        <Button variant="ghost" size="icon" aria-label={isExpanded ? "Recolher seção" : "Expandir seção"}>
          {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-600 dark:text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400" />}
        </Button>
      </div>
      
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            id={`section-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
            key="content"
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: 'auto', opacity: 1, marginTop: '0rem' }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {tasks.length === 0 ? (
              <p className="text-muted-foreground text-sm py-2">Nenhuma tarefa nesta seção {selectedObjectiveFilter !== 'all' ? 'para o objetivo selecionado' : ''}.</p>
            ) : (
              <BacklogTaskList
                tasks={tasks}
                allAppUsers={allAppUsers}
                objectives={objectives} 
                currentUser={currentUser}
                onDeleteTask={onDeleteTask}
                onUpdateTask={onUpdateTask}
                onRemoveTaskFromKr={onRemoveTaskFromKr}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default BacklogSection;
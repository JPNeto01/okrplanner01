import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PlusCircle } from 'lucide-react';

const BacklogHeader = ({ canManageBacklogGlobal, onToggleAddTaskForm, showAddTaskForm }) => {
  return (
    <header className="flex flex-col sm:flex-row justify-between items-center mb-8 pb-4 border-b border-slate-300 dark:border-slate-700">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center">
        <Button variant="outline" size="icon" asChild className="mr-4">
          <Link to="/dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            Backlog de Tarefas da Empresa
          </h1>
          <p className="text-muted-foreground">Tarefas pendentes, vinculadas a Objetivos, aguardando atribuição a um KR.</p>
        </div>
      </motion.div>
      <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0">
        {canManageBacklogGlobal && (
          <Button onClick={onToggleAddTaskForm} variant="outline" className="text-primary border-primary hover:bg-primary/10">
            <PlusCircle className="mr-2 h-4 w-4" /> {showAddTaskForm ? 'Cancelar Nova Tarefa' : 'Adicionar Tarefa ao Backlog'}
          </Button>
        )}
      </div>
    </header>
  );
};

export default BacklogHeader;
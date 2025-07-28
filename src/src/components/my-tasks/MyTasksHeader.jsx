import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const MyTasksHeader = ({ availableObjectives, selectedObjectiveId, onObjectiveChange }) => {
  return (
    <header className="mb-8 pb-4 border-b border-slate-300 dark:border-slate-700">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center">
          <Button variant="outline" size="icon" asChild className="mr-4">
            <Link to="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              Minhas Tarefas
            </h1>
            <p className="text-muted-foreground">Gerencie as tarefas atribuídas a você.</p>
          </div>
        </motion.div>
      </div>
      
      {availableObjectives && availableObjectives.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-4 max-w-sm">
          <Label htmlFor="objective-filter" className="text-sm font-medium text-muted-foreground flex items-center mb-2">
            <Filter className="h-4 w-4 mr-2" />
            Filtrar por Objetivo
          </Label>
          <Select value={selectedObjectiveId || 'ALL_OBJECTIVES'} onValueChange={(value) => onObjectiveChange(value === "ALL_OBJECTIVES" ? "" : value)}>
            <SelectTrigger id="objective-filter">
              <SelectValue placeholder="Todos os Objetivos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL_OBJECTIVES">Todos os Objetivos</SelectItem>
              {availableObjectives.map(objective => (
                <SelectItem key={objective.id} value={objective.id}>
                  {objective.title.length > 50 ? `${objective.title.substring(0, 50)}...` : objective.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>
      )}
    </header>
  );
};

export default MyTasksHeader;
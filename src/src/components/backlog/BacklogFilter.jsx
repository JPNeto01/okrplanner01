import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Filter } from 'lucide-react';

const BacklogFilter = ({ objectives, selectedObjectiveFilter, onObjectiveFilterChange }) => {
  return (
    <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 p-4 rounded-lg bg-white dark:bg-slate-800 shadow">
      <div className="flex items-center text-muted-foreground mb-2 sm:mb-0">
        <Filter className="h-5 w-5 mr-2" />
        <Label htmlFor="objectiveFilter" className="text-sm font-medium whitespace-nowrap">
          Filtrar por Objetivo:
        </Label>
      </div>
      <Select value={selectedObjectiveFilter} onValueChange={onObjectiveFilterChange}>
        <SelectTrigger 
          id="objectiveFilter" 
          className="w-full sm:w-auto md:min-w-[300px] bg-background dark:bg-slate-700 border-slate-300 dark:border-slate-600"
          aria-label="Selecionar filtro de objetivo"
        >
          <SelectValue placeholder="Todos os Objetivos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Objetivos</SelectItem>
          {objectives.map(obj => (
            <SelectItem key={obj.id} value={obj.id}>{obj.title}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default BacklogFilter;
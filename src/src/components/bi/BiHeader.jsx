import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const BiHeader = ({ filters, setFilters, companies, responsibles, taskResponsibles, scrumMasters, availableObjectives, onExport, objectivesCount, currentUser }) => {
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value === "ALL_PLACEHOLDER_VALUE" ? "" : value }));
  };

  return (
    <div className="mb-8 p-6 bg-card dark:bg-slate-800 rounded-lg shadow-lg">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <div className="flex items-center mb-4 sm:mb-0">
          <Button variant="outline" size="icon" className="mr-3 h-10 w-10" asChild>
            <Link to="/dashboard"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary dark:text-primary-foreground">BI Estratégico</h1>
            <p className="text-muted-foreground">Análise de Objetivos e Tarefas {currentUser.group === 'product_owner' ? `da empresa ${currentUser.company}` : ''}.</p>
          </div>
        </div>
        <Button onClick={onExport} disabled={objectivesCount === 0}>
          <Download className="mr-2 h-4 w-4" /> Exportar Relatório (Excel)
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
        {currentUser.group === 'admin' && (
          <div>
            <Label htmlFor="bi-filter-company" className="text-sm font-medium text-muted-foreground">Empresa</Label>
            <Select value={filters.company || "ALL_PLACEHOLDER_VALUE"} onValueChange={(value) => handleFilterChange('company', value)}>
              <SelectTrigger id="bi-filter-company">
                <SelectValue placeholder="Todas as Empresas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL_PLACEHOLDER_VALUE">Todas as Empresas</SelectItem>
                {companies.map(company => <SelectItem key={company} value={company}>{company}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        <div>
          <Label htmlFor="bi-filter-responsible" className="text-sm font-medium text-muted-foreground">Responsável (Objetivo)</Label>
          <Select value={filters.responsibleId || "ALL_PLACEHOLDER_VALUE"} onValueChange={(value) => handleFilterChange('responsibleId', value)}>
            <SelectTrigger id="bi-filter-responsible">
              <SelectValue placeholder="Todos os Responsáveis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL_PLACEHOLDER_VALUE">Todos os Responsáveis</SelectItem>
              {responsibles.map(user => <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="bi-filter-task-responsible" className="text-sm font-medium text-muted-foreground">Responsável (Tarefas)</Label>
          <Select value={filters.taskResponsibleId || "ALL_PLACEHOLDER_VALUE"} onValueChange={(value) => handleFilterChange('taskResponsibleId', value)}>
            <SelectTrigger id="bi-filter-task-responsible">
              <SelectValue placeholder="Todos os Responsáveis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL_PLACEHOLDER_VALUE">Todos os Responsáveis</SelectItem>
              {taskResponsibles.map(user => <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="bi-filter-scrum-master" className="text-sm font-medium text-muted-foreground">Scrum Master</Label>
          <Select value={filters.scrumMasterId || "ALL_PLACEHOLDER_VALUE"} onValueChange={(value) => handleFilterChange('scrumMasterId', value)}>
            <SelectTrigger id="bi-filter-scrum-master">
              <SelectValue placeholder="Todos os Scrum Masters" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL_PLACEHOLDER_VALUE">Todos os Scrum Masters</SelectItem>
              {scrumMasters.map(user => <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="bi-filter-objective" className="text-sm font-medium text-muted-foreground">Objetivo</Label>
          <Select value={filters.objectiveId || "ALL_PLACEHOLDER_VALUE"} onValueChange={(value) => handleFilterChange('objectiveId', value)}>
            <SelectTrigger id="bi-filter-objective">
              <SelectValue placeholder="Todos os Objetivos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL_PLACEHOLDER_VALUE">Todos os Objetivos</SelectItem>
              {availableObjectives.map(objective => (
                <SelectItem key={objective.id} value={objective.id}>
                  {objective.title.length > 30 ? `${objective.title.substring(0, 30)}...` : objective.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="bi-filter-date-start" className="text-sm font-medium text-muted-foreground">Data Início (Criação)</Label>
          <Input 
            id="bi-filter-date-start" 
            type="date" 
            value={filters.startDate} 
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="bg-background dark:bg-slate-700"
          />
        </div>
      </div>
    </div>
  );
};

export default BiHeader;
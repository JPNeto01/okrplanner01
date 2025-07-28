import React, { useState, useEffect, cloneElement } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Navigate } from 'react-router-dom';
import { Loader2, BarChart2, ListChecks, AlertTriangle, TrendingUp, TrendingDown, CalendarCheck2, Zap, PackageCheck, AlarmClock as ClockIcon, Maximize, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from "@/components/ui/progress";

import BiHeader from '@/components/bi/BiHeader';
import KpiCard from '@/components/bi/KpiCard';
import ObjectivesTable from '@/components/bi/ObjectivesTable';
import ObjectiveProgressChart from '@/components/bi/ObjectiveProgressChart';
import TaskStatusDistributionChart from '@/components/bi/TaskStatusDistributionChart';
import ObjectiveKrCompletionChart from '@/components/bi/ObjectiveKrCompletionChart';
import WorkloadByResponsibleChart from '@/components/bi/WorkloadByResponsibleChart';
import ObjectivesWithOpenTasksChart from '@/components/bi/ObjectivesWithOpenTasksChart';
import CriticalObjectivesList from '@/components/bi/CriticalObjectivesList';
import ObjectiveSuccessRateChart from '@/components/bi/ObjectiveSuccessRateChart';
import DeadlineAdherenceChart from '@/components/bi/DeadlineAdherenceChart';
import TaskLeadTimeChart from '@/components/bi/TaskLeadTimeChart';
import TaskThroughputChart from '@/components/bi/TaskThroughputChart';
import CompletedTasksByResponsibleChart from '@/components/bi/CompletedTasksByResponsibleChart'; 
import ChartModal from '@/components/bi/ChartModal';

import { useBiData } from '@/hooks/useBiData';
import * as XLSX from 'xlsx';
import { format, parseISO } from 'date-fns';


const BusinessIntelligencePage = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const [filters, setFilters] = useState({ 
    company: '', 
    responsibleId: '', 
    taskResponsibleId: '', 
    scrumMasterId: '', 
    objectiveId: '', 
    startDate: '' 
  });
  const [expandedChart, setExpandedChart] = useState(null); 
  
  const {
    biData,
    loading,
    companies,
    responsibles,
    taskResponsibles,
    scrumMasters,
    availableObjectives,
    fetchData,
  } = useBiData(currentUser, filters);


  useEffect(() => {
    if (!authLoading && currentUser) {
      fetchData();
    }
  }, [authLoading, currentUser, fetchData, filters]);
  
  useEffect(() => {
    if (!currentUser) return;

    const changes = supabase.channel('bi-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'objectives' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'key_results' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(changes);
    };
  }, [currentUser, fetchData]);


  const handleExport = () => {
    const dataToExport = biData.objectives.map(obj => {
      const totalTasks = obj.allObjectiveTasks?.length || 0;
      const completedTasks = obj.allObjectiveTasks?.filter(t => t.status === 'Concluído').length || 0;
      const responsibleName = biData.allUsers.find(u => u.id === obj.responsible_id)?.name || 'N/A';
      const scrumMasterName = biData.allUsers.find(u => u.id === obj.coordinator_scrum_master_id)?.name || 'N/A';
      
      // Se há filtro por responsável de tarefas, mostrar apenas as tarefas desse responsável
      let filteredTasks = obj.allObjectiveTasks;
      if (filters.taskResponsibleId) {
        filteredTasks = obj.allObjectiveTasks.filter(task => task.responsible_id === filters.taskResponsibleId);
      }
      const filteredTotalTasks = filteredTasks.length;
      const filteredCompletedTasks = filteredTasks.filter(t => t.status === 'Concluído').length;
      
      return {
        "Nome do Objetivo": obj.title,
        "Responsável": responsibleName,
        "Scrum Master": scrumMasterName,
        "Empresa": obj.company,
        "Status (Tarefas)": obj.calculatedStatus,
        "Progresso (Tarefas %)": Math.round(obj.progressWithBacklog || 0),
        "Progresso (KRs %)": Math.round(obj.krCompletionRate || 0),
        "Total de Tarefas": filters.taskResponsibleId ? filteredTotalTasks : totalTasks,
        "Tarefas Concluídas": filters.taskResponsibleId ? filteredCompletedTasks : completedTasks,
        "Data de Início": obj.created_at ? format(parseISO(obj.created_at), 'dd/MM/yyyy') : 'N/A',
        "Data de Fim (Prazo)": obj.due_date ? format(parseISO(obj.due_date), 'dd/MM/yyyy') : 'N/A',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "RelatorioBI");
    
    let filterSuffix = '';
    if (filters.taskResponsibleId) {
      filterSuffix += `_ResponsavelTarefas_${taskResponsibles.find(u => u.id === filters.taskResponsibleId)?.name?.replace(/\s+/g, '_') || 'Filtrado'}`;
    }
    if (filters.scrumMasterId) {
      filterSuffix += `_ScrumMaster_${scrumMasters.find(u => u.id === filters.scrumMasterId)?.name?.replace(/\s+/g, '_') || 'Filtrado'}`;
    }
    if (filters.objectiveId) {
      filterSuffix += `_Objetivo_${availableObjectives.find(o => o.id === filters.objectiveId)?.title?.replace(/\s+/g, '_').substring(0, 20) || 'Filtrado'}`;
    }
    
    XLSX.writeFile(workbook, `Relatorio_BI_OKR${filterSuffix}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`);
  };

  const openChartModal = (title, chartElement, chartData, ChartComponent) => {
    setExpandedChart({ 
      title, 
      chartComponent: <ChartComponent data={chartData} isExpanded={true} /> 
    });
  };

  const closeChartModal = () => {
    setExpandedChart(null);
  };

  const renderChartCard = (title, description, chartData, ChartComponent, chartIdentifier) => {
    const isEmpty = !chartData || (Array.isArray(chartData) && chartData.length === 0) || (typeof chartData === 'object' && Object.keys(chartData).length === 0 && chartIdentifier !== 'deadlineAdherence') || (chartIdentifier === 'deadlineAdherence' && typeof chartData?.onTime !== 'number');
    
    const originalChartElement = isEmpty ? (
        <p className="text-muted-foreground text-center py-8">{`Nenhum dado para ${title.toLowerCase()}.`}</p>
      ) : (
        <ChartComponent data={chartData} isExpanded={false} />
      );

    return (
      <Card className="shadow-lg dark:bg-slate-800 xl:col-span-1 flex flex-col">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {!isEmpty && (
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={() => openChartModal(title, originalChartElement, chartData, ChartComponent)}>
              <Maximize className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent className="h-[350px] flex-grow">
          {originalChartElement}
        </CardContent>
      </Card>
    );
  };


  if (authLoading || (loading && !biData.objectives.length && Object.values(filters).every(f => !f)) ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 text-white">
        <Loader2 className="h-12 w-12 animate-spin mr-3" /> Carregando dados do BI...
      </div>
    );
  }

  if (!currentUser || !['admin', 'product_owner'].includes(currentUser.group)) {
    return <Navigate to="/dashboard" replace />;
  }

  const totalObjectives = biData.objectives.length;
  const totalTasks = biData.objectives.reduce((acc, obj) => {
    // Se há filtro por responsável de tarefas, contar apenas as tarefas desse responsável
    if (filters.taskResponsibleId) {
      return acc + (obj.allObjectiveTasks?.filter(task => task.responsible_id === filters.taskResponsibleId).length || 0);
    }
    return acc + (obj.allObjectiveTasks?.length || 0);
  }, 0);
  
  const overallProgressByTasks = totalObjectives > 0 
    ? biData.objectives.reduce((acc, obj) => acc + (obj.progressWithBacklog || 0), 0) / totalObjectives
    : 0;
  
  const overallProgressByKrs = totalObjectives > 0
    ? biData.objectives.reduce((acc, obj) => acc + (obj.krCompletionRate || 0), 0) / totalObjectives
    : 0;

  // Determinar se há filtros ativos para mostrar no título
  const activeFilters = [];
  if (filters.company) activeFilters.push(`Empresa: ${filters.company}`);
  if (filters.responsibleId) {
    const responsibleName = responsibles.find(u => u.id === filters.responsibleId)?.name;
    if (responsibleName) activeFilters.push(`Resp. Objetivo: ${responsibleName}`);
  }
  if (filters.taskResponsibleId) {
    const taskResponsibleName = taskResponsibles.find(u => u.id === filters.taskResponsibleId)?.name;
    if (taskResponsibleName) activeFilters.push(`Resp. Tarefas: ${taskResponsibleName}`);
  }
  if (filters.scrumMasterId) {
    const scrumMasterName = scrumMasters.find(u => u.id === filters.scrumMasterId)?.name;
    if (scrumMasterName) activeFilters.push(`Scrum Master: ${scrumMasterName}`);
  }
  if (filters.objectiveId) {
    const objectiveName = availableObjectives.find(o => o.id === filters.objectiveId)?.title;
    if (objectiveName) activeFilters.push(`Objetivo: ${objectiveName.length > 30 ? `${objectiveName.substring(0, 30)}...` : objectiveName}`);
  }
  if (filters.startDate) activeFilters.push(`Data: ${filters.startDate}`);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-4 md:p-8">
      <BiHeader 
        filters={filters} 
        setFilters={setFilters} 
        companies={companies} 
        responsibles={responsibles}
        taskResponsibles={taskResponsibles}
        scrumMasters={scrumMasters}
        availableObjectives={availableObjectives}
        onExport={handleExport}
        objectivesCount={totalObjectives}
        currentUser={currentUser}
      />

      {activeFilters.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Filtros Ativos:</h3>
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filter, index) => (
              <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                {filter}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <KpiCard title="Total de Objetivos" value={totalObjectives} description="Objetivos ativos e filtrados" icon={<BarChart2 className="h-4 w-4 text-muted-foreground" />} />
        <KpiCard title="Total de Tarefas" value={totalTasks} description={filters.taskResponsibleId ? "Tarefas do responsável selecionado" : "Tarefas vinculadas aos objetivos"} icon={<ListChecks className="h-4 w-4 text-muted-foreground" />} />
        <KpiCard title="Prog. Médio (Tarefas)" value={`${Math.round(overallProgressByTasks)}%`} description="Média de conclusão por tarefas" icon={<Progress value={overallProgressByTasks} className="w-full h-2"/>} />
        <KpiCard title="Prog. Médio (KRs)" value={`${Math.round(overallProgressByKrs)}%`} description="Média de conclusão por KRs" icon={<Progress value={overallProgressByKrs} className="w-full h-2"/>} />
      </div>
      
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 mb-8">
        {renderChartCard("Progresso dos Objetivos (por Tarefas)", "Baseado na conclusão de tarefas vinculadas.", biData.objectives, ObjectiveProgressChart, "objectives")}
        {renderChartCard("Progresso dos Objetivos (por KRs)", "Baseado na conclusão de Key Results.", biData.objectives, ObjectiveKrCompletionChart, "objectives")}
        {renderChartCard("Distribuição de Tarefas por Status", "Visão geral dos status de todas as tarefas.", biData.taskStatusCounts, TaskStatusDistributionChart, "taskStatusCounts")}
        {renderChartCard("Carga de Trabalho (Ativas)", "Tarefas (Backlog, A Fazer, Em Progresso) por colaborador.", biData.workloadByResponsible, WorkloadByResponsibleChart, "workloadByResponsible")}
        {renderChartCard("Tarefas Concluídas por Colaborador", "Produtividade individual em tarefas finalizadas.", biData.completedTasksByResponsible, CompletedTasksByResponsibleChart, "completedTasksByResponsible")}
        {renderChartCard("Objetivos com Tarefas Pendentes/Atrasadas", "Quantidade de tarefas não concluídas por objetivo.", biData.objectivesWithOpenTasks, ObjectivesWithOpenTasksChart, "objectivesWithOpenTasks")}
        
        <Card className="shadow-lg dark:bg-slate-800 xl:col-span-1">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="flex items-center"><AlertTriangle className="mr-2 h-5 w-5 text-red-500" />Ranking de Objetivos Críticos</CardTitle>
              <CardDescription>Objetivos que demandam atenção imediata.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-[350px] overflow-y-auto">
             {biData.criticalObjectives.length > 0 ? (
              <CriticalObjectivesList objectives={biData.criticalObjectives} allUsers={biData.allUsers} />
            ) : (
              <p className="text-muted-foreground text-center py-8">Nenhum objetivo crítico identificado.</p>
            )}
          </CardContent>
        </Card>

        {renderChartCard("Taxa de Sucesso dos Objetivos (Ciclos)", "Percentual de objetivos 100% concluídos (KRs) por ciclo.", biData.objectiveSuccessRateByCycle, ObjectiveSuccessRateChart, "objectiveSuccessRateByCycle")}
        {renderChartCard("Aderência ao Prazo dos Objetivos", "Objetivos 100% (KRs) concluídos dentro do prazo.", biData.deadlineAdherence, DeadlineAdherenceChart, "deadlineAdherence")}
        {renderChartCard("Lead Time Médio das Tarefas", "Tempo médio da criação à conclusão de tarefas.", biData.taskLeadTimeByPeriod, TaskLeadTimeChart, "taskLeadTimeByPeriod")}
        {renderChartCard("Throughput de Tarefas (Produtividade)", "Quantidade de tarefas concluídas por período.", biData.taskThroughputByPeriod, TaskThroughputChart, "taskThroughputByPeriod")}

      </div>

      {expandedChart && (
        <ChartModal 
          isOpen={!!expandedChart} 
          onClose={closeChartModal} 
          title={expandedChart.title}
        >
          {expandedChart.chartComponent}
        </ChartModal>
      )}

      <div className="mt-8">
        <ObjectivesTable objectives={biData.objectives} allUsers={biData.allUsers} />
      </div>

      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} OKR Manager BI. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default BusinessIntelligencePage;
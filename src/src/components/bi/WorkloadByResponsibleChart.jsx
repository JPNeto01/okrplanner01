import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = {
  'A Fazer': '#3b82f6', // blue-500
  'Em Progresso': '#eab308', // yellow-500
  'Backlog': '#f97316', // orange-500
  // 'Concluído': '#22c55e', // green-500 - Geralmente não mostramos concluídas na carga de trabalho
};

const WorkloadByResponsibleChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <p className="text-center text-muted-foreground py-8">Sem dados para exibir o gráfico de carga de trabalho.</p>;
  }

  // Filtra para mostrar apenas tarefas ativas na carga de trabalho
  const chartData = data.map(item => ({
    name: item.name,
    'A Fazer': item['A Fazer'] || 0,
    'Em Progresso': item['Em Progresso'] || 0,
    'Backlog': item['Backlog'] || 0,
  })).filter(item => item['A Fazer'] > 0 || item['Em Progresso'] > 0 || item['Backlog'] > 0);


  if (chartData.length === 0) {
    return <p className="text-center text-muted-foreground py-8">Nenhuma tarefa ativa encontrada para exibir carga de trabalho.</p>;
  }


  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={{
          top: 20, right: 30, left: 0, bottom: 40,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
        <XAxis 
            dataKey="name" 
            angle={-30}
            textAnchor="end"
            interval={0}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
        />
        <YAxis 
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            label={{ value: 'Nº de Tarefas', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))', fontSize: 12, dy: 40 }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            borderColor: 'hsl(var(--border))',
            borderRadius: 'var(--radius)',
            color: 'hsl(var(--foreground))'
          }}
        />
        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
        <Bar dataKey="Backlog" stackId="a" fill={COLORS['Backlog']} radius={[4, 4, 0, 0]} />
        <Bar dataKey="A Fazer" stackId="a" fill={COLORS['A Fazer']} />
        <Bar dataKey="Em Progresso" stackId="a" fill={COLORS['Em Progresso']} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default WorkloadByResponsibleChart;
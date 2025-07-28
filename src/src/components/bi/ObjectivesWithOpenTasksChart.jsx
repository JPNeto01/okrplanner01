import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const ObjectivesWithOpenTasksChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <p className="text-center text-muted-foreground py-8">Nenhum objetivo com tarefas pendentes ou atrasadas.</p>;
  }

  const chartData = data.map(obj => ({
    name: obj.name.length > 20 ? `${obj.name.substring(0, 18)}...` : obj.name,
    "Tarefas Pendentes": obj.openTasks - obj.overdueTasks, // Apenas pendentes, não atrasadas
    "Tarefas Atrasadas": obj.overdueTasks,
  }));

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
          label={{ value: 'Nº de Tarefas', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))', fontSize: 12, dy:40 }}
          allowDecimals={false}
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
        <Bar dataKey="Tarefas Pendentes" stackId="a" fill="#3b82f6" radius={[4,4,0,0]} />
        <Bar dataKey="Tarefas Atrasadas" stackId="a" fill="#ef4444" radius={[4,4,0,0]}/>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ObjectivesWithOpenTasksChart;
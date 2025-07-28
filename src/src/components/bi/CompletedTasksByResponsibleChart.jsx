import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CompletedTasksByResponsibleChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <p className="text-center text-muted-foreground py-8">Sem dados de tarefas concluídas para exibir.</p>;
  }

  const chartData = data.map(item => ({
    name: item.name,
    'Tarefas Concluídas': item.completedCount || 0,
  })).filter(item => item['Tarefas Concluídas'] > 0);

  if (chartData.length === 0) {
    return <p className="text-center text-muted-foreground py-8">Nenhum colaborador com tarefas concluídas.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={{
          top: 20, right: 30, left: 0, bottom: 40,
        }}
        layout="vertical" 
      >
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
        <XAxis 
            type="number"
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            allowDecimals={false}
        />
        <YAxis 
            dataKey="name" 
            type="category"
            width={100}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            interval={0}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            borderColor: 'hsl(var(--border))',
            borderRadius: 'var(--radius)',
            color: 'hsl(var(--foreground))'
          }}
          formatter={(value) => [`${value} tarefas`, 'Concluídas']}
        />
        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
        <Bar dataKey="Tarefas Concluídas" fill="#22c55e" radius={[0, 4, 4, 0]} barSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default CompletedTasksByResponsibleChart;
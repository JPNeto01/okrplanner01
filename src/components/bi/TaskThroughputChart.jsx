import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TaskThroughputChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <p className="text-center text-muted-foreground py-8">Dados insuficientes para o gráfico de throughput de tarefas.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{
          top: 20, right: 30, left: 0, bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
        <XAxis 
            dataKey="period" 
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
        />
        <YAxis 
            allowDecimals={false} 
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            label={{ value: 'Tarefas Concluídas', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))', fontSize: 12, dy:50 }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            borderColor: 'hsl(var(--border))',
            borderRadius: 'var(--radius)',
            color: 'hsl(var(--foreground))'
          }}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        <Bar dataKey="count" name="Tarefas Concluídas" fill="#82ca9d" radius={[4,4,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default TaskThroughputChart;
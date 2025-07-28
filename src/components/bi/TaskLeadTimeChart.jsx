import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TaskLeadTimeChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <p className="text-center text-muted-foreground py-8">Dados insuficientes para o gráfico de lead time de tarefas.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{
          top: 5, right: 30, left: 0, bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
        <XAxis 
            dataKey="period" 
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
        />
        <YAxis 
            tickFormatter={(value) => `${value}d`} 
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            label={{ value: 'Lead Time Médio (dias)', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))', fontSize: 12, dy:60 }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            borderColor: 'hsl(var(--border))',
            borderRadius: 'var(--radius)',
            color: 'hsl(var(--foreground))'
          }}
          formatter={(value) => [`${value} dias`, "Lead Time Médio"]}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        <Line type="monotone" dataKey="avgLeadTime" name="Lead Time Médio" stroke="#8884d8" activeDot={{ r: 8 }} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default TaskLeadTimeChart;
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

const COLORS = {
  onTime: '#22c55e', // green-500
  late: '#ef4444', // red-500
  notCompletedYet: '#f97316', // orange-500
  noDueDate: '#64748b', // slate-500
};

const DeadlineAdherenceChart = ({ data }) => {
  if (!data || (data.onTime === 0 && data.late === 0 && data.notCompletedYet === 0 && data.noDueDate === 0)) {
    return <p className="text-center text-muted-foreground py-8">Dados insuficientes para o gráfico de aderência ao prazo.</p>;
  }

  const pieData = [
    { name: 'Concluído no Prazo', value: data.onTime || 0 },
    { name: 'Concluído Atrasado / Atrasado', value: data.late || 0 },
    { name: 'Não Concluído (no prazo)', value: data.notCompletedYet || 0 },
    { name: 'Não Concluído (sem prazo)', value: data.noDueDate || 0 },
  ].filter(d => d.value > 0);

  const total = (data.onTime || 0) + (data.late || 0) + (data.notCompletedYet || 0) + (data.noDueDate || 0);
  const onTimePercentage = total > 0 ? Math.round(((data.onTime || 0) / total) * 100) : 0;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-4xl font-bold text-green-500 mb-2">{onTimePercentage}%</div>
        <p className="text-sm text-muted-foreground mb-4">Objetivos Concluídos no Prazo (KRs 100%)</p>
        <PieChart width={300} height={200}>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name.startsWith('Concluído no Prazo') ? 'onTime' : entry.name.startsWith('Concluído Atrasado') ? 'late' : entry.name.startsWith('Não Concluído (no prazo)') ? 'notCompletedYet' : 'noDueDate' ]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
                borderRadius: 'var(--radius)',
                color: 'hsl(var(--foreground))'
            }}
          />
          <Legend wrapperStyle={{ fontSize: '10px', marginTop: '10px' }} layout="vertical" align="center" verticalAlign="bottom"/>
        </PieChart>
      </div>
    </ResponsiveContainer>
  );
};

export default DeadlineAdherenceChart;
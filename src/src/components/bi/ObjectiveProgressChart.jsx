import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const COLORS = {
  'A Fazer': '#facc15', // yellow-400
  'Em Progresso': '#3b82f6', // blue-500
  'Concluído': '#22c55e', // green-500
  'Atrasado': '#ef4444', // red-500
};

const ObjectiveProgressChart = ({ data, isExpanded = false }) => {
  if (!data || data.length === 0) {
    return <p className="text-center text-muted-foreground py-8">Nenhum objetivo para exibir progresso.</p>;
  }

  const chartData = data.map(obj => ({
    name: isExpanded ? obj.title : (obj.title.length > 25 ? `${obj.title.substring(0, 22)}...` : obj.title),
    fullName: obj.title, 
    progress: Math.round(obj.progressWithBacklog || 0),
    status: obj.calculatedStatus,
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-background border border-border shadow-lg p-3 rounded-md">
          <p className="font-semibold text-sm text-foreground mb-1">{dataPoint.fullName}</p>
          <p className="text-xs text-muted-foreground">Progresso: <span style={{ color: COLORS[dataPoint.status] }}>{dataPoint.progress}%</span> ({dataPoint.status})</p>
        </div>
      );
    }
    return null;
  };

  const xAxisProps = isExpanded 
    ? {
        dataKey: "name",
        angle: data.length > 5 ? -30 : 0, // Menos ângulo se menos itens
        textAnchor: data.length > 5 ? "end" : "middle",
        interval: 0,
        tick: { fontSize: 11, fill: 'hsl(var(--muted-foreground))' },
        dy: data.length > 5 ? 5 : 10,
        height: data.length > 5 ? 80 : 40, // Mais espaço para labels maiores
      }
    : {
        dataKey: "name",
        angle: -45,
        textAnchor: "end",
        interval: 0,
        tick: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' },
        dy: 5,
        height: 70, // Manter altura original para modo não expandido
      };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={{
          top: 5, right: 10, left: -20, bottom: isExpanded ? (data.length > 5 ? 20 : 5) : 5, // Ajustar bottom margin quando expandido
        }}
      >
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
        <XAxis {...xAxisProps} />
        <YAxis 
          domain={[0, 100]} 
          tickFormatter={(value) => `${value}%`} 
          tick={{ fontSize: isExpanded ? 12 : 12, fill: 'hsl(var(--muted-foreground))' }}
          label={{ value: 'Progresso (%)', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))', fontSize: isExpanded ? 13 : 12, dy:30, dx:-5 }}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted-foreground))', fillOpacity: 0.1 }}/>
        <Bar dataKey="progress" name="Progresso (Tarefas)">
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[entry.status] || '#cccccc'} radius={[4, 4, 0, 0]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ObjectiveProgressChart;
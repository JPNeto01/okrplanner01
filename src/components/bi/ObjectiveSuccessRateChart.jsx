import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ObjectiveSuccessRateChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <p className="text-center text-muted-foreground py-8">Dados insuficientes para o gráfico de taxa de sucesso.</p>;
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
          dataKey="cycle" 
          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} 
        />
        <YAxis 
          tickFormatter={(value) => `${value}%`} 
          domain={[0, 100]} 
          tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          label={{ value: 'Taxa Sucesso (%)', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))', fontSize: 12, dy:50 }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            borderColor: 'hsl(var(--border))',
            borderRadius: 'var(--radius)',
            color: 'hsl(var(--foreground))'
          }}
          formatter={(value) => [`${value}%`, "Taxa de Sucesso"]}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        <Line type="monotone" dataKey="successRate" name="Taxa de Sucesso" stroke="#22c55e" activeDot={{ r: 8 }} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default ObjectiveSuccessRateChart;
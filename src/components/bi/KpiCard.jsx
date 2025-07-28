import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const KpiCard = ({ title, value, description, icon, trend }) => (
  <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 dark:bg-slate-800">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-primary dark:text-primary-foreground">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
      {trend && <p className={`text-xs mt-1 ${trend.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{trend}</p>}
    </CardContent>
  </Card>
);

export default KpiCard;
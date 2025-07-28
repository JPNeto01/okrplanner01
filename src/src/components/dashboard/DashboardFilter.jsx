import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { motion } from 'framer-motion';
import { User, Users, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DashboardFilter = ({ productOwners, scrumMasters, filters, onFilterChange, onClearFilters }) => {
  const hasActiveFilters = filters.poId || filters.smId;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-6 p-4 bg-card rounded-lg border shadow-sm"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
        <div className="space-y-2">
          <Label htmlFor="po-filter" className="flex items-center text-sm font-medium text-muted-foreground">
            <User className="h-4 w-4 mr-2" />
            PO Responsável
          </Label>
          <Select
            value={filters.poId || 'all'}
            onValueChange={(value) => onFilterChange('poId', value === 'all' ? null : value)}
          >
            <SelectTrigger id="po-filter" className="w-full">
              <SelectValue placeholder="Filtrar por PO..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os POs</SelectItem>
              {productOwners.map(po => (
                <SelectItem key={po.id} value={po.id}>{po.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sm-filter" className="flex items-center text-sm font-medium text-muted-foreground">
            <Users className="h-4 w-4 mr-2" />
            Scrum Master Coordenador
          </Label>
          <Select
            value={filters.smId || 'all'}
            onValueChange={(value) => onFilterChange('smId', value === 'all' ? null : value)}
          >
            <SelectTrigger id="sm-filter" className="w-full">
              <SelectValue placeholder="Filtrar por SM..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os SMs</SelectItem>
              {scrumMasters.map(sm => (
                <SelectItem key={sm.id} value={sm.id}>{sm.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {hasActiveFilters && (
          <div className="flex items-end h-full">
             <Button variant="ghost" onClick={onClearFilters} className="w-full sm:w-auto text-sm text-muted-foreground hover:text-destructive">
              <XCircle className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default DashboardFilter;
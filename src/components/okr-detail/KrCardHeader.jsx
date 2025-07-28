import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit3, ChevronDown, ChevronUp } from 'lucide-react';
import { getStatusColor } from '@/lib/okrUtils';

const KrCardHeader = ({ 
  title, 
  status, 
  progress, 
  canManageKr, 
  onOpenEditKrTitleModal,
  isTasksExpanded,
  onToggleTasks
}) => {
  const displayStatus = progress === 100 ? 'Concluído' : status;
  const statusColors = getStatusColor(displayStatus, progress);

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="mb-2"
    >
      <div className="flex justify-between items-start group">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 mr-1 text-muted-foreground hover:text-primary"
            onClick={onToggleTasks}
            aria-label={isTasksExpanded ? "Recolher tarefas" : "Expandir tarefas"}
          >
            {isTasksExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </Button>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 pr-2">{title}</h4>
          {canManageKr && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={onOpenEditKrTitleModal}
              aria-label="Editar título do KR"
            >
              <Edit3 className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
            </Button>
          )}
        </div>
        <Badge variant="outline" className={`whitespace-nowrap text-xs ${statusColors.borderColor} ${statusColors.textColor} ${statusColors.bgColorSoft}`}>
          {displayStatus}
        </Badge>
      </div>
    </motion.div>
  );
};

export default KrCardHeader;
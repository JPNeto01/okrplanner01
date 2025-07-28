import React from 'react';
import { motion } from 'framer-motion';
import { ListChecks, SearchX } from 'lucide-react';

const MyTasksEmptyState = ({ isFilterActive = false }) => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-10">
      {isFilterActive ? (
        <>
          <SearchX className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Nenhuma tarefa encontrada</h2>
          <p className="text-muted-foreground">Nenhuma tarefa corresponde ao objetivo selecionado.</p>
        </>
      ) : (
        <>
          <ListChecks className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Nenhuma tarefa para você!</h2>
          <p className="text-muted-foreground">Parece que você está livre por enquanto ou suas tarefas ainda não foram atribuídas.</p>
        </>
      )}
    </motion.div>
  );
};

export default MyTasksEmptyState;
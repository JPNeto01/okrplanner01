
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const UserInventoryList = ({ assignments, isLoading }) => {
  const navigate = useNavigate();

  const getStatusVariant = (status) => {
    switch (status) {
      case 'Novo': return 'secondary';
      case 'Em andamento': return 'default';
      case 'Com divergência': return 'destructive';
      case 'Concluído': return 'success';
      default: return 'outline';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Minhas Contagens Ativas</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-4 text-lg text-muted-foreground">Carregando suas tarefas...</p>
        </CardContent>
      </Card>
    );
  }

  if (assignments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Minhas Contagens Ativas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            Você não tem nenhuma contagem ativa no momento.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Minhas Contagens Ativas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {assignments.map((assign, index) => (
            <motion.div
              key={assign.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 w-full">
                  <div>
                    <p className="text-sm text-muted-foreground">Inventário</p>
                    <p className="font-semibold">{assign.inventories.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sua Etapa</p>
                    <p className="font-medium">{assign.count_stage}ª Contagem</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Criação</p>
                    <p className="font-medium">{formatDate(assign.inventories.created_at)}</p>
                  </div>
                   <div>
                    <p className="text-sm text-muted-foreground">Status do Inventário</p>
                    <Badge variant={getStatusVariant(assign.inventories.status)}>{assign.inventories.status}</Badge>
                  </div>
                </div>
                <div className="ml-4">
                  <Button variant="default" size="sm" onClick={() => navigate(`/inventory/count/${assign.id}`)}>
                    Iniciar Contagem <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserInventoryList;

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit, Trash2, Users, CalendarDays, Target, UserCircle, UserCog } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Logo from '@/components/Logo';

const OkrDetailHeader = ({ objective, responsibleUser, coordinatorScrumMasterUser, canEditObjective, canDeleteObjective, onEditObjective, onDeleteObjective }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'Não definida';
    return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  return (
    <Card className="mb-6 shadow-lg bg-card text-card-foreground">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
          <Logo size="sm" className="mb-4 sm:mb-0" />
          <Button variant="ghost" size="sm" asChild className="self-start sm:self-center">
            <Link to="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Dashboard
            </Link>
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start">
          <div>
            <CardTitle className="text-3xl font-bold text-primary flex items-center">
              <Target className="mr-3 h-8 w-8" /> {objective.title}
            </CardTitle>
          </div>
          {(canEditObjective || canDeleteObjective) && (
            <div className="flex space-x-2 mt-3 sm:mt-0">
              {canEditObjective && (
                <Button variant="outline" size="sm" onClick={onEditObjective}>
                  <Edit className="mr-2 h-4 w-4" /> Editar
                </Button>
              )}
              {canDeleteObjective && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" /> Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir o objetivo "{objective.title}"? Esta ação removerá o objetivo, todos os seus KRs e tarefas associadas. Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={onDeleteObjective} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          )}
        </div>
        <CardDescription className="mt-2 text-base text-muted-foreground">{objective.description}</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
        <div className="flex items-center space-x-2 text-sm">
          <UserCircle className="h-5 w-5 text-primary" />
          <div>
            <span className="font-semibold text-foreground">Product Owner (PO):</span>
            <p className="text-muted-foreground">{responsibleUser?.name || 'Não definido'}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <UserCog className="h-5 w-5 text-accent" />
          <div>
            <span className="font-semibold text-foreground">Scrum Master Coordenador:</span>
            <p className="text-muted-foreground">{coordinatorScrumMasterUser?.name || 'Não definido'}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <CalendarDays className="h-5 w-5 text-green-600" />
          <div>
            <span className="font-semibold text-foreground">Data de Conclusão (OKR):</span>
            <p className="text-muted-foreground">{formatDate(objective.due_date)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OkrDetailHeader;
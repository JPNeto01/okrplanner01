import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // Import Textarea
import { Target, CalendarClock, UserCheck } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const ObjectiveDetailsForm = ({
  objectiveTitle, setObjectiveTitle,
  objectiveDescription, setObjectiveDescription, // Added description props
  objectiveResponsible, setObjectiveResponsible,
  objectiveCoordinatorScrumMaster, setObjectiveCoordinatorScrumMaster,
  objectiveStatus, setObjectiveStatus,
  objectiveDueDate, setObjectiveDueDate,
  productOwners,
  scrumMasters,
  currentUserCompany 
}) => {
  return (
    <Card className="shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center text-primary dark:text-primary-foreground">
          <Target className="mr-3 h-7 w-7" /> Detalhes do Objetivo
        </CardTitle>
        <CardDescription>
          Defina o Objetivo principal. A empresa será automaticamente definida como: <span className="font-semibold text-primary">{currentUserCompany || "Não definida"}</span>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="objectiveTitle">Título do Objetivo</Label>
          <Input id="objectiveTitle" type="text" value={objectiveTitle} onChange={e => setObjectiveTitle(e.target.value)} required placeholder="Ex: Conquistar liderança de mercado" />
        </div>

        <div>
          <Label htmlFor="objectiveDescription">Descrição do Objetivo (Opcional)</Label>
          <Textarea 
            id="objectiveDescription" 
            value={objectiveDescription} 
            onChange={e => setObjectiveDescription(e.target.value)} 
            placeholder="Detalhes adicionais sobre este objetivo..." 
            rows={3}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="objectiveResponsible">Product Owner Responsável</Label>
            <Select value={objectiveResponsible} onValueChange={setObjectiveResponsible} required>
              <SelectTrigger id="objectiveResponsible">
                <SelectValue placeholder="Selecione o PO" />
              </SelectTrigger>
              <SelectContent>
                {productOwners.map(user => (
                  <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="objectiveCoordinatorScrumMaster">Scrum Master Coordenador (Opcional)</Label>
            <Select value={objectiveCoordinatorScrumMaster} onValueChange={setObjectiveCoordinatorScrumMaster}>
              <SelectTrigger id="objectiveCoordinatorScrumMaster">
                <SelectValue placeholder="Selecione o SM Coordenador" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none_">Nenhum</SelectItem>
                {scrumMasters.map(user => (
                  <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="objectiveDueDate">Prazo Final do Objetivo</Label>
            <div className="relative">
                <CalendarClock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="objectiveDueDate" type="date" value={objectiveDueDate} onChange={e => setObjectiveDueDate(e.target.value)} className="pl-8" required />
            </div>
          </div>
          <div>
            <Label htmlFor="objectiveStatus">Status Inicial do Objetivo</Label>
            <Select value={objectiveStatus} onValueChange={setObjectiveStatus}>
            <SelectTrigger id="objectiveStatus">
                <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="A Fazer">A Fazer</SelectItem>
                <SelectItem value="Em Progresso">Em Progresso</SelectItem>
                <SelectItem value="Concluído">Concluído</SelectItem>
            </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ObjectiveDetailsForm;
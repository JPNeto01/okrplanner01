import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, CalendarClock } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const KrDetailsForm = ({ 
  krTitle, setKrTitle, 
  krDescription, setKrDescription, 
  krScrumMaster, setKrScrumMaster, 
  scrumMasters = [], 
  krDueDate, setKrDueDate, 
  krStatus, setKrStatus,
  isKrScrumMasterDisabled // Nova propriedade
}) => (
  <Card className="shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
    <CardHeader>
      <CardTitle className="text-xl flex items-center text-teal-600 dark:text-teal-400">
        <Target className="mr-2 h-6 w-6" /> Detalhes do Key Result
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <Label htmlFor="krTitle">Título do KR</Label>
        <Input id="krTitle" value={krTitle} onChange={e => setKrTitle(e.target.value)} placeholder="Ex: Aumentar taxa de conversão em 15%" required />
      </div>
      <div>
        <Label htmlFor="krDescription">Descrição do KR (Opcional)</Label>
        <Textarea id="krDescription" value={krDescription} onChange={e => setKrDescription(e.target.value)} placeholder="Detalhes adicionais sobre este KR" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="krScrumMaster">Scrum Master do KR</Label>
          <Select value={krScrumMaster} onValueChange={setKrScrumMaster} required disabled={isKrScrumMasterDisabled}>
            <SelectTrigger id="krScrumMaster">
              <SelectValue placeholder="Selecione o SM" />
            </SelectTrigger>
            <SelectContent>
              {scrumMasters.map(user => (
                <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isKrScrumMasterDisabled && scrumMasters.find(sm => sm.id === krScrumMaster) && (
            <p className="text-xs text-muted-foreground mt-1">
              Definido automaticamente pelo SM do Objetivo: {scrumMasters.find(sm => sm.id === krScrumMaster)?.name}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="krDueDate">Prazo do KR</Label>
          <div className="relative">
            <CalendarClock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="krDueDate" type="date" value={krDueDate} onChange={e => setKrDueDate(e.target.value)} className="pl-8" required />
          </div>
        </div>
        <div>
          <Label htmlFor="krStatus">Status Inicial do KR</Label>
          <Select value={krStatus} onValueChange={setKrStatus}>
          <SelectTrigger id="krStatus">
              <SelectValue placeholder="Selecione" />
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

export default KrDetailsForm;
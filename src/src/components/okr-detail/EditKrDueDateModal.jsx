import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { CalendarDays } from 'lucide-react';

const EditKrDueDateModal = ({ isOpen, onClose, kr, onSave }) => {
  const [dueDate, setDueDate] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (kr) {
      setDueDate(kr.due_date || '');
    }
  }, [kr]);

  const handleSubmit = async () => {
    if (!kr) return;
    
    if (dueDate && isNaN(new Date(dueDate).getTime())) {
      toast({
        title: "Data Inválida",
        description: "O formato da data de entrega é inválido. Use AAAA-MM-DD.",
        variant: "destructive",
      });
      return;
    }

    try {
      await onSave(kr.id, dueDate || null); 
      toast({ title: 'Data de Entrega Atualizada', description: 'A data de entrega do Key Result foi salva com sucesso.' });
      onClose();
    } catch (error)
    {
      toast({ title: 'Erro ao Salvar', description: error.message || 'Não foi possível salvar a data de entrega.', variant: 'destructive' });
    }
  };

  if (!kr) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-900">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <CalendarDays className="mr-2 h-5 w-5 text-primary" />
            Editar Data de Entrega do KR
          </DialogTitle>
          <DialogDescription>
            Altere a data de previsão de entrega para o KR: "{kr.title}". Deixe em branco para remover a data.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 items-center gap-4">
            <Label htmlFor="kr-due-date-edit" className="text-left">
              Data de Entrega
            </Label>
            <Input
              id="kr-due-date-edit"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSubmit}>Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditKrDueDateModal;
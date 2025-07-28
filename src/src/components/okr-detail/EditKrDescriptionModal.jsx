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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

const EditKrDescriptionModal = ({ isOpen, onClose, kr, onSave }) => {
  const [description, setDescription] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (kr) {
      setDescription(kr.description || '');
    }
  }, [kr]);

  const handleSubmit = async () => {
    if (!kr) return;
    try {
      await onSave(kr.id, description);
      toast({ title: 'Descrição Atualizada', description: 'A descrição do Key Result foi salva com sucesso.' });
      onClose();
    } catch (error)
    {
      toast({ title: 'Erro ao Salvar', description: error.message || 'Não foi possível salvar a descrição.', variant: 'destructive' });
    }
  };

  if (!kr) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-900">
        <DialogHeader>
          <DialogTitle>Editar Descrição do Key Result</DialogTitle>
          <DialogDescription>
            Altere a descrição para o KR: "{kr.title}". Clique em salvar quando terminar.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 items-center gap-4">
            <Label htmlFor="kr-description" className="text-left">
              Descrição
            </Label>
            <Textarea
              id="kr-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3 min-h-[100px]"
              placeholder="Digite a nova descrição do Key Result aqui..."
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

export default EditKrDescriptionModal;
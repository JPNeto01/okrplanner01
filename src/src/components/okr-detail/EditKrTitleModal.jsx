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

const EditKrTitleModal = ({ isOpen, onClose, kr, onSave }) => {
  const [title, setTitle] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (kr) {
      setTitle(kr.title || '');
    }
  }, [kr]);

  const handleSubmit = async () => {
    if (!kr) return;
    if (!title.trim()) {
      toast({ title: 'Título Inválido', description: 'O título do Key Result não pode estar vazio.', variant: 'destructive' });
      return;
    }
    try {
      await onSave(kr.id, title.trim());
      toast({ title: 'Título Atualizado', description: 'O título do Key Result foi salvo com sucesso.' });
      onClose();
    } catch (error)
    {
      toast({ title: 'Erro ao Salvar', description: error.message || 'Não foi possível salvar o título.', variant: 'destructive' });
    }
  };

  if (!kr) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-900">
        <DialogHeader>
          <DialogTitle>Editar Título do Key Result</DialogTitle>
          <DialogDescription>
            Altere o título para o KR. Clique em salvar quando terminar.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 items-center gap-4">
            <Label htmlFor="kr-title-edit" className="text-left">
              Título
            </Label>
            <Input
              id="kr-title-edit"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3"
              placeholder="Digite o novo título do Key Result aqui..."
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

export default EditKrTitleModal;
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from '@/components/ui/use-toast';

const PasswordChangeModal = ({ isOpen, setIsOpen, user, updateUserPassword, onPasswordChanged }) => {
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (user && newPassword) {
      setIsLoading(true);
      try {
        const success = await updateUserPassword(user.id, newPassword);
        if (success) {
          onPasswordChanged();
          setIsOpen(false);
          setNewPassword('');
        }
      } catch (error) {
        console.error("Error in password change:", error);
        toast({ title: "Erro", description: `Não foi possível atualizar a senha.`, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-800">
        <DialogHeader>
          <DialogTitle className="text-primary dark:text-primary-foreground">Alterar Senha para {user?.name}</DialogTitle>
          <DialogDescription>
            Digite a nova senha para o usuário. Esta ação é irreversível.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handlePasswordChange}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-password-modal" className="text-right">
                Nova Senha
              </Label>
              <Input
                id="new-password-modal"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="col-span-3"
                placeholder="Mínimo 8 caracteres"
                required
                disabled={isLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isLoading || !newPassword}>
              {isLoading ? 'Salvando...' : 'Salvar Nova Senha'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordChangeModal;
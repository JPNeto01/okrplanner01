import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Mail, Loader2 } from 'lucide-react';

const RequestPasswordResetModal = ({ isOpen, onOpenChange }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { requestPasswordReset } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const success = await requestPasswordReset(email);

    if (success) {
      toast({
        title: "Link Enviado!",
        description: `Se uma conta existir para ${email}, um link de recuperação foi enviado. Verifique sua caixa de entrada e spam.`,
        className: "bg-green-500 text-white",
        duration: 7000,
      });
      onOpenChange(false); 
      setEmail(''); 
    }
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card dark:bg-slate-800/80 backdrop-blur-md border-slate-300/50 dark:border-slate-700/50">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-3 p-2.5 bg-primary rounded-full inline-block">
            <Mail className="h-7 w-7 text-primary-foreground" />
          </div>
          <DialogTitle className="text-2xl font-semibold text-primary dark:text-secondary">Recuperar Senha</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Digite seu e-mail para enviarmos um link de recuperação de senha.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="reset-email" className="text-sm font-medium text-foreground/90">Email de Recuperação</Label>
            <Input
              id="reset-email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-input border-input-border placeholder:text-placeholder-text focus:ring-2 focus:ring-input-focus-ring focus:border-transparent rounded-lg py-2.5"
            />
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 dark:bg-secondary dark:hover:bg-secondary/90 dark:text-secondary-foreground text-primary-foreground text-base font-semibold py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300" 
              disabled={loading}
            >
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</> : 'Enviar Link'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RequestPasswordResetModal;
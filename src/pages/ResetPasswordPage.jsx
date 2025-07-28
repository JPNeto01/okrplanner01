import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { LockKeyhole, KeyRound, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

const ResetPasswordPage = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSessionValid, setIsSessionValid] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const navigate = useNavigate();
  const location = useLocation(); 
  const { toast } = useToast();
  
  useEffect(() => {
    const checkUserSession = async () => {
      setCheckingSession(true);
      await new Promise(resolve => setTimeout(resolve, 500)); 

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Error fetching session for password reset:", sessionError);
        setIsSessionValid(false);
        setError("Erro ao verificar sessão. Tente novamente.");
        toast({ title: "Erro de Sessão", description: sessionError.message, variant: "destructive" });
      } else if (session && session.user) {
        setIsSessionValid(true);
        if (!session.user.email_confirmed_at) {
            console.warn("User session active but email not confirmed on ResetPasswordPage.");
        }
      } else {
        setIsSessionValid(false);
        setError("Sessão inválida ou expirada. Por favor, solicite um novo link de confirmação ou redefinição de senha.");
        toast({
          title: "Sessão Inválida",
          description: "Link inválido ou expirado. Se você acabou de confirmar seu e-mail, tente novamente em alguns instantes. Caso contrário, solicite um novo link.",
          variant: "destructive",
          duration: 7000
        });
      }
      setCheckingSession(false);
    };
    
    checkUserSession();

  }, [toast]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!isSessionValid) {
        setError("Sessão inválida. Não é possível redefinir a senha.");
        toast({ title: "Erro", description: "Sessão inválida para redefinir senha.", variant: "destructive" });
        return;
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      toast({ title: "Erro", description: "As senhas digitadas não coincidem.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      toast({ title: "Erro", description: "A senha deve ter pelo menos 6 caracteres.", variant: "destructive" });
      return;
    }

    setLoading(true);
    
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

    if (updateError) {
      setError(updateError.message);
      toast({ title: "Erro ao Atualizar Senha", description: updateError.message, variant: "destructive" });
    } else {
      setSuccessMessage("Senha atualizada com sucesso!");
      toast({ title: "Sucesso!", description: "Sua senha foi atualizada. Você será redirecionado para o login." });
      
      await supabase.auth.signOut();
      setTimeout(() => navigate('/login', { replace: true }), 3000);
    }
    setLoading(false);
  };
  
  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 p-4">
        <Card className="w-full max-w-md shadow-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-md text-center">
          <CardHeader className="items-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <CardTitle className="text-2xl">Verificando Sessão...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Aguarde enquanto validamos sua permissão para redefinir a senha.</p>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-4">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md shadow-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-md">
          <CardHeader className="text-center">
             <motion.div 
              className="mx-auto mb-4 p-3 bg-primary rounded-full inline-block"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <LockKeyhole className="h-10 w-10 text-primary-foreground" />
            </motion.div>
            <CardTitle className="text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-100">
              {successMessage ? "Senha Atualizada!" : "Definir Nova Senha"}
            </CardTitle>
            {!successMessage && (
                <CardDescription className="text-muted-foreground mt-1">
                Digite sua nova senha abaixo.
                </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {!isSessionValid && !checkingSession && !successMessage && (
                 <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-100 dark:bg-red-900 dark:text-red-300 flex items-center" role="alert">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    <span>{error || "Link inválido ou expirado. Não é possível redefinir a senha."}</span>
                </div>
            )}
            {successMessage && (
              <div className="p-4 mb-4 text-sm text-green-800 rounded-lg bg-green-100 dark:bg-green-900 dark:text-green-300 flex items-center" role="alert">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span>{successMessage} Redirecionando para login...</span>
              </div>
            )}
            {!successMessage && isSessionValid && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nova Senha</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="pl-8 bg-white/80 focus:bg-white dark:bg-slate-700/50 dark:focus:bg-slate-700"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                  <div className="relative">
                     <KeyRound className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="pl-8 bg-white/80 focus:bg-white dark:bg-slate-700/50 dark:focus:bg-slate-700"
                    />
                  </div>
                </div>
                {error && !successMessage && <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>}
                <Button type="submit" className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity duration-300 text-lg py-3" disabled={loading || !isSessionValid}>
                  {loading ? 'Salvando...' : 'Salvar Nova Senha'}
                </Button>
              </form>
            )}
            {!successMessage && !isSessionValid && (
                 <Button asChild size="lg" className="mt-6 w-full max-w-xs bg-destructive hover:bg-destructive/90 text-white text-lg py-3 shadow-lg transition-transform hover:scale-105">
                    <Link to="/login">Voltar para Login</Link>
                </Button>
            )}
          </CardContent>
          {!successMessage && isSessionValid && (
            <CardFooter className="text-center text-sm text-muted-foreground">
                <p>Escolha uma senha forte e segura.</p>
            </CardFooter>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
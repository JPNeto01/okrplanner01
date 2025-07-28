import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AccountConfirmedPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [status, setStatus] = useState('loading'); // 'loading', 'confirmed', 'error'
  const [message, setMessage] = useState('Verificando sua confirmação...');

  useEffect(() => {
    const handleConfirmation = async () => {
      // O Supabase redireciona com um hash na URL após o clique no link
      // Ex: #access_token=...&token_type=bearer&type=signup
      // O onAuthStateChange no AuthContext deve lidar com a sessão.
      // Aqui, vamos verificar se a sessão foi estabelecida e se o e-mail foi confirmado.

      // Um pequeno delay para dar tempo ao onAuthStateChange do AuthContext de processar.
      // Se o evento 'SIGNED_IN' com type 'signup' já foi processado pelo AuthContext,
      // supabaseUser já estará definido.
      await new Promise(resolve => setTimeout(resolve, 1800)); 

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Session error on AccountConfirmedPage:", sessionError);
        setStatus('error');
        setMessage('Ocorreu um erro ao verificar sua sessão. Tente fazer login.');
        toast({ title: "Erro de Sessão", description: sessionError.message, variant: "destructive" });
        return;
      }
      
      // Verifica se o evento é de signup, o que significa que o usuário acabou de confirmar o e-mail.
      const params = new URLSearchParams(location.hash.substring(1)); // Pega o fragmento da URL
      const eventType = params.get('type');

      if (session && session.user) {
        if (session.user.email_confirmed_at) {
          if (eventType === 'signup' || (session.user.created_at === session.user.last_sign_in_at)) { // Heurística para primeira vez
            setStatus('confirmed');
            setMessage('Sua conta foi confirmada com sucesso! Você será redirecionado para definir sua senha.');
            toast({
              title: "Conta Confirmada!",
              description: "Agora, por favor, defina sua senha.",
              variant: "default"
            });
            setTimeout(() => {
              navigate('/reset-password', { replace: true });
            }, 3000);
          } else {
             // E-mail confirmado, mas não é o fluxo de signup (pode ser um login normal)
             // Ou já passou pelo fluxo de redefinição de senha.
            setStatus('confirmed');
            setMessage('Sua conta já está confirmada. Você pode fazer login.');
            toast({ title: "Conta Já Confirmada", description: "Seu e-mail já foi verificado.", variant: "default" });
             setTimeout(() => {
              navigate('/login', { replace: true });
            }, 3000);
          }
        } else {
          // Sessão existe, mas e-mail não confirmado. Isso é estranho após um link de confirmação.
          setStatus('error');
          setMessage('Seu e-mail ainda não parece estar confirmado. O link pode ter expirado ou ser inválido. Por favor, tente novamente ou contate o suporte.');
          toast({ title: "Confirmação Pendente", description: "Seu e-mail ainda não foi confirmado.", variant: "warning" });
        }
      } else {
        // Sem sessão, significa que o token no link era inválido ou expirado.
        setStatus('error');
        setMessage('Não foi possível confirmar sua conta. O link pode ser inválido ou ter expirado. Tente se registrar novamente ou contate o suporte.');
        toast({ title: "Falha na Confirmação", description: "Link inválido ou expirado. Se você acabou de se registrar, verifique seu e-mail por um novo link.", variant: "destructive" });
      }
    };

    handleConfirmation();
  }, [navigate, toast, location.hash]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 via-teal-500 to-blue-600 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 150 }}
      >
        <Card className="w-full max-w-md shadow-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-md">
          <CardHeader className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
              className="mx-auto mb-6"
            >
              {status === 'loading' && <Loader2 className="h-20 w-20 text-blue-500 dark:text-blue-400 animate-spin" />}
              {status === 'confirmed' && <CheckCircle className="h-20 w-20 text-green-500 dark:text-green-400" />}
              {status === 'error' && <AlertTriangle className="h-20 w-20 text-red-500 dark:text-red-400" />}
            </motion.div>
            <CardTitle className="text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-100">
              {status === 'loading' && 'Verificando...'}
              {status === 'confirmed' && 'Conta Confirmada!'}
              {status === 'error' && 'Falha na Confirmação'}
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2 text-lg">
              {message}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {status === 'error' && (
              <Button asChild size="lg" className="mt-6 w-full max-w-xs bg-primary hover:bg-primary/90 text-white text-lg py-3 shadow-lg transition-transform hover:scale-105">
                <Link to="/login">Ir para Login</Link>
              </Button>
            )}
             {status === 'confirmed' && message.includes("Você pode fazer login") && (
              <Button asChild size="lg" className="mt-6 w-full max-w-xs bg-primary hover:bg-primary/90 text-white text-lg py-3 shadow-lg transition-transform hover:scale-105">
                <Link to="/login">Ir para Login</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AccountConfirmedPage;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import RequestPasswordResetModal from '@/components/auth/RequestPasswordResetModal.jsx';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRequestResetModalOpen, setIsRequestResetModalOpen] = useState(false); 
  const { login, currentUser, loading: authLoading } = useAuth(); 
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (currentUser && !authLoading) {
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || authLoading) return; 

    setIsSubmitting(true);
    try {
      const success = await login(email, password); 
      if (success) {
        // A navegação será tratada pelo useEffect acima quando currentUser for atualizado
        // e authLoading se tornar false.
      } else {
        // Se o login falhar (ex: credenciais inválidas, e-mail não confirmado), 
        // o toast já é mostrado dentro da função loginUser.
        // Não precisamos de um toast aqui, a menos que queiramos um genérico.
      }
    } catch (error) {
      toast({
        title: "Erro Inesperado no Login",
        description: error.message || "Ocorreu um problema. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const leftSectionImageUrl = "https://rrhtsqiscmofhuxasrpw.supabase.co/storage/v1/object/public/image.logo//ChatGPT%20Image%2029%20de%20mai.%20de%202025,%2018_04_31.png";

  return (
    <>
      <div className="min-h-screen w-full flex items-stretch bg-background dark:bg-slate-900">
        <motion.div
          className="hidden lg:flex lg:w-1/2 items-center justify-center" 
          style={{ 
            backgroundImage: `url('${leftSectionImageUrl}')`,
            backgroundSize: 'contain', 
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
        </motion.div>

        <motion.div
          className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 sm:p-12 bg-background dark:bg-slate-900" 
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
        >
          <div className="w-full max-w-md">
            <div className="lg:hidden mb-8 text-center">
               <img-replace src={leftSectionImageUrl} alt="OKR Planner Visual" className="w-48 h-auto mx-auto mb-4 filter drop-shadow-[0_0_8px_hsl(var(--secondary)/0.5)]" />
            </div>
            
            <motion.div 
              className="bg-card/80 dark:bg-card/10 p-8 sm:p-10 rounded-2xl shadow-2xl backdrop-blur-lg border border-border/30 dark:border-border/20"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="text-center mb-8">
                <h1 
                  className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary dark:from-primary dark:to-accent"
                  style={{
                    textShadow: '0 0 8px hsla(var(--primary-foreground),0.2), 1px 1px 2px rgba(0,0,0,0.1)' 
                  }}
                >
                  OKR Planner
                </h1>
                <p className="text-muted-foreground">Acesse sua conta para gerenciar seus OKRs.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground/90">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={authLoading || isSubmitting}
                    className="bg-input border-input-border placeholder:text-placeholder-text focus:ring-2 focus:ring-input-focus-ring focus:border-transparent rounded-lg py-2.5"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground/90">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Sua senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={authLoading || isSubmitting}
                      className="bg-input border-input-border placeholder:text-placeholder-text focus:ring-2 focus:ring-input-focus-ring focus:border-transparent rounded-lg py-2.5 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={authLoading || isSubmitting}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90 dark:bg-secondary dark:hover:bg-secondary/90 dark:text-secondary-foreground text-primary-foreground text-base font-semibold py-3 rounded-lg shadow-md hover:shadow-lg hover:brightness-110 transition-all duration-300" 
                  disabled={authLoading || isSubmitting}
                >
                  {(authLoading || isSubmitting) ? 'Entrando...' : <><LogIn className="mr-2 h-5 w-5" /> Entrar</>}
                </Button>
                <div className="text-center text-sm">
                  <button
                    type="button"
                    onClick={() => setIsRequestResetModalOpen(true)}
                    className="font-medium text-primary dark:text-secondary hover:underline"
                    disabled={authLoading || isSubmitting}
                  >
                    Esqueceu sua senha?
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
          <footer className="mt-10 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} OKR Planner. Todos os direitos reservados.</p>
          </footer>
        </motion.div>
      </div>
      <RequestPasswordResetModal
        isOpen={isRequestResetModalOpen}
        onOpenChange={setIsRequestResetModalOpen}
      />
    </>
  );
};

export default LoginPage;
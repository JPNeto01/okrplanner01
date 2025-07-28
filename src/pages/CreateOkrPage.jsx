import React, { useState, useEffect, useCallback } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft } from 'lucide-react';
import ObjectiveDetailsForm from '@/components/create-okr/OkrDetailsForm';

const CreateObjectivePage = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [objectiveTitle, setObjectiveTitle] = useState('');
  const [objectiveResponsible, setObjectiveResponsible] = useState('');
  const [objectiveCoordinatorScrumMaster, setObjectiveCoordinatorScrumMaster] = useState('_none_');
  const [objectiveStatus, setObjectiveStatus] = useState('A Fazer'); // Default status
  const [objectiveDueDate, setObjectiveDueDate] = useState('');
  const [objectiveDescription, setObjectiveDescription] = useState(''); // Added description state
  
  const [productOwners, setProductOwners] = useState([]);
  const [scrumMasters, setScrumMasters] = useState([]);
  const [currentUserCompany, setCurrentUserCompany] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(true); 

  const loadPageData = useCallback(async () => {
    if (authLoading) {
      setIsLoadingData(true);
      return;
    }
    if (!currentUser) {
      setIsLoadingData(false);
      navigate('/login');
      return;
    }
    setIsLoadingData(true);
    try {
      const { data: allAppUsers, error: usersError } = await supabase
        .from('profiles')
        .select('id, name, email, user_group, company');

      if (usersError) {
        throw usersError;
      }
      
      const companyOfCurrentUser = currentUser.company || '';
      setCurrentUserCompany(companyOfCurrentUser || 'Empresa Padrão');

      const poUsers = allAppUsers.filter(user => 
        (user.user_group === 'product_owner' || user.user_group === 'admin') && 
        (user.company === companyOfCurrentUser)
      );
      
      const smUsers = allAppUsers.filter(user => 
        (user.user_group === 'scrum_master' || user.user_group === 'admin' || user.user_group === 'product_owner') && 
        (user.company === companyOfCurrentUser)
      );

      setProductOwners(poUsers);
      setScrumMasters(smUsers);
      
      if (currentUser.group === 'product_owner' || currentUser.group === 'admin') {
        if (poUsers.some(po => po.id === currentUser.id)) {
          setObjectiveResponsible(currentUser.id);
        } else {
           setObjectiveResponsible('');
        }
      } else {
        setObjectiveResponsible('');
      }

    } catch (error) {
        console.error("Error loading create objective page data:", error);
        toast({ title: "Erro ao Carregar Dados", description: `Não foi possível carregar os dados: ${error.message}`, variant: "destructive" });
    } finally {
      setIsLoadingData(false);
    }
  }, [authLoading, currentUser, navigate, toast]);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!objectiveTitle || !objectiveResponsible || !objectiveDueDate) {
      toast({ title: "Erro", description: "Título do Objetivo, Responsável (PO) e Prazo Final são obrigatórios.", variant: "destructive" });
      return;
    }

    const objectiveDataToInsert = {
      title: objectiveTitle,
      description: objectiveDescription, // Added description
      responsible_id: objectiveResponsible,
      coordinator_scrum_master_id: objectiveCoordinatorScrumMaster === '_none_' ? null : objectiveCoordinatorScrumMaster,
      status: objectiveStatus,
      due_date: objectiveDueDate,
      company: currentUser.company || null, 
      created_by_id: currentUser.id,
    };

    try {
      const { data: newObjective, error: insertError } = await supabase
        .from('objectives')
        .insert(objectiveDataToInsert)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }
      
      toast({ title: "Sucesso!", description: `Objetivo "${newObjective.title}" criado com sucesso.`, variant: "default" });
      navigate('/dashboard');

    } catch (error) {
      console.error("Error creating objective:", error);
      toast({ title: "Erro ao Criar Objetivo", description: error.message, variant: "destructive" });
    }
  };

  if (authLoading || isLoadingData) { 
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 text-white"><p>Carregando...</p></div>;
  }

  if (!currentUser || (currentUser.group !== 'product_owner' && currentUser.group !== 'admin')) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 p-4 md:p-8">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-8 pb-4 border-b border-slate-300 dark:border-slate-700">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center">
          <Button variant="outline" size="icon" asChild className="mr-4">
            <Link to="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              Criar Novo Objetivo
            </h1>
            <p className="text-muted-foreground">Defina o objetivo principal para sua equipe.</p>
          </div>
        </motion.div>
      </header>

      <motion.form 
        onSubmit={handleSubmit} 
        className="max-w-xl mx-auto space-y-6"
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.1 }}
      >
        <ObjectiveDetailsForm
          objectiveTitle={objectiveTitle} setObjectiveTitle={setObjectiveTitle}
          objectiveDescription={objectiveDescription} setObjectiveDescription={setObjectiveDescription} // Pass description
          objectiveResponsible={objectiveResponsible} setObjectiveResponsible={setObjectiveResponsible}
          objectiveCoordinatorScrumMaster={objectiveCoordinatorScrumMaster} setObjectiveCoordinatorScrumMaster={setObjectiveCoordinatorScrumMaster}
          objectiveStatus={objectiveStatus} setObjectiveStatus={setObjectiveStatus}
          objectiveDueDate={objectiveDueDate} setObjectiveDueDate={setObjectiveDueDate}
          productOwners={productOwners} 
          scrumMasters={scrumMasters}
          currentUserCompany={currentUserCompany}
        />
        
        <Button type="submit" className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg py-3 mt-8">
          Criar Objetivo
        </Button>
      </motion.form>

      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} OKR Manager. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default CreateObjectivePage;
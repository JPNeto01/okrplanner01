import React, { useState, useEffect, useCallback } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Users, UserPlus, ArrowLeft, Trash2 } from 'lucide-react';
import UserRegistrationForm from '@/pages/admin/UserRegistrationForm';
import UserList from '@/pages/admin/UserList';
import PasswordChangeModal from '@/pages/admin/PasswordChangeModal';
import UserEditModal from '@/pages/admin/UserEditModal';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const AdminPage = () => {
  const { currentUser, registerUser, getAllUsers, updateUserPassword, updateUser, deleteUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [userListState, setUserListState] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true); 

  const [selectedUserForPasswordChange, setSelectedUserForPasswordChange] = useState(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);

  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleteUserAlertOpen, setIsDeleteUserAlertOpen] = useState(false);

  const fetchUsers = useCallback(async () => {
    if (currentUser?.group === 'admin') {
      setIsLoadingUsers(true);
      const users = await getAllUsers();
      setUserListState(users);
      setIsLoadingUsers(false);
    }
  }, [currentUser, getAllUsers]);

  useEffect(() => {
    if (!authLoading) { 
        fetchUsers();
    }
  }, [authLoading, fetchUsers]);

  const refreshUserList = () => {
    fetchUsers();
  };

  const handleOpenEditUserModal = (user) => {
    setSelectedUserForEdit(user);
    setIsEditUserModalOpen(true);
  };

  const handleOpenPasswordModal = (user) => {
    setSelectedUserForPasswordChange(user);
    setIsPasswordModalOpen(true);
  };

  const handleOpenDeleteUserAlert = (user) => {
    if (currentUser && currentUser.id === user.id) {
      toast({ title: "Ação Inválida", description: "Você não pode excluir sua própria conta.", variant: "destructive" });
      return;
    }
    setUserToDelete(user);
    setIsDeleteUserAlertOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (userToDelete) {
      const success = await deleteUser(userToDelete.id);
      if (success) {
        refreshUserList();
      }
      setUserToDelete(null);
      setIsDeleteUserAlertOpen(false);
    }
  };


  if (authLoading) { 
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 text-white"><p>Carregando autenticação...</p></div>;
  }

  if (!currentUser) { 
    return <Navigate to="/login" replace />;
  }
  
  if (currentUser.group !== 'admin') { 
    return <Navigate to="/dashboard" replace />;
  }

  if (isLoadingUsers) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 text-white"><p>Carregando usuários...</p></div>;
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 p-4 md:p-8">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-8 pb-4 border-b border-slate-300 dark:border-slate-700">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center">
           <Button variant="outline" size="icon" asChild className="mr-4">
            <Link to="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              Painel do Administrador
            </h1>
            <p className="text-muted-foreground">Gerenciamento de usuários e permissões.</p>
          </div>
        </motion.div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center text-primary dark:text-primary-foreground">
                <UserPlus className="mr-3 h-7 w-7" /> Cadastrar Novo Usuário
              </CardTitle>
              <CardDescription>
                Crie contas para novos membros da equipe.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserRegistrationForm 
                registerUser={registerUser} 
                onUserRegistered={refreshUserList} 
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <UserList 
            users={userListState} 
            onEditUser={handleOpenEditUserModal} 
            onChangePassword={handleOpenPasswordModal} 
            onDeleteUser={handleOpenDeleteUserAlert}
            currentAdminId={currentUser.id}
          />
        </motion.div>
      </div>

      {selectedUserForPasswordChange && (
        <PasswordChangeModal
          isOpen={isPasswordModalOpen}
          setIsOpen={setIsPasswordModalOpen}
          user={selectedUserForPasswordChange}
          updateUserPassword={updateUserPassword}
          onPasswordChanged={refreshUserList}
        />
      )}
      
      {selectedUserForEdit && (
        <UserEditModal
          isOpen={isEditUserModalOpen}
          setIsOpen={setIsEditUserModalOpen}
          user={selectedUserForEdit}
          updateUser={updateUser}
          onUserUpdated={() => {
            refreshUserList();
            setSelectedUserForEdit(null); 
          }}
        />
      )}

      {userToDelete && (
        <AlertDialog open={isDeleteUserAlertOpen} onOpenChange={setIsDeleteUserAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão de Usuário</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o usuário "{userToDelete.name}" ({userToDelete.email})? Esta ação não pode ser desfeita.
                Tarefas e OKRs atribuídos a este usuário podem precisar de reatribuição manual.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteUser} className="bg-red-600 hover:bg-red-700">
                <Trash2 className="mr-2 h-4 w-4" /> Excluir Usuário
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} OKR Manager Admin. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default AdminPage;
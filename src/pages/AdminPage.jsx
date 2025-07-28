import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Users, UserPlus, ArrowLeft, ShieldCheck, Briefcase, UserCog, KeyRound, Image as ImageIcon, Building, Users2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from '@/components/ui/use-toast';

const AdminPageOld = () => { // Renomeado para AdminPageOld para diferenciar do componente refatorado
  const { currentUser, registerUser, getAllUsers, updateUserPassword, updateUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [group, setGroup] = useState('team_member');
  const [company, setCompany] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const avatarInputRef = useRef(null);

  const [userList, setUserList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedUserForPasswordChange, setSelectedUserForPasswordChange] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editGroup, setEditGroup] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editAvatarFile, setEditAvatarFile] = useState(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState('');
  const editAvatarInputRef = useRef(null);

  const fetchUsers = useCallback(async () => {
    if (currentUser?.group === 'admin') {
      setIsLoading(true);
      const users = await getAllUsers();
      setUserList(users);
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [currentUser, getAllUsers]);

  useEffect(() => {
    if (!authLoading) {
      fetchUsers();
    }
  }, [authLoading, fetchUsers]);

  const refreshUserList = useCallback(async () => {
    const users = await getAllUsers();
    setUserList(users);
  }, [getAllUsers]);


  const handleAvatarChange = (e, isEditMode = false) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEditMode) {
          setEditAvatarFile(file); // store file if needed for upload
          setEditAvatarPreview(reader.result); // store data URL for preview
        } else {
          setAvatarFile(file);
          setAvatarPreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const avatarUrlToSave = avatarPreview || `https://i.pravatar.cc/150?u=${email}`;
    const success = await registerUser({ email, password, name, group, avatar: avatarUrlToSave, company });
    if (success) {
      setEmail('');
      setPassword('');
      setName('');
      setGroup('team_member');
      setCompany('');
      setAvatarFile(null);
      setAvatarPreview('');
      if (avatarInputRef.current) avatarInputRef.current.value = "";
      await refreshUserList();
    }
  };
  
  const handleOpenEditUserModal = (user) => {
    setSelectedUserForEdit(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditGroup(user.user_group); // user.user_group based on profile structure
    setEditCompany(user.company || '');
    setEditAvatarPreview(user.avatar_url || ''); // user.avatar_url based on profile structure
    setEditAvatarFile(null);
    if (editAvatarInputRef.current) editAvatarInputRef.current.value = "";
    setIsEditUserModalOpen(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!selectedUserForEdit) return;

    const updatedData = {
      name: editName,
      // email: editEmail, // Supabase user email is updated via auth.updateUser, not profiles table directly
      group: editGroup, // This will be 'user_group' in the database call
      company: editCompany,
      avatar: editAvatarPreview || selectedUserForEdit.avatar_url, // This will be 'avatar_url'
    };
    
    const success = await updateUser(selectedUserForEdit.id, updatedData);
    if (success) {
      await refreshUserList();
      setIsEditUserModalOpen(false);
      setSelectedUserForEdit(null);
      toast({ title: "Sucesso", description: "Dados do usuário atualizados." });
    } else {
      toast({ title: "Erro", description: "Não foi possível atualizar o usuário.", variant: "destructive" });
    }
  };


  const handleOpenPasswordModal = (user) => {
    setSelectedUserForPasswordChange(user);
    setNewPassword('');
    setIsPasswordModalOpen(true);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (selectedUserForPasswordChange && newPassword) {
      const success = await updateUserPassword(selectedUserForPasswordChange.id, newPassword);
      if (success) {
        await refreshUserList();
        setIsPasswordModalOpen(false);
        setSelectedUserForPasswordChange(null);
      }
    }
  };

  if (isLoading || authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 text-white"><p>Carregando...</p></div>;
  }

  if (!currentUser || currentUser.group !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const getGroupIcon = (userGroup) => {
    switch (userGroup) {
      case 'admin':
        return <ShieldCheck className="h-5 w-5 text-red-500 mr-2" />;
      case 'product_owner':
        return <Briefcase className="h-5 w-5 text-blue-500 mr-2" />;
      case 'scrum_master':
        return <Users2 className="h-5 w-5 text-purple-500 mr-2" />;
      case 'team_member':
        return <UserCog className="h-5 w-5 text-green-500 mr-2" />;
      default:
        return null;
    }
  };
  
  const groupOptions = [
    { value: 'team_member', label: 'Membro da Equipe' },
    { value: 'scrum_master', label: 'Scrum Master' },
    { value: 'product_owner', label: 'Product Owner' },
    { value: 'admin', label: 'Administrador' },
  ];

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
              Painel do Administrador (Antigo)
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
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <Label htmlFor="admin-name">Nome Completo</Label>
                  <Input id="admin-name" type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Ex: João Silva" />
                </div>
                <div>
                  <Label htmlFor="admin-email">E-mail</Label>
                  <Input id="admin-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Ex: joao.silva@empresa.com" />
                </div>
                <div>
                  <Label htmlFor="admin-password">Senha Inicial</Label>
                  <Input id="admin-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Mínimo 8 caracteres" />
                </div>
                <div>
                  <Label htmlFor="admin-company">Empresa</Label>
                  <div className="flex items-center space-x-2">
                    <Building className="h-5 w-5 text-muted-foreground" />
                    <Input id="admin-company" type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="Nome da Empresa" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="admin-avatar-file">Foto de Perfil</Label>
                  <div className="flex items-center space-x-2">
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    <Input id="admin-avatar-file" type="file" accept="image/*" onChange={handleAvatarChange} ref={avatarInputRef} className="file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/>
                  </div>
                  {avatarPreview && <img-replace src={avatarPreview} alt="Prévia do Avatar" className="mt-2 w-20 h-20 rounded-full object-cover border" />}
                  <p className="text-xs text-muted-foreground mt-1">A imagem é convertida para Data URL.</p>
                </div>
                <div>
                  <Label htmlFor="admin-group">Grupo de Acesso</Label>
                  <select
                    id="admin-group"
                    value={group}
                    onChange={e => setGroup(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    {groupOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg py-3">
                  Cadastrar Usuário
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center text-primary dark:text-primary-foreground">
                <Users className="mr-3 h-7 w-7" /> Usuários Cadastrados
              </CardTitle>
              <CardDescription>
                Lista de todos os usuários no sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userList.length > 0 ? (
                <ul className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {userList.map(user => (
                    <li key={user.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md shadow-sm">
                      <div className="flex items-center">
                        <img 
                          className="w-10 h-10 rounded-full mr-3 border-2 border-primary object-cover"
                          alt={user.name}
                          src={user.avatar_url || `https://i.pravatar.cc/150?u=${user.email}`} />
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-gray-200">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                          {user.company && <p className="text-xs text-muted-foreground flex items-center"><Building className="h-3 w-3 mr-1"/> {user.company}</p>}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mr-2" title={(user.user_group || '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}>
                            {getGroupIcon(user.user_group)}
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEditUserModal(user)} title="Editar Usuário">
                            <UserCog className="h-5 w-5 text-blue-600 hover:text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenPasswordModal(user)} title="Alterar Senha">
                            <KeyRound className="h-5 w-5 text-yellow-600 hover:text-yellow-500" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">Nenhum usuário cadastrado ainda.</p>
              )}
            </CardContent>
            <CardFooter>
                <p className="text-xs text-muted-foreground">Total de usuários: {userList.length}</p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>

      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle className="text-primary dark:text-primary-foreground">Alterar Senha para {selectedUserForPasswordChange?.name}</DialogTitle>
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
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsPasswordModalOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90">Salvar Nova Senha</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEditUserModalOpen} onOpenChange={setIsEditUserModalOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle className="text-primary dark:text-primary-foreground">Editar Usuário: {selectedUserForEdit?.name}</DialogTitle>
            <DialogDescription>
              Atualize os dados do usuário.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
            <div>
              <Label htmlFor="edit-admin-name">Nome Completo</Label>
              <Input id="edit-admin-name" type="text" value={editName} onChange={e => setEditName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="edit-admin-email">E-mail (não editável aqui)</Label>
              <Input id="edit-admin-email" type="email" value={editEmail} readOnly disabled />
            </div>
            <div>
              <Label htmlFor="edit-admin-company">Empresa</Label>
              <Input id="edit-admin-company" type="text" value={editCompany} onChange={e => setEditCompany(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="edit-admin-avatar-file">Foto de Perfil</Label>
              <Input id="edit-admin-avatar-file" type="file" accept="image/*" onChange={(e) => handleAvatarChange(e, true)} ref={editAvatarInputRef} className="file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/>
              {editAvatarPreview && <img-replace src={editAvatarPreview} alt="Prévia do Avatar" className="mt-2 w-20 h-20 rounded-full object-cover border" />}
            </div>
            <div>
              <Label htmlFor="edit-admin-group">Grupo de Acesso</Label>
              <select id="edit-admin-group" value={editGroup} onChange={e => setEditGroup(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {groupOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditUserModalOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90">Salvar Alterações</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>


      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} OKR Manager Admin. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default AdminPageOld;
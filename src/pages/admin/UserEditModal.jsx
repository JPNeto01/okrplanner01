import React, { useState, useEffect, useRef } from 'react';
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
import { FileImage as ImageIcon, Building, Users, Mail } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const groupOptions = [
  { value: 'team_member', label: 'Membro da Equipe' },
  { value: 'scrum_master', label: 'Scrum Master' },
  { value: 'product_owner', label: 'Product Owner' },
  { value: 'inventory_user', label: 'Inventário' },
  { value: 'admin', label: 'Administrador' },
];

const UserEditModal = ({ isOpen, setIsOpen, user, updateUser, onUserUpdated }) => {
  const { toast } = useToast();
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editGroup, setEditGroup] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editAvatarFile, setEditAvatarFile] = useState(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState('');
  const [wantsToRemoveAvatar, setWantsToRemoveAvatar] = useState(false);
  const editAvatarInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditEmail(user.email || '');
      setEditGroup(user.user_group || user.group || 'team_member');
      setEditCompany(user.company || '');
      setEditAvatarPreview(user.avatar_url || '');
      setEditAvatarFile(null);
      setWantsToRemoveAvatar(false);
      if (editAvatarInputRef.current) editAvatarInputRef.current.value = "";
    }
  }, [user, isOpen]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { 
        toast({ title: "Erro", description: "A imagem deve ter no máximo 2MB.", variant: "destructive" });
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
        toast({ title: "Erro", description: "Formato de imagem inválido. Use JPG, PNG ou GIF.", variant: "destructive" });
        return;
      }
      setEditAvatarFile(file);
      setEditAvatarPreview(URL.createObjectURL(file));
      setWantsToRemoveAvatar(false);
    }
  };

  const handleRemoveAvatar = () => {
    setEditAvatarFile(null);
    setEditAvatarPreview('');
    setWantsToRemoveAvatar(true);
    if (editAvatarInputRef.current) {
      editAvatarInputRef.current.value = "";
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!user) return;

    const updatedData = {
      name: editName.trim(),
      group: editGroup,
      company: editCompany,
      avatar_url: user.avatar_url,
    };
    
    const success = await updateUser(user.id, updatedData, editAvatarFile, wantsToRemoveAvatar);
    
    if (success) {
      onUserUpdated();
      setIsOpen(false);
      toast({ title: "Sucesso", description: "Dados do usuário atualizados." });
    }
  };
  
  const getInitials = (nameStr) => {
    if (!nameStr) return '?';
    const names = nameStr.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-800">
        <DialogHeader>
          <DialogTitle className="text-primary dark:text-primary-foreground">Editar Usuário: {user?.name}</DialogTitle>
          <DialogDescription>
            Atualize os dados do usuário. O e-mail não pode ser alterado aqui.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleUpdateUser} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
          
          <div className="flex flex-col items-center space-y-2">
            <Avatar className="h-24 w-24 border-2 border-primary/30">
              <AvatarImage src={editAvatarPreview && !editAvatarPreview.includes('pravatar.cc') ? editAvatarPreview : undefined} alt={editName} />
              <AvatarFallback className="text-2xl bg-slate-200 dark:bg-slate-700">
                {getInitials(editName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex space-x-2">
              <Button type="button" variant="outline" size="sm" onClick={() => editAvatarInputRef.current?.click()}>
                <ImageIcon className="mr-1 h-4 w-4" /> Alterar Foto
              </Button>
              {(editAvatarPreview || (user?.avatar_url && !user.avatar_url.includes('pravatar.cc'))) && (
                <Button type="button" variant="destructiveOutline" size="sm" onClick={handleRemoveAvatar}>
                  Remover Foto
                </Button>
              )}
            </div>
            <Input id="edit-admin-avatar-file" type="file" accept="image/*" onChange={handleAvatarChange} ref={editAvatarInputRef} className="hidden"/>
          </div>

          <div>
            <Label htmlFor="edit-admin-name">Nome Completo</Label>
            <Input id="edit-admin-name" type="text" value={editName} onChange={e => setEditName(e.target.value)} required 
                   className="bg-slate-50 dark:bg-slate-700"/>
          </div>
          <div>
            <Label htmlFor="edit-admin-email">E-mail (não editável)</Label>
            <div className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <Input id="edit-admin-email" type="email" value={editEmail} readOnly disabled 
                       className="bg-slate-200 dark:bg-slate-600 cursor-not-allowed"/>
            </div>
          </div>
          <div>
            <Label htmlFor="edit-admin-company">Empresa</Label>
            <div className="flex items-center space-x-2">
                <Building className="h-5 w-5 text-muted-foreground" />
                <Input id="edit-admin-company" type="text" value={editCompany} onChange={e => setEditCompany(e.target.value)} 
                       className="bg-slate-50 dark:bg-slate-700"/>
            </div>
          </div>
          <div>
            <Label htmlFor="edit-admin-group">Grupo de Acesso</Label>
            <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <select id="edit-admin-group" value={editGroup} onChange={e => setEditGroup(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:bg-slate-700 dark:border-slate-600"
                >
                  {groupOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">Salvar Alterações</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserEditModal;
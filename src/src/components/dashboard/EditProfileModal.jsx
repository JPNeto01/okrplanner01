import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCircle, ImagePlus, Save, X, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const EditProfileModal = ({ isOpen, onClose, currentUser, onSave }) => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [wantsToRemoveAvatar, setWantsToRemoveAvatar] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setAvatarPreview(currentUser.avatar_url || '');
    }
    setAvatarFile(null); 
    setWantsToRemoveAvatar(false);
  }, [currentUser, isOpen]);

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
      setAvatarFile(file); 
      setAvatarPreview(URL.createObjectURL(file)); 
      setWantsToRemoveAvatar(false); 
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null); 
    setAvatarPreview(''); 
    setWantsToRemoveAvatar(true); 
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; 
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Erro", description: "O nome não pode estar vazio.", variant: "destructive" });
      return;
    }
    
    const updatedData = {
      name: name.trim(),
      // A lógica de remoção/atualização da URL é tratada no AuthContext
      // com base na presença de `avatarFile` ou `wantsToRemoveAvatar`.
    };
    
    // Passa os dados e o arquivo (ou a intenção de remover) para a função onSave
    onSave(updatedData, avatarFile, wantsToRemoveAvatar);
  };

  const getInitials = (nameStr) => {
    if (!nameStr) return '?';
    const names = nameStr.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
  };

  if (!isOpen || !currentUser) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[480px] bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center text-primary dark:text-primary-foreground">
            <UserCircle className="mr-2 h-7 w-7" /> Editar Perfil
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Atualize seu nome e foto de perfil.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4 px-1">
            <div className="flex flex-col items-center space-y-3">
              <Avatar className="h-28 w-28 border-2 border-primary/50">
                <AvatarImage src={avatarPreview} alt={name} />
                <AvatarFallback className="text-3xl bg-slate-200 dark:bg-slate-700">
                  {getInitials(name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex space-x-2">
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <ImagePlus className="mr-2 h-4 w-4" /> Alterar Foto
                </Button>
                {avatarPreview && (
                  <Button type="button" variant="destructiveOutline" size="sm" onClick={handleRemoveAvatar} title="Remover foto atual">
                    <Trash2 className="mr-2 h-4 w-4" /> Remover Foto
                  </Button>
                )}
              </div>
              <Input 
                id="avatar-upload"
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="image/png, image/jpeg, image/gif"
                onChange={handleAvatarChange} 
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-base">Nome</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="text-base py-2.5 bg-slate-50 dark:bg-slate-800 focus:ring-primary"
                placeholder="Seu nome completo"
                required
              />
            </div>
          </div>
          <DialogFooter className="pt-6 border-t border-slate-200 dark:border-slate-700 mt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                <X className="h-4 w-4 mr-1.5"/> Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white">
              <Save className="h-4 w-4 mr-2" /> Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileModal;
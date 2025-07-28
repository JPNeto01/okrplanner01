
import { supabase } from '@/lib/supabaseClient';

export const fetchUserProfile = async (user, setCurrentUser, setLoading, toast) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, name, email, user_group, avatar_url, company')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    if (profile) {
      setCurrentUser({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        group: profile.user_group,
        avatar_url: profile.avatar_url,
        company: profile.company
      });
    }
  } catch (error) {
    console.error('Erro ao buscar perfil:', error.message);
    toast({
      title: 'Erro de Perfil',
      description: 'Não foi possível carregar as informações do seu perfil.',
      variant: 'destructive',
    });
  } finally {
    setLoading(false);
  }
};

export const loginUser = async (email, password, toast) => {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error("Erro no login:", error);
    toast({
      title: 'Erro de Login',
      description: 'Credenciais inválidas. Verifique seu e-mail e senha.',
      variant: 'destructive',
    });
    return false;
  }
  return true;
};

export const logoutUser = async (setLoading, setCurrentUser, toast, supabase) => {
  setLoading(true);
  const { error } = await supabase.auth.signOut();
  
  // Ignora o erro "session not found" que pode ocorrer se a sessão já estiver inválida.
  // O resultado final é o mesmo: o usuário está deslogado.
  if (error && error.message !== 'Session from session_id claim in JWT does not exist') {
    console.error('Erro no logout:', error);
    toast({
      title: 'Erro de Logout',
      description: 'Ocorreu um erro ao tentar sair. Por favor, tente novamente.',
      variant: 'destructive',
    });
  } else {
    setCurrentUser(null);
  }
  setLoading(false);
};

export const registerNewUser = async (userData, setLoading, toast, supabase) => {
  setLoading(true);
  const { email, password, name, group, company } = userData;

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        user_group: group,
        avatar_url: `https://avatar.vercel.sh/${email}.png`,
        company
      },
    },
  });

  if (authError) {
    console.error('Erro no cadastro:', authError);
    toast({
      title: 'Erro de Cadastro',
      description: authError.message,
      variant: 'destructive',
    });
    setLoading(false);
    return false;
  }
  
  setLoading(false);
  toast({
    title: 'Cadastro Realizado!',
    description: 'Usuário cadastrado com sucesso. Um e-mail de confirmação foi enviado.',
    variant: 'success',
  });
  return true;
};

export const updateUserPassword = async (userId, newPassword, currentUser, setLoading, toast, supabase) => {
  setLoading(true);
  if (currentUser?.group === 'admin') {
    const { data, error } = await supabase.functions.invoke('admin-update-user-password', {
      body: { userId, newPassword },
    });
    setLoading(false);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      return false;
    }
    toast({ title: 'Sucesso', description: 'Senha atualizada com sucesso.' });
    return true;
  }
  
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  setLoading(false);
  if (error) {
    toast({ title: 'Erro ao Alterar Senha', description: error.message, variant: 'destructive' });
    return false;
  }
  toast({ title: 'Sucesso', description: 'Sua senha foi alterada com sucesso.' });
  return true;
};

export const updateUserProfile = async (userId, updatedData, newAvatarFile, wantsToRemoveAvatar, currentUser, toast, supabase) => {
  try {
    let avatarUrl = updatedData.avatar_url;
    
    if (newAvatarFile) {
      const filePath = `${userId}/${Date.now()}_${newAvatarFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, newAvatarFile);

      if (uploadError) throw new Error(`Erro no upload da imagem: ${uploadError.message}`);

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      avatarUrl = publicUrlData.publicUrl;

    } else if (wantsToRemoveAvatar) {
      avatarUrl = null; 
    }

    const dataToUpdate = {
      name: updatedData.name,
      company: updatedData.company,
      user_group: updatedData.group,
      updated_at: new Date().toISOString(),
    };

    if (avatarUrl !== updatedData.avatar_url || wantsToRemoveAvatar) {
      dataToUpdate.avatar_url = avatarUrl;
    }

    const { error } = await supabase
      .from('profiles')
      .update(dataToUpdate)
      .eq('id', userId);

    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    toast({
      title: 'Erro de Atualização',
      description: `Não foi possível atualizar o perfil: ${error.message}`,
      variant: 'destructive',
    });
    return false;
  }
};

export const deleteUserAccount = async (userIdToDelete, currentUser, setLoading, toast, supabase) => {
  if (currentUser?.group !== 'admin') {
    toast({ title: "Acesso Negado", description: "Você não tem permissão para deletar usuários.", variant: "destructive" });
    return false;
  }
  setLoading(true);
  const { error } = await supabase.auth.admin.deleteUser(userIdToDelete);
  setLoading(false);
  if (error) {
    toast({ title: "Erro ao Deletar", description: error.message, variant: "destructive" });
    return false;
  }
  toast({ title: "Sucesso", description: "Usuário deletado com sucesso." });
  return true;
};

export const fetchAllUsers = async (toast, supabase) => {
  try {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) throw error;
    return data;
  } catch (error) {
    toast({
      title: 'Erro ao Carregar Usuários',
      description: error.message,
      variant: 'destructive'
    });
    return [];
  }
};


export const requestPasswordReset = async (email, toast) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) {
    toast({
      title: "Erro",
      description: error.message,
      variant: "destructive",
    });
    return false;
  }

  toast({
    title: "E-mail Enviado!",
    description: "Verifique sua caixa de entrada para o link de redefinição de senha.",
    variant: "success",
  });
  return true;
};

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { 
  fetchUserProfile as fetchUserProfileUtil,
  loginUser as loginUserUtil,
  logoutUser as logoutUserUtil,
  registerNewUser as registerNewUserUtil,
  updateUserPassword as updateUserPasswordUtil,
  updateUserProfile as updateUserProfileUtil,
  deleteUserAccount as deleteUserAccountUtil,
  fetchAllUsers as fetchAllUsersUtil,
  requestPasswordReset as requestPasswordResetUtil
} from '@/contexts/authActions';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [supabaseUser, setSupabaseUser] = useState(undefined);
  const [currentUser, setCurrentUser] = useState(null);
  const [appLoading, setAppLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const { toast } = useToast();

  const handleFetchUserProfile = useCallback(async (user) => {
    setProfileLoading(true);
    await fetchUserProfileUtil(user, setCurrentUser, setProfileLoading, toast, supabase);
    setAppLoading(false); 
  }, [toast]);

  useEffect(() => {
    setAppLoading(true);
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const user = session?.user || null;
        setSupabaseUser(user);
        if (!user) {
          setCurrentUser(null);
          setAppLoading(false);
        }
      }
    );
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (supabaseUser === undefined) {
      return; 
    }
    if (supabaseUser) {
      handleFetchUserProfile(supabaseUser);
    } else {
      setCurrentUser(null);
      setAppLoading(false);
    }
  }, [supabaseUser, handleFetchUserProfile]);

  const login = async (email, password) => {
    return await loginUserUtil(email, password, toast);
  };

  const logout = async () => {
    await logoutUserUtil(setAppLoading, setCurrentUser, toast, supabase);
  };

  const registerUser = async (userData) => {
    return await registerNewUserUtil(userData, setAppLoading, toast, supabase);
  };
  
  const updateUserPassword = async (userId, newPassword) => {
    return await updateUserPasswordUtil(userId, newPassword, currentUser, setProfileLoading, toast, supabase);
  };
  
  const updateUser = async (userId, updatedData, newAvatarFile = null, wantsToRemoveAvatar = false) => {
    setProfileLoading(true);
    const success = await updateUserProfileUtil(
      userId, 
      updatedData, 
      newAvatarFile, 
      wantsToRemoveAvatar,
      currentUser, 
      toast, 
      supabase
    );
    if (success && supabaseUser && supabaseUser.id === userId) {
      await handleFetchUserProfile(supabaseUser); 
    } else {
      setProfileLoading(false);
    }
    return success;
  };

  const deleteUser = async (userIdToDelete) => {
    return await deleteUserAccountUtil(userIdToDelete, currentUser, setAppLoading, toast, supabase);
  };

  const getAllUsers = useCallback(async () => {
    return await fetchAllUsersUtil(toast, supabase);
  }, [toast]);

  const requestPasswordReset = async (email) => { 
    return await requestPasswordResetUtil(email, toast);
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      supabaseUser, 
      loading: appLoading, 
      profileLoading, 
      login, 
      logout, 
      registerUser, 
      getAllUsers, 
      updateUserPassword, 
      updateUser, 
      deleteUser,
      requestPasswordReset
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
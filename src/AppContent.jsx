import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';

const AppContent = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && currentUser) {
      if (currentUser.group === 'inventory_user' && !location.pathname.startsWith('/inventory')) {
        navigate('/inventory', { replace: true });
      }
    }
  }, [currentUser, loading, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center text-white">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg">Carregando aplicação...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
    </>
  );
};

export default AppContent;
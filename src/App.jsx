import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import AdminPage from '@/pages/admin/AdminPage';
import CreateObjectivePage from '@/pages/CreateOkrPage';
import ObjectiveDetailPage from '@/pages/OkrDetailPage';
import CreateKrPage from '@/pages/CreateKrPage';
import MyTasksPage from '@/pages/MyTasksPage';
import BacklogPage from '@/pages/BacklogPage';
import AccountConfirmedPage from '@/pages/AccountConfirmedPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import BusinessIntelligencePage from '@/pages/BusinessIntelligencePage';
import InventoryPage from '@/pages/InventoryPage';
import InventoryDetailPage from '@/pages/InventoryDetailPage';
import InventoryCountPage from '@/pages/InventoryCountPage';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppContent from '@/AppContent';
import SideNav from '@/components/SideNav';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { cn } from '@/lib/utils';
import EditProfileModal from '@/components/dashboard/EditProfileModal';
import { useToast } from '@/components/ui/use-toast';

const AppLayout = ({ children }) => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  const [isNavExpanded, setIsNavExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isEditProfileModalOpen, setEditProfileModalOpen] = useState(false);

  const handleUserUpdate = async (updatedData, avatarFile, wantsToRemoveAvatar) => {
    if (!user) return;
    const success = await updateUser(user.id, updatedData, avatarFile, wantsToRemoveAvatar);
    if (success) {
      toast({
        title: "Perfil Atualizado!",
        description: "Suas informações foram salvas com sucesso.",
        variant: "success",
      });
      setEditProfileModalOpen(false);
    }
  };

  return (
    <>
      <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
        <SideNav
          isNavExpanded={isNavExpanded}
          onToggleExpand={() => setIsNavExpanded(prev => !prev)}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
        />
        <div className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out",
          isNavExpanded ? "lg:ml-64" : "lg:ml-20"
        )}>
          <DashboardHeader
            onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
            onOpenEditProfileModal={() => setEditProfileModalOpen(true)}
          />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>
      {isEditProfileModalOpen && (
        <EditProfileModal
          isOpen={isEditProfileModalOpen}
          onClose={() => setEditProfileModalOpen(false)}
          currentUser={user}
          onSave={handleUserUpdate}
        />
      )}
    </>
  );
};

const AppRoutes = () => (
  <Routes>
    {/* Public Routes */}
    <Route path="/login" element={<LoginPage />} />
    <Route path="/account-confirmed" element={<AccountConfirmedPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />

    {/* Protected Routes with Layout */}
    <Route element={<ProtectedRoute />}>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<AppLayout><DashboardPage /></AppLayout>} />
      <Route path="/objective/:objectiveId" element={<AppLayout><ObjectiveDetailPage /></AppLayout>} />
      <Route path="/objective/:objectiveId/create-kr" element={<ProtectedRoute allowedGroups={['scrum_master', 'product_owner', 'admin']}><AppLayout><CreateKrPage /></AppLayout></ProtectedRoute>} />
      <Route path="/my-tasks" element={<ProtectedRoute allowedGroups={['admin', 'product_owner', 'scrum_master', 'team_member']}><AppLayout><MyTasksPage /></AppLayout></ProtectedRoute>} />
      <Route path="/backlog" element={<ProtectedRoute allowedGroups={['admin', 'product_owner', 'scrum_master']}><AppLayout><BacklogPage /></AppLayout></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute allowedGroups={['admin', 'inventory_user']}><AppLayout><InventoryPage /></AppLayout></ProtectedRoute>} />
      <Route path="/inventory/:inventoryId" element={<ProtectedRoute allowedGroups={['admin']}><AppLayout><InventoryDetailPage /></AppLayout></ProtectedRoute>} />
      <Route path="/inventory/count/:assignmentId" element={<ProtectedRoute allowedGroups={['inventory_user']}><AppLayout><InventoryCountPage /></AppLayout></ProtectedRoute>} />
      <Route path="/bi" element={<ProtectedRoute allowedGroups={['admin', 'product_owner']}><AppLayout><BusinessIntelligencePage /></AppLayout></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute allowedGroups={['admin']}><AppLayout><AdminPage /></AppLayout></ProtectedRoute>} />
      <Route path="/create-objective" element={<ProtectedRoute allowedGroups={['product_owner', 'admin']}><AppLayout><CreateObjectivePage /></AppLayout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Route>
  </Routes>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent>
          <AppRoutes />
        </AppContent>
      </Router>
      <Toaster />
    </AuthProvider>
  );
}

export default App;

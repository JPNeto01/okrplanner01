
    import React from 'react';
    import { NavLink, useLocation } from 'react-router-dom';
    import { Home, Users, Briefcase, BarChart2, ListTodo, Archive, Warehouse, X, ChevronsLeft, ChevronsRight } from 'lucide-react';
    import { useAuth } from '@/contexts/AuthContext';
    import Logo from '@/components/Logo';
    import { cn } from '@/lib/utils';
    import { motion, AnimatePresence } from 'framer-motion';
    
    const SideNav = ({ isNavExpanded, onToggleExpand, isMobileOpen, onCloseMobileMenu }) => {
      const { currentUser } = useAuth();
      const location = useLocation();
    
      const allNavLinks = [
        { to: '/dashboard', icon: <Home className="h-5 w-5 flex-shrink-0" />, text: 'Dashboard', allowedGroups: ['admin', 'product_owner', 'scrum_master', 'team_member'] },
        { to: '/my-tasks', icon: <ListTodo className="h-5 w-5 flex-shrink-0" />, text: 'Minhas Tarefas', allowedGroups: ['admin', 'product_owner', 'scrum_master', 'team_member'] },
        { to: '/backlog', icon: <Archive className="h-5 w-5 flex-shrink-0" />, text: 'Backlog', allowedGroups: ['admin', 'product_owner', 'scrum_master'] },
        { to: '/inventory', icon: <Warehouse className="h-5 w-5 flex-shrink-0" />, text: 'Inventário', allowedGroups: ['admin', 'inventory_user'] },
        { to: '/bi', icon: <BarChart2 className="h-5 w-5 flex-shrink-0" />, text: 'Business Intelligence', allowedGroups: ['admin', 'product_owner'] },
        { to: '/admin', icon: <Users className="h-5 w-5 flex-shrink-0" />, text: 'Admin', allowedGroups: ['admin'] },
      ];
    
      const getVisibleLinks = () => {
        if (!currentUser?.group) return [];
        if (currentUser.group === 'inventory_user') {
          return allNavLinks.filter(link => link.allowedGroups.includes('inventory_user'));
        }
        return allNavLinks.filter(link => link.allowedGroups.includes(currentUser.group));
      };
    
      const visibleLinks = getVisibleLinks();
    
      const getLinkClass = (path) => {
        const isActive = location.pathname.startsWith(path);
        return cn(
          'flex items-center h-12 text-sm font-medium rounded-lg transition-colors duration-200 overflow-hidden',
          isNavExpanded ? 'px-4' : 'px-0 justify-center',
          isActive
            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
            : 'text-gray-400 hover:bg-slate-700/50 hover:text-white'
        );
      };
      
      const navContent = (
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-20 px-4 border-b border-slate-700">
            {isNavExpanded && <Logo />}
            <button onClick={onCloseMobileMenu} className="lg:hidden text-gray-400 hover:text-white">
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-2 py-6 space-y-2">
            {visibleLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className={getLinkClass(link.to)} title={isNavExpanded ? '' : link.text} onClick={onCloseMobileMenu}>
                {link.icon}
                <AnimatePresence>
                  {isNavExpanded && (
                    <motion.span 
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto', transition: { delay: 0.1, duration: 0.2 } }}
                      exit={{ opacity: 0, width: 0, transition: { duration: 0.1 } }}
                      className="ml-3 whitespace-nowrap"
                    >
                      {link.text}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            ))}
          </nav>
          <div className="px-2 py-4 mt-auto border-t border-slate-700">
            <button onClick={onToggleExpand} className={cn(
              'flex items-center h-12 w-full text-sm font-medium rounded-lg transition-colors duration-200 overflow-hidden text-gray-400 hover:bg-slate-700/50 hover:text-white',
              isNavExpanded ? 'px-4' : 'justify-center'
            )}>
              {isNavExpanded ? <ChevronsLeft className="h-5 w-5 flex-shrink-0" /> : <ChevronsRight className="h-5 w-5 flex-shrink-0" />}
              <AnimatePresence>
                {isNavExpanded && (
                  <motion.span 
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto', transition: { delay: 0.1, duration: 0.2 } }}
                    exit={{ opacity: 0, width: 0, transition: { duration: 0.1 } }}
                    className="ml-3 whitespace-nowrap"
                  >
                    Recolher
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      );
    
      return (
        <>
          {/* Mobile Menu */}
          <AnimatePresence>
            {isMobileOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                  onClick={onCloseMobileMenu}
                />
                <motion.aside
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="w-64 bg-slate-800 text-white flex flex-col h-screen fixed z-50 lg:hidden"
                >
                   {navContent}
                </motion.aside>
              </>
            )}
          </AnimatePresence>
    
          {/* Desktop Menu */}
          <aside className={cn(
            "bg-slate-800 text-white flex-col h-screen fixed hidden lg:flex transition-all duration-300 ease-in-out",
            isNavExpanded ? "w-64" : "w-20"
          )}>
             {navContent}
          </aside>
        </>
      );
    };
    
    export default SideNav;
  
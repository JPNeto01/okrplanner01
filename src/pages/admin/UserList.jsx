import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Users, ShieldCheck, Briefcase, UserCog, KeyRound, Building, Users2, UserCog2, Trash2, Warehouse } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const UserList = ({ users, onEditUser, onChangePassword, onDeleteUser, currentAdminId }) => {
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
      case 'inventory_user':
        return <Warehouse className="h-5 w-5 text-orange-500 mr-2" />;
      default:
        return null;
    }
  };

  const formatGroupTitle = (group) => {
    if (typeof group === 'string' && group.trim() !== '') {
      if (group === 'inventory_user') return 'Inventário';
      return group.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    return 'Grupo Não Definido';
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
  };

  return (
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
        {users.length > 0 ? (
          <ul className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {users.map(user => {
              const avatarSrc = user.avatar_url && 
                                !user.avatar_url.includes('pravatar.cc') &&
                                !user.avatar_url.includes('avatar.vercel.sh')
                                ? user.avatar_url 
                                : undefined;
              return (
                <li key={user.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md shadow-sm">
                  <div className="flex items-center">
                    <Avatar className="w-10 h-10 rounded-full mr-3 border-2 border-primary object-cover">
                      <AvatarImage src={avatarSrc} alt={user.name || 'Usuário sem nome'} />
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-200">{user.name || 'Nome não informado'}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      {user.company && <p className="text-xs text-muted-foreground flex items-center"><Building className="h-3 w-3 mr-1"/> {user.company}</p>}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mr-2" title={formatGroupTitle(user.user_group)}>
                        {getGroupIcon(user.user_group)}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => onEditUser(user)} title="Editar Usuário">
                        <UserCog2 className="h-5 w-5 text-blue-600 hover:text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onChangePassword(user)} title="Alterar Senha">
                        <KeyRound className="h-5 w-5 text-yellow-600 hover:text-yellow-500" />
                    </Button>
                    {user.id !== currentAdminId && (
                      <Button variant="ghost" size="icon" onClick={() => onDeleteUser(user)} title="Excluir Usuário">
                          <Trash2 className="h-5 w-5 text-red-600 hover:text-red-500" />
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-muted-foreground">Nenhum usuário cadastrado ainda.</p>
        )}
      </CardContent>
      <CardFooter>
          <p className="text-xs text-muted-foreground">Total de usuários: {users.length}</p>
      </CardFooter>
    </Card>
  );
};

export default UserList;
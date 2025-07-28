import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building } from 'lucide-react';

const groupOptions = [
  { value: 'team_member', label: 'Membro da Equipe' },
  { value: 'scrum_master', label: 'Scrum Master' },
  { value: 'product_owner', label: 'Product Owner' },
  { value: 'inventory_user', label: 'Inventário' },
  { value: 'admin', label: 'Administrador' },
];

const UserRegistrationForm = ({ registerUser, onUserRegistered }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [group, setGroup] = useState('team_member');
  const [company, setCompany] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    // A função registerUser no AuthContext agora define avatar_url como null por padrão.
    const success = await registerUser({ email, password, name, group, company });
    if (success) {
      setEmail('');
      setPassword('');
      setName('');
      setGroup('team_member');
      setCompany('');
      onUserRegistered();
    }
  };

  return (
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
  );
};

export default UserRegistrationForm;
// Dados simulados de usuários. Em uma aplicação real, isso viria de um backend.
// Senhas devem ser armazenadas como hashes. Para este exemplo, usamos texto plano.
// Grupos: 'admin', 'product_owner', 'team_member', 'scrum_master'

export const MOCK_USERS = [
  {
    id: 'user1',
    email: 'admin@okr.com',
    password: 'password123',
    name: 'Admin User',
    group: 'admin',
    avatar: 'https://i.pravatar.cc/150?u=admin@okr.com',
    company: 'GlobalCorp' 
  },
  {
    id: 'user2',
    email: 'po@okr.com',
    password: 'password123',
    name: 'Product Owner Alpha',
    group: 'product_owner',
    avatar: 'https://i.pravatar.cc/150?u=po@okr.com',
    company: 'Alpha Inc.'
  },
  {
    id: 'user3',
    email: 'dev1@okr.com',
    password: 'password123',
    name: 'Developer One Alpha',
    group: 'team_member',
    avatar: 'https://i.pravatar.cc/150?u=dev1@okr.com',
    company: 'Alpha Inc.'
  },
  {
    id: 'user4',
    email: 'dev2@okr.com',
    password: 'password123',
    name: 'Developer Two Beta',
    group: 'team_member',
    avatar: 'https://i.pravatar.cc/150?u=dev2@okr.com',
    company: 'Beta Solutions'
  },
  {
    id: 'user5',
    email: 'scrum@okr.com',
    password: 'password123',
    name: 'Scrum Master Alpha',
    group: 'scrum_master',
    avatar: 'https://i.pravatar.cc/150?u=scrum@okr.com',
    company: 'Alpha Inc.'
  },
  {
    id: 'user6',
    email: 'po.beta@okr.com',
    password: 'password123',
    name: 'Product Owner Beta',
    group: 'product_owner',
    avatar: 'https://i.pravatar.cc/150?u=po.beta@okr.com',
    company: 'Beta Solutions'
  },
  {
    id: 'user7',
    email: 'scrum.beta@okr.com',
    password: 'password123',
    name: 'Scrum Master Beta',
    group: 'scrum_master',
    avatar: 'https://i.pravatar.cc/150?u=scrum.beta@okr.com',
    company: 'Beta Solutions'
  }
];

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const nextWeek = new Date(today);
nextWeek.setDate(today.getDate() + 7);
const yesterday = new Date(today);
yesterday.setDate(today.getDate() -1);


export const MOCK_OKRS = [
  {
    id: 'okr1',
    title: 'Lançar novo App Mobile Alpha',
    responsible: 'user2', // Product Owner
    scrumMaster: 'user5', // Scrum Master Alpha
    status: 'Em Progresso',
    company: 'Alpha Inc.',
    tasks: [
      { id: 'task1.1', title: 'Definir escopo MVP', responsible: 'user2', status: 'Concluído', dueDate: yesterday.toISOString().split('T')[0] },
      { id: 'task1.2', title: 'Design UI/UX', responsible: 'user3', status: 'Em Progresso', dueDate: nextWeek.toISOString().split('T')[0] },
      { id: 'task1.3', title: 'Desenvolver backend API', responsible: 'user5', status: 'A Fazer', dueDate: nextWeek.toISOString().split('T')[0] },
      { id: 'task1.4', title: 'Desenvolver App iOS', responsible: 'user3', status: 'A Fazer', dueDate: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString().split('T')[0]},
      { id: 'task1.5', title: 'Desenvolver App Android', responsible: 'user3', status: 'A Fazer', dueDate: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString().split('T')[0] },
    ]
  },
  {
    id: 'okr2',
    title: 'Aumentar Engajamento Beta em 20%',
    responsible: 'user6', // Product Owner Beta
    scrumMaster: 'user7', // Scrum Master Beta
    status: 'A Fazer',
    company: 'Beta Solutions',
    tasks: [
      { id: 'task2.1', title: 'Pesquisa de satisfação Beta', responsible: 'user4', status: 'A Fazer', dueDate: tomorrow.toISOString().split('T')[0] },
      { id: 'task2.2', title: 'Implementar sistema de gamificação Beta', responsible: 'user4', status: 'A Fazer', dueDate: nextWeek.toISOString().split('T')[0] },
    ]
  },
  {
    id: 'okr3',
    title: 'Melhorar Performance do Site Alpha',
    responsible: 'user2', // Product Owner Alpha
    scrumMaster: 'user5', // Scrum Master Alpha
    status: 'Concluído',
    company: 'Alpha Inc.',
    tasks: [
      { id: 'task3.1', title: 'Otimizar imagens', responsible: 'user3', status: 'Concluído', dueDate: yesterday.toISOString().split('T')[0] },
      { id: 'task3.2', title: 'Minificar CSS/JS', responsible: 'user3', status: 'Concluído', dueDate: yesterday.toISOString().split('T')[0] },
      { id: 'task3.3', title: 'Implementar CDN', responsible: 'user5', status: 'Concluído', dueDate: yesterday.toISOString().split('T')[0] },
    ]
  },
  {
    id: 'okr4',
    title: 'Expandir para novo mercado (GlobalCorp)',
    responsible: 'user1', // Admin pode ser PO
    scrumMaster: 'user1', // Admin pode ser SM
    status: 'Em Progresso',
    company: 'GlobalCorp',
    tasks: [
      { id: 'task4.1', title: 'Análise de mercado internacional', responsible: 'user1', status: 'Em Progresso', dueDate: nextWeek.toISOString().split('T')[0] },
      { id: 'task4.2', title: 'Plano de marketing global', responsible: 'user1', status: 'A Fazer', dueDate: new Date(new Date().setDate(new Date().getDate() + 21)).toISOString().split('T')[0] },
    ]
  }
];
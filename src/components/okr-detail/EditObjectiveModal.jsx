import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabaseClient'; // Import supabase
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth

const EditObjectiveModal = ({ isOpen, onClose, objectiveData, onSave }) => {
  const { currentUser } = useAuth(); // Get currentUser
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [responsible, setResponsible] = useState('');
  const [coordinatorScrumMaster, setCoordinatorScrumMaster] = useState('');
  const [dueDate, setDueDate] = useState('');

  const [productOwners, setProductOwners] = useState([]);
  const [scrumMasters, setScrumMasters] = useState([]);

  useEffect(() => {
    if (objectiveData) {
      setTitle(objectiveData.title || '');
      setDescription(objectiveData.description || '');
      setResponsible(objectiveData.responsible || ''); // This should be responsible_id
      setCoordinatorScrumMaster(objectiveData.coordinatorScrumMaster || '_none_'); // This should be coordinator_scrum_master_id
      setDueDate(objectiveData.dueDate || '');
    }
  }, [objectiveData]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (currentUser) {
        const { data: allUsers, error } = await supabase
          .from('profiles')
          .select('id, name, user_group, company');
        
        if (error) {
          console.error("Error fetching users for edit objective modal:", error);
          return;
        }

        const companyOfCurrentUser = currentUser.company || '';
        const companyUsers = allUsers.filter(u => currentUser.group === 'admin' || u.company === companyOfCurrentUser);
        
        setProductOwners(companyUsers.filter(u => u.user_group === 'product_owner' || u.user_group === 'admin'));
        setScrumMasters(companyUsers.filter(u => u.user_group === 'scrum_master' || u.user_group === 'admin' || u.user_group === 'product_owner'));
      }
    };
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, currentUser]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      title,
      description,
      responsible, // This will be responsible_id
      coordinatorScrumMaster: coordinatorScrumMaster === '_none_' ? null : coordinatorScrumMaster, // This will be coordinator_scrum_master_id
      dueDate,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-white dark:bg-slate-900">
        <DialogHeader>
          <DialogTitle className="text-xl text-primary dark:text-primary-foreground">Editar Objetivo</DialogTitle>
          <DialogDescription>Modifique os detalhes do seu objetivo.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto p-1 pr-3">
            <div>
              <Label htmlFor="objTitleEdit">Título do Objetivo</Label>
              <Input id="objTitleEdit" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="objDescriptionEdit">Descrição</Label>
              <Textarea id="objDescriptionEdit" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="objResponsibleEdit">Product Owner (PO)</Label>
              <Select value={responsible} onValueChange={setResponsible} required>
                <SelectTrigger><SelectValue placeholder="Selecione o PO" /></SelectTrigger>
                <SelectContent>
                  {productOwners.map(user => (
                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="objCoordinatorSMEdit">Scrum Master Coordenador</Label>
              <Select value={coordinatorScrumMaster} onValueChange={setCoordinatorScrumMaster}>
                <SelectTrigger><SelectValue placeholder="Selecione o SM Coordenador (Opcional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none_">Nenhum</SelectItem>
                  {scrumMasters.map(user => (
                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="objDueDateEdit">Data de Conclusão</Label>
              <Input id="objDueDateEdit" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
            </div>
          </div>
          <DialogFooter className="border-t dark:border-slate-700 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-white">Salvar Alterações</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditObjectiveModal;
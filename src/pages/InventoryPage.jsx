import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import CreateInventoryModal from '@/components/inventory/CreateInventoryModal';
import InventoryList from '@/components/inventory/InventoryList';
import UserInventoryList from '@/components/inventory/UserInventoryList';

const InventoryPage = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [isCreateInventoryModalOpen, setCreateInventoryModalOpen] = useState(false);
  const [inventories, setInventories] = useState([]);
  const [userAssignments, setUserAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const fetchInventories = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      if (currentUser.group === 'admin') {
        const { data, error } = await supabase
          .from('inventories')
          .select(`*, profiles:created_by (name)`)
          .eq('company', currentUser.company)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setInventories(data);
      } else if (currentUser.group === 'inventory_user') {
        const { data, error } = await supabase
          .from('inventory_assignments')
          .select(`
            id,
            is_active,
            count_stage,
            inventories (id, name, status, created_at)
          `)
          .eq('user_id', currentUser.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false, foreignTable: 'inventories' });
        if (error) throw error;
        setUserAssignments(data);
      }
    } catch (error) {
      toast({ title: 'Erro ao buscar inventários', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, toast]);

  useEffect(() => {
    fetchInventories();
  }, [fetchInventories]);

  const handleCreateInventory = async (inventoryData) => {
    if (!currentUser) return;
    setIsCreating(true);
    try {
      const { data: newInventory, error: inventoryError } = await supabase
        .from('inventories')
        .insert({
          name: inventoryData.name,
          company: currentUser.company,
          status: 'Novo',
          created_by: currentUser.id,
        })
        .select()
        .single();
      if (inventoryError) throw inventoryError;

      const productsToInsert = inventoryData.products.map(p => ({
        inventory_id: newInventory.id,
        product_code: String(p.CodigoProduto),
        barcode: String(p.CodigoBarras),
        description: String(p.Descricao),
        expected_quantity: 0,
        current_status: 'Pendente',
      }));

      const { error: productsError } = await supabase
        .from('inventory_products')
        .insert(productsToInsert);

      if (productsError) {
        await supabase.from('inventories').delete().eq('id', newInventory.id);
        throw productsError;
      }

      toast({
        title: "Inventário Criado com Sucesso!",
        description: `O inventário "${newInventory.name}" foi criado com ${productsToInsert.length} produtos.`,
        variant: 'success',
      });
      setCreateInventoryModalOpen(false);
      fetchInventories();
    } catch (error) {
      console.error("Erro ao criar inventário:", error);
      toast({
        title: "Erro ao Criar Inventário",
        description: `Ocorreu um erro: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const renderAdminView = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Gerenciador de Inventários</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">Crie, monitore e finalize os inventários da empresa.</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setCreateInventoryModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Criar Novo Inventário
          </Button>
        </div>
      </header>
      <InventoryList inventories={inventories} isLoading={isLoading} />
    </motion.div>
  );

  const renderUserView = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Minhas Contagens</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">Veja os inventários e as contagens que foram designadas a você.</p>
      </header>
      <UserInventoryList assignments={userAssignments} isLoading={isLoading} />
    </motion.div>
  );

  return (
    <>
      <div className="max-w-7xl mx-auto w-full">
        {currentUser?.group === 'admin' ? renderAdminView() : renderUserView()}
      </div>
      {isCreateInventoryModalOpen && (
        <CreateInventoryModal
          isOpen={isCreateInventoryModalOpen}
          onClose={() => setCreateInventoryModalOpen(false)}
          onSave={handleCreateInventory}
          isCreating={isCreating}
        />
      )}
    </>
  );
};

export default InventoryPage;
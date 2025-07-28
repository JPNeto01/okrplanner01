
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Users, CheckCircle, AlertTriangle, RefreshCw, Loader2, FileDown, Flag, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';

const InventoryDetailPage = () => {
  const { inventoryId } = useParams();
  const { toast } = useToast();
  const [inventory, setInventory] = useState(null);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [assignments, setAssignments] = useState({ 1: null, 2: null });
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const fetchInventoryData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: invData, error: invError } = await supabase
        .from('inventories')
        .select('*, profiles:created_by(name)')
        .eq('id', inventoryId)
        .single();
      if (invError) throw invError;
      setInventory(invData);

      const { data: prodData, error: prodError } = await supabase
        .from('inventory_products')
        .select('*, inventory_counts(*, profiles(name))')
        .eq('inventory_id', inventoryId)
        .order('product_code', { ascending: true });
      if (prodError) throw prodError;
      setProducts(prodData);

      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('company', invData.company)
        .in('user_group', ['inventory_user', 'admin']);
      if (usersError) throw usersError;
      setUsers(usersData);

      const { data: assignData, error: assignError } = await supabase
        .from('inventory_assignments')
        .select('*, profiles(name)')
        .eq('inventory_id', inventoryId);
      if (assignError) throw assignError;
      
      const currentAssignments = { 1: null, 2: null };
      assignData.forEach(a => {
        if (a.count_stage === 1) currentAssignments[1] = a;
        if (a.count_stage === 2) currentAssignments[2] = a;
      });
      setAssignments(currentAssignments);

    } catch (error) {
      toast({ title: 'Erro ao carregar dados', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [inventoryId, toast]);

  useEffect(() => {
    fetchInventoryData();
  }, [fetchInventoryData]);

  const handleAssignUser = async (stage, userId) => {
    if (!userId) return;
    setIsAssigning(true);
    try {
      const { data, error } = await supabase.from('inventory_assignments').upsert({
        inventory_id: inventoryId,
        user_id: userId,
        count_stage: stage,
        is_active: true,
      }, { onConflict: 'inventory_id, user_id, count_stage' }).select().single();


      if (error) throw error;
      
      if (inventory.status === 'Novo') {
        await supabase.from('inventories').update({ status: 'Em andamento' }).eq('id', inventoryId);
      }

      toast({ title: `Usuário designado para a ${stage}ª contagem!`, variant: 'success' });
      fetchInventoryData();
    } catch (error) {
      toast({ title: 'Erro ao designar usuário', description: error.message, variant: 'destructive' });
    } finally {
      setIsAssigning(false);
    }
  };
  
  const handleEnableThirdCount = async (productId) => {
    try {
        await supabase.from('inventory_products').update({ current_status: 'Recontagem' }).eq('id', productId);
        toast({ title: 'Recontagem habilitada!', description: 'O usuário da 2ª contagem pode recontar este item.', variant: 'success' });
        fetchInventoryData();
    } catch (error) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const handleFinalizeInventory = async () => {
    setIsFinalizing(true);
    try {
        const divergentProducts = products.filter(p => p.current_status === 'Divergente');
        if (divergentProducts.length > 0) {
            toast({ title: 'Ação não permitida', description: 'Existem produtos com divergência. Resolva-os antes de finalizar.', variant: 'destructive' });
            return;
        }
        await supabase.from('inventories').update({ status: 'Concluído' }).eq('id', inventoryId);
        toast({ title: 'Inventário Finalizado!', variant: 'success' });
        fetchInventoryData();
    } catch (error) {
        toast({ title: 'Erro ao finalizar', description: error.message, variant: 'destructive' });
    } finally {
        setIsFinalizing(false);
    }
  };

  const handleExport = () => {
    const dataToExport = products.map(p => {
        const counts = {};
        p.inventory_counts.forEach(c => {
            counts[`Contagem ${c.count_stage}`] = c.counted_quantity;
            counts[`Responsável ${c.count_stage}`] = c.profiles.name;
        });
        return {
            'Código do Produto': p.product_code,
            'Código de Barras': p.barcode,
            'Descrição': p.description,
            'Estoque Esperado': p.expected_quantity,
            'Status Atual': p.current_status,
            ...counts
        };
    });
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Resultados");
    XLSX.writeFile(workbook, `inventario_${inventory?.name.replace(/\s+/g, '_')}.xlsx`);
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-16 w-16 animate-spin" /></div>;
  if (!inventory) return <div className="text-center mt-10">Inventário não encontrado.</div>;

  const getStatusInfo = (status) => {
    const variants = {
      'Pendente': { icon: <Loader2 className="h-4 w-4 animate-spin text-gray-500" />, color: 'text-gray-500' },
      'Contado': { icon: <CheckCircle className="h-4 w-4 text-blue-500" />, color: 'text-blue-500' },
      'Divergente': { icon: <AlertTriangle className="h-4 w-4 text-red-500" />, color: 'text-red-500' },
      'Resolvido': { icon: <CheckCircle className="h-4 w-4 text-green-500" />, color: 'text-green-500' },
      'Recontagem': { icon: <RefreshCw className="h-4 w-4 text-orange-500" />, color: 'text-orange-500' },
    };
    return variants[status] || variants['Pendente'];
  };

  const isFinalizable = products.every(p => p.current_status !== 'Divergente' && p.current_status !== 'Pendente');

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="icon"><Link to="/inventory"><ArrowLeft /></Link></Button>
            <div>
              <h1 className="text-3xl font-bold">{inventory.name}</h1>
              <p className="text-muted-foreground">Status: {inventory.status}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExport} disabled={products.length === 0}><FileDown className="mr-2 h-4 w-4" /> Exportar Resultados</Button>
            {inventory.status !== 'Concluído' && (
                <Button onClick={handleFinalizeInventory} disabled={!isFinalizable || isFinalizing}>
                    {isFinalizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Flag className="mr-2 h-4 w-4" />}
                    Finalizar Inventário
                </Button>
            )}
             {inventory.status === 'Concluído' && (
                <Button disabled variant="success"><Lock className="mr-2 h-4 w-4" /> Finalizado</Button>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center"><Users className="mr-2"/>1ª Contagem</CardTitle></CardHeader>
            <CardContent>
              {assignments[1] ? (
                <p>Responsável: <strong>{assignments[1].profiles.name}</strong></p>
              ) : (
                <Select onValueChange={(value) => handleAssignUser(1, value)} disabled={isAssigning || inventory.status === 'Concluído'}>
                  <SelectTrigger><SelectValue placeholder="Designar usuário..." /></SelectTrigger>
                  <SelectContent>{users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center"><Users className="mr-2"/>2ª Contagem</CardTitle></CardHeader>
            <CardContent>
              {assignments[2] ? (
                <p>Responsável: <strong>{assignments[2].profiles.name}</strong></p>
              ) : (
                <Select onValueChange={(value) => handleAssignUser(2, value)} disabled={!assignments[1] || isAssigning || inventory.status === 'Concluído'}>
                  <SelectTrigger><SelectValue placeholder="Designar usuário..." /></SelectTrigger>
                  <SelectContent>{users.filter(u => u.id !== assignments[1]?.user_id).map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>
           <Card>
            <CardHeader><CardTitle>Resumo</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 text-sm">
                <p>Total de Itens:</p> <p className="font-bold">{products.length}</p>
                <p>Divergentes:</p> <p className="font-bold text-red-500">{products.filter(p => p.current_status === 'Divergente').length}</p>
                <p>Resolvidos:</p> <p className="font-bold text-green-500">{products.filter(p => p.current_status === 'Resolvido').length}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Progresso dos Itens</CardTitle><CardDescription>Acompanhe o status de cada produto no inventário.</CardDescription></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left">Produto</th>
                    <th className="p-2 text-center">Estoque</th>
                    <th className="p-2 text-center">1ª Contagem</th>
                    <th className="p-2 text-center">2ª Contagem</th>
                    <th className="p-2 text-center">Status</th>
                    <th className="p-2 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => {
                    const count1 = p.inventory_counts.find(c => c.count_stage === 1);
                    const count2 = p.inventory_counts.find(c => c.count_stage === 2);
                    const statusInfo = getStatusInfo(p.current_status);
                    return (
                      <tr key={p.id} className="border-b hover:bg-slate-100">
                        <td className="p-2"><div className="font-medium">{p.description}</div><div className="text-xs text-muted-foreground">{p.product_code}</div></td>
                        <td className="p-2 text-center">{p.expected_quantity}</td>
                        <td className="p-2 text-center">{count1 ? count1.counted_quantity : '-'}</td>
                        <td className="p-2 text-center">{count2 ? count2.counted_quantity : '-'}</td>
                        <td className="p-2 text-center"><div className={`flex items-center justify-center gap-2 ${statusInfo.color}`}>{statusInfo.icon} {p.current_status}</div></td>
                        <td className="p-2 text-center">
                          {p.current_status === 'Divergente' && inventory.status !== 'Concluído' && (
                            <Button size="sm" variant="destructive" onClick={() => handleEnableThirdCount(p.id)}>Habilitar 3ª Contagem</Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default InventoryDetailPage;

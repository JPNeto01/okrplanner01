import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ScanLine, CheckCircle2, AlertCircle, ArrowLeft, XCircle, Edit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const InventoryCountPage = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [assignment, setAssignment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [lastScanned, setLastScanned] = useState(null);
  const barcodeInputRef = useRef(null);
  const quantityInputRef = useRef(null);

  const fetchAssignment = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory_assignments')
        .select('*, inventories(name)')
        .eq('id', assignmentId)
        .single();
      if (error || !data) throw new Error("Atribuição não encontrada ou acesso negado.");
      setAssignment(data);
    } catch (error) {
      toast({ title: 'Erro ao carregar contagem', description: error.message, variant: 'destructive' });
      navigate('/inventory');
    } finally {
      setIsLoading(false);
      setTimeout(() => barcodeInputRef.current?.focus(), 100);
    }
  }, [assignmentId, toast, navigate]);

  useEffect(() => {
    fetchAssignment();
  }, [fetchAssignment]);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!barcode.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setLastScanned(null);

    try {
      const { data, error } = await supabase.rpc('register_inventory_count', {
        p_assignment_id: assignmentId,
        p_barcode: barcode.trim(),
        p_quantity: Number(quantity),
        p_user_id: currentUser.id
      });

      if (error) throw error;

      const result = data[0];
      if (result.success) {
        setLastScanned({ 
          success: true, 
          message: `${result.product_description} | Qtd: ${quantity} | Total: ${result.total_counted_quantity}` 
        });
      } else {
        setLastScanned({ success: false, message: result.message });
        toast({
          title: "Erro na Contagem",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = error.message || 'Ocorreu um erro desconhecido.';
      setLastScanned({ success: false, message: `Erro: ${errorMessage}` });
      toast({ title: 'Erro Crítico', description: errorMessage, variant: 'destructive' });
    } finally {
      setBarcode('');
      setQuantity(1);
      setIsSubmitting(false);
      barcodeInputRef.current?.focus();
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-900">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="w-full max-w-md"
      >
        <div className="absolute top-4 left-4">
          <Button asChild variant="ghost" size="icon" className="text-slate-400 hover:bg-slate-800 hover:text-white">
            <Link to="/my-tasks"><ArrowLeft /></Link>
          </Button>
        </div>
        
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm shadow-2xl shadow-black/30">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl sm:text-3xl font-bold text-primary">
              {assignment.inventories.name}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {assignment.count_stage}ª Contagem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleScan} className="space-y-6">
              <div className="relative">
                <label htmlFor="barcode" className="block text-sm font-medium text-slate-400 mb-2">Código de Barras</label>
                <div className="relative">
                  <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-500" />
                  <Input
                    id="barcode"
                    ref={barcodeInputRef}
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="pl-12 text-lg sm:text-xl h-14 bg-slate-900 border-slate-700 focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Aguardando leitura..."
                    autoFocus
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="relative">
                <label htmlFor="quantity" className="block text-sm font-medium text-slate-400 mb-2">Quantidade</label>
                <div className="relative">
                  <Edit className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <Input
                    id="quantity"
                    ref={quantityInputRef}
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="pl-12 text-center text-lg sm:text-xl h-14 bg-slate-900 border-slate-700 focus:ring-2 focus:ring-primary focus:border-primary"
                    min="1"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 disabled:opacity-50" disabled={isSubmitting || !barcode.trim()}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Registrar Contagem'}
              </Button>
            </form>
            
            <AnimatePresence>
              {lastScanned && (
                <motion.div
                  key={lastScanned.message}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
                  className={`mt-6 p-4 rounded-lg flex items-center gap-3 text-sm sm:text-base ${lastScanned.success ? 'bg-green-500/10 text-green-300 border border-green-500/20' : 'bg-red-500/10 text-red-300 border border-red-500/20'}`}
                >
                  {lastScanned.success ? <CheckCircle2 className="h-5 w-5 flex-shrink-0" /> : <XCircle className="h-5 w-5 flex-shrink-0" />}
                  <p className="font-medium break-words">{lastScanned.message}</p>
                </motion.div>
              )}
            </AnimatePresence>

          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default InventoryCountPage;

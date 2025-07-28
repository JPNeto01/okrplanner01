import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { UploadCloud, CheckCircle, AlertCircle, Download, X, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const CreateInventoryModal = ({ isOpen, onClose, onSave, isCreating }) => {
  const { toast } = useToast();
  const [inventoryName, setInventoryName] = useState('');
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [products, setProducts] = useState([]);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setFileError('');
    setProducts([]);

    if (rejectedFiles && rejectedFiles.length > 0) {
      setFileError('Arquivo inválido. Apenas arquivos .xlsx são permitidos.');
      setFile(null);
      return;
    }

    if (acceptedFiles && acceptedFiles.length > 0) {
      const uploadedFile = acceptedFiles[0];
      setFile(uploadedFile);
      parseXlsx(uploadedFile);
    }
  }, []);

  const parseXlsx = (fileToParse) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, {
          raw: false, // Lê os valores como strings formatadas
          defval: '' // Valor padrão para células vazias
        });

        const expectedHeaders = ['CodigoProduto', 'CodigoBarras', 'Descricao', 'QuantidadeEstoque'];
        const actualHeaders = Object.keys(json[0] || {});
        const missingHeaders = expectedHeaders.filter(h => !actualHeaders.includes(h));

        if (missingHeaders.length > 0) {
          throw new Error(`Cabeçalhos faltando na planilha: ${missingHeaders.join(', ')}`);
        }
        
        const validatedProducts = json.map((p, index) => {
            if (!p.CodigoProduto || !p.CodigoBarras || !p.Descricao) {
              throw new Error(`Linha ${index + 2}: Código do Produto, Código de Barras e Descrição são obrigatórios.`);
            }
            if (isNaN(Number(p.QuantidadeEstoque))) {
              throw new Error(`Linha ${index + 2}: Quantidade em Estoque deve ser um número.`);
            }
            return p;
        });

        setProducts(validatedProducts);
        toast({
          title: "Arquivo Processado!",
          description: `${validatedProducts.length} produtos carregados com sucesso da planilha.`,
          variant: "success",
        });
      } catch (error) {
        setFileError(`Erro ao ler a planilha: ${error.message}. Verifique o formato e os dados.`);
        setFile(null);
        setProducts([]);
      }
    };
    reader.readAsArrayBuffer(fileToParse);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    multiple: false
  });

  const handleDownloadTemplate = () => {
    const worksheet = XLSX.utils.json_to_sheet([
      { CodigoProduto: 'PROD001', CodigoBarras: '7890123456789', Descricao: 'Produto Exemplo A', QuantidadeEstoque: 100 }
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Produtos");
    XLSX.writeFile(workbook, "modelo_inventario.xlsx");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inventoryName.trim()) {
      toast({ title: "Erro", description: "O nome do inventário é obrigatório.", variant: "destructive" });
      return;
    }
    if (!file || products.length === 0) {
      toast({ title: "Erro", description: "É necessário carregar um arquivo de produtos válido.", variant: "destructive" });
      return;
    }
    onSave({ name: inventoryName, products });
  };
  
  const handleClose = () => {
    if (isCreating) return;
    setInventoryName('');
    setFile(null);
    setProducts([]);
    setFileError('');
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-2xl bg-white dark:bg-slate-900">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary dark:text-primary-foreground">Criar Novo Inventário</DialogTitle>
          <DialogDescription>
            Dê um nome ao seu inventário e importe os produtos a partir de uma planilha .xlsx.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div>
            <Label htmlFor="inventoryName" className="text-base font-medium">Nome do Inventário</Label>
            <Input
              id="inventoryName"
              value={inventoryName}
              onChange={(e) => setInventoryName(e.target.value)}
              placeholder="Ex: Inventário Mensal - Julho 2025"
              className="mt-2"
              required
              disabled={isCreating}
            />
          </div>

          <div>
            <Label className="text-base font-medium">Importar Produtos</Label>
            <div 
              {...getRootProps()} 
              className={`mt-2 p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors
                ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}
                ${isCreating ? 'cursor-not-allowed bg-slate-100 dark:bg-slate-800' : ''}`}
            >
              <input {...getInputProps()} disabled={isCreating} />
              <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                {isDragActive ? 'Solte o arquivo aqui!' : 'Arraste e solte o arquivo .xlsx ou clique para selecionar.'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Apenas arquivos .xlsx são aceitos.</p>
            </div>
             <Button type="button" variant="link" size="sm" onClick={handleDownloadTemplate} className="mt-2 px-0" disabled={isCreating}>
              <Download className="mr-1 h-4 w-4" />
              Baixar modelo da planilha
            </Button>
          </div>
          
          {fileError && (
            <div className="flex items-center p-3 rounded-md bg-destructive/10 text-destructive">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span className="text-sm">{fileError}</span>
            </div>
          )}

          {file && !fileError && (
            <div className="flex items-center p-3 rounded-md bg-green-500/10 text-green-700 dark:text-green-400">
              <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
              <div className="flex-grow">
                <p className="text-sm font-semibold">{file.name}</p>
                <p className="text-xs">{products.length} produtos carregados.</p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => { if (!isCreating) { setFile(null); setProducts([]); }}} className="h-6 w-6" disabled={isCreating}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <DialogFooter className="pt-6 border-t border-slate-200 dark:border-slate-700 mt-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isCreating}>
                  Cancelar
              </Button>
              <Button type="submit" disabled={!inventoryName || products.length === 0 || isCreating}>
                  {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isCreating ? 'Criando Inventário...' : 'Salvar e Criar Inventário'}
              </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateInventoryModal;
import React, { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { UploadCloud, Download, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const BatchTaskUploadModal = ({ isOpen, onClose, objectives, allAppUsers, currentUser, onTasksCreated }) => {
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingFeedback, setProcessingFeedback] = useState([]);
  const [fileName, setFileName] = useState('');

  const EXCEL_TEMPLATE_COLUMNS = [
    "Nome da Tarefa", "Descricao", "ID do Objetivo", 
    "Nome do Responsavel", "Email do Responsavel", 
    "Data Limite (AAAA-MM-DD)", "Status Inicial (Backlog/A Fazer)", "Empresa"
  ];

  const EXCEL_EXAMPLE_ROW = [
    "Analisar Feedback dos Usuários", "Coletar e analisar os feedbacks da última pesquisa.", "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "Ana Paula", "ana.paula@example.com", new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], "Backlog", "MinhaEmpresaX"
  ];

  const handleDownloadTemplate = () => {
    const worksheet = XLSX.utils.aoa_to_sheet([EXCEL_TEMPLATE_COLUMNS, EXCEL_EXAMPLE_ROW]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Modelo Tarefas");
    XLSX.writeFile(workbook, "modelo_tarefas_okr.xlsx");
    toast({ title: "Modelo Baixado", description: "O modelo Excel foi baixado com sucesso." });
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' && file.type !== 'application/vnd.ms-excel') {
        toast({ title: "Arquivo Inválido", description: "Por favor, selecione um arquivo Excel (.xlsx ou .xls).", variant: "destructive" });
        setSelectedFile(null);
        setFileName('');
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setSelectedFile(file);
      setFileName(file.name);
      setProcessingFeedback([]);
    }
  };

  const processAndUploadFile = async () => {
    if (!selectedFile) {
      toast({ title: "Nenhum Arquivo", description: "Por favor, selecione um arquivo Excel para enviar.", variant: "warning" });
      return;
    }
    setIsProcessing(true);
    setProcessingFeedback([{ type: 'info', message: 'Iniciando processamento do arquivo...' }]);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length < 2) {
          setProcessingFeedback(prev => [...prev, { type: 'error', message: "Arquivo Excel vazio ou sem dados de tarefas." }]);
          setIsProcessing(false);
          return;
        }

        const headers = jsonData[0].map(h => String(h).trim());
        const expectedHeaders = EXCEL_TEMPLATE_COLUMNS.map(h => String(h).trim());
        
        const missingHeaders = expectedHeaders.filter(eh => !headers.includes(eh));
        if (missingHeaders.length > 0) {
            setProcessingFeedback(prev => [...prev, { type: 'error', message: `Colunas faltando no arquivo: ${missingHeaders.join(', ')}. Verifique o modelo.` }]);
            setIsProcessing(false);
            return;
        }

        const tasksToCreate = [];
        const validationErrors = [];

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (row.every(cell => cell === null || cell === undefined || String(cell).trim() === '')) continue; // Skip empty rows

          const taskData = {};
          headers.forEach((header, index) => {
            taskData[header] = row[index];
          });

          const rowIndexForError = i + 1;

          // Validations
          if (!taskData[EXCEL_TEMPLATE_COLUMNS[0]]?.trim()) { // Nome da Tarefa
            validationErrors.push({ line: rowIndexForError, field: EXCEL_TEMPLATE_COLUMNS[0], message: "Nome da Tarefa é obrigatório." });
            continue;
          }
          if (!taskData[EXCEL_TEMPLATE_COLUMNS[2]]?.trim()) { // ID do Objetivo
            validationErrors.push({ line: rowIndexForError, field: EXCEL_TEMPLATE_COLUMNS[2], message: "ID do Objetivo é obrigatório." });
            continue;
          }
          const objective = objectives.find(obj => obj.id === String(taskData[EXCEL_TEMPLATE_COLUMNS[2]]).trim());
          if (!objective) {
            validationErrors.push({ line: rowIndexForError, field: EXCEL_TEMPLATE_COLUMNS[2], message: `ID do Objetivo "${taskData[EXCEL_TEMPLATE_COLUMNS[2]]}" não encontrado ou inválido.` });
            continue;
          }
          
          let responsibleUser;
          const responsibleName = String(taskData[EXCEL_TEMPLATE_COLUMNS[3]] || '').trim();
          const responsibleEmail = String(taskData[EXCEL_TEMPLATE_COLUMNS[4]] || '').trim();

          if (responsibleEmail) {
            responsibleUser = allAppUsers.find(u => u.email === responsibleEmail && u.company === objective.company);
          } else if (responsibleName) {
            const potentialUsers = allAppUsers.filter(u => u.name === responsibleName && u.company === objective.company);
            if (potentialUsers.length === 1) responsibleUser = potentialUsers[0];
            else if (potentialUsers.length > 1) {
                 validationErrors.push({ line: rowIndexForError, field: EXCEL_TEMPLATE_COLUMNS[3], message: `Múltiplos usuários encontrados com o nome "${responsibleName}" na empresa ${objective.company}. Use o email para desambiguar.` });
                 continue;
            }
          }

          if (!responsibleUser) {
            validationErrors.push({ line: rowIndexForError, field: EXCEL_TEMPLATE_COLUMNS[3], message: `Responsável "${responsibleName || responsibleEmail}" não encontrado na empresa ${objective.company} ou informação ambígua.` });
            continue;
          }

          let dueDate = taskData[EXCEL_TEMPLATE_COLUMNS[5]];
          if (dueDate instanceof Date) {
            dueDate = dueDate.toISOString().split('T')[0];
          } else if (typeof dueDate === 'string' && dueDate.trim()) {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate.trim())) {
                validationErrors.push({ line: rowIndexForError, field: EXCEL_TEMPLATE_COLUMNS[5], message: "Formato da Data Limite inválido. Use AAAA-MM-DD." });
                continue;
            }
            dueDate = dueDate.trim();
          } else {
             validationErrors.push({ line: rowIndexForError, field: EXCEL_TEMPLATE_COLUMNS[5], message: "Data Limite é obrigatória." });
             continue;
          }
          
          const status = String(taskData[EXCEL_TEMPLATE_COLUMNS[6]] || 'Backlog').trim();
          if (!['Backlog', 'A Fazer'].includes(status)) {
            validationErrors.push({ line: rowIndexForError, field: EXCEL_TEMPLATE_COLUMNS[6], message: "Status Inicial inválido. Use 'Backlog' ou 'A Fazer'." });
            continue;
          }

          const taskCompany = String(taskData[EXCEL_TEMPLATE_COLUMNS[7]] || '').trim();
           if (!taskCompany) {
            validationErrors.push({ line: rowIndexForError, field: EXCEL_TEMPLATE_COLUMNS[7], message: "Empresa é obrigatória." });
            continue;
          }
          if (taskCompany !== objective.company) {
            validationErrors.push({ line: rowIndexForError, field: EXCEL_TEMPLATE_COLUMNS[7], message: `Empresa da tarefa (${taskCompany}) não corresponde à empresa do objetivo (${objective.company}).` });
            continue;
          }
          
          // Permissão para criar tarefa no objetivo
          const canCreateForObjective = currentUser.group === 'admin' ||
            (currentUser.group === 'product_owner' && objective.responsible_id === currentUser.id && objective.company === currentUser.company) ||
            (currentUser.group === 'scrum_master' && objective.coordinator_scrum_master_id === currentUser.id && objective.company === currentUser.company);

          if (!canCreateForObjective) {
            validationErrors.push({ line: rowIndexForError, field: EXCEL_TEMPLATE_COLUMNS[2], message: `Você não tem permissão para criar tarefas para o objetivo "${objective.title}".` });
            continue;
          }


          tasksToCreate.push({
            title: String(taskData[EXCEL_TEMPLATE_COLUMNS[0]]).trim(),
            description: String(taskData[EXCEL_TEMPLATE_COLUMNS[1]] || '').trim(),
            objective_id: objective.id,
            responsible_id: responsibleUser.id,
            due_date: dueDate,
            status: status,
            company: objective.company,
            created_by_id: currentUser.id,
            kr_id: null,
          });
        }

        if (validationErrors.length > 0) {
          setProcessingFeedback(prev => [
            ...prev, 
            { type: 'error', message: `${validationErrors.length} tarefa(s) com erros de validação. Nenhuma tarefa foi criada.` },
            ...validationErrors.map(err => ({ type: 'validation', message: `Linha ${err.line}: [${err.field}] ${err.message}` }))
          ]);
          setIsProcessing(false);
          return;
        }

        if (tasksToCreate.length === 0) {
          setProcessingFeedback(prev => [...prev, { type: 'info', message: "Nenhuma tarefa válida encontrada para criar." }]);
          setIsProcessing(false);
          return;
        }
        
        setProcessingFeedback(prev => [...prev, { type: 'info', message: `Validado. Tentando criar ${tasksToCreate.length} tarefas...` }]);

        const { data: insertedTasks, error: insertError } = await supabase.from('tasks').insert(tasksToCreate).select();

        if (insertError) {
          console.error("Error inserting batch tasks:", insertError);
          setProcessingFeedback(prev => [...prev, { type: 'error', message: `Erro ao criar tarefas: ${insertError.message}` }]);
          setIsProcessing(false);
          return;
        }

        setProcessingFeedback(prev => [...prev, { type: 'success', message: `${insertedTasks.length} tarefas criadas com sucesso!` }]);
        toast({ title: "Sucesso!", description: `${insertedTasks.length} tarefas criadas em lote.` });
        onTasksCreated(); // Callback to refresh backlog
        // onClose(); // Optionally close modal on success
      } catch (err) {
        console.error("Error processing Excel file:", err);
        setProcessingFeedback(prev => [...prev, { type: 'error', message: `Erro ao processar arquivo: ${err.message}` }]);
      } finally {
        setIsProcessing(false);
        setSelectedFile(null);
        setFileName('');
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const handleCloseModal = () => {
    if (isProcessing) return;
    setSelectedFile(null);
    setFileName('');
    setProcessingFeedback([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCloseModal()}>
      <DialogContent className="sm:max-w-lg md:max-w-xl lg:max-w-2xl dark:bg-slate-800">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary dark:text-primary-foreground">Criar Tarefas em Lote</DialogTitle>
          <DialogDescription>
            Baixe o modelo, preencha com os dados das tarefas e envie o arquivo Excel para criação em massa.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 my-6">
          <div>
            <Label className="text-base font-semibold">1. Baixar Modelo</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Use este modelo para garantir que todas as colunas necessárias estejam corretas.
            </p>
            <Button variant="outline" onClick={handleDownloadTemplate} className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" /> Baixar Modelo (.xlsx)
            </Button>
          </div>

          <div>
            <Label className="text-base font-semibold">2. Selecionar e Enviar Arquivo</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Após preencher o modelo, selecione o arquivo .xlsx para upload.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Label htmlFor="batch-task-file-upload" className="flex-grow">
                <div className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed rounded-md cursor-pointer hover:border-primary dark:border-gray-600 dark:hover:border-primary-foreground">
                  <UploadCloud className="w-6 h-6 mr-2 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {fileName || "Clique para selecionar o arquivo Excel"}
                  </span>
                </div>
                <Input 
                  id="batch-task-file-upload" 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden"
                  accept=".xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                />
              </Label>
              <Button onClick={processAndUploadFile} disabled={!selectedFile || isProcessing} className="w-full sm:w-auto">
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                {isProcessing ? "Processando..." : "Enviar Arquivo"}
              </Button>
            </div>
          </div>

          {processingFeedback.length > 0 && (
            <div className="mt-4">
              <Label className="text-base font-semibold">Feedback do Processamento:</Label>
              <ScrollArea className="h-40 w-full rounded-md border p-3 mt-2 bg-slate-50 dark:bg-slate-700">
                {processingFeedback.map((fb, index) => (
                  <div key={index} className={`flex items-start text-xs mb-1.5 p-1.5 rounded-sm ${
                    fb.type === 'error' ? 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30' : 
                    fb.type === 'success' ? 'text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30' :
                    fb.type === 'validation' ? 'text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30' :
                    'text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30'
                  }`}>
                    {fb.type === 'error' && <AlertCircle className="h-3.5 w-3.5 mr-1.5 mt-0.5 flex-shrink-0" />}
                    {fb.type === 'success' && <CheckCircle className="h-3.5 w-3.5 mr-1.5 mt-0.5 flex-shrink-0" />}
                    {fb.type === 'validation' && <AlertCircle className="h-3.5 w-3.5 mr-1.5 mt-0.5 flex-shrink-0" />}
                    <span>{fb.message}</span>
                  </div>
                ))}
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={handleCloseModal} disabled={isProcessing}>
              Fechar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BatchTaskUploadModal;
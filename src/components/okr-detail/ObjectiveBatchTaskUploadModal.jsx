import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { UploadCloud, Download, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { sanitizeFileName } from '@/lib/utils';

const ObjectiveBatchTaskUploadModal = ({ isOpen, onClose, objective, allAppUsers, currentUser, onTasksCreated }) => {
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingFeedback, setProcessingFeedback] = useState([]);
  const [fileName, setFileName] = useState('');

  const MODEL_FILE_NAME = "Modelo Backlog.xlsx";

  const EXCEL_USER_COLUMNS = [
    "Nome da Tarefa", 
    "Descricao", 
    "Data Limite (DD/MM/YYYY)", 
    "E-mail do Responsável"
  ];

  const parseAndValidateDate = (dateInput) => {
    if (dateInput instanceof Date) {
      if (isNaN(dateInput.getTime())) {
        return { valid: false, error: "Objeto de data inválido." };
      }
      const year = dateInput.getFullYear();
      const month = dateInput.getMonth() + 1;
      const day = dateInput.getDate();
      
      const formattedYear = String(year).padStart(4, '0');
      const formattedMonth = String(month).padStart(2, '0');
      const formattedDay = String(day).padStart(2, '0');
      return { valid: true, value: `${formattedYear}-${formattedMonth}-${formattedDay}` };
    }

    if (typeof dateInput === 'number') { // Excel serial date number
        try {
            const jsDate = XLSX.SSF.parse_date_code(dateInput);
            if (jsDate) {
                const year = jsDate.y;
                const month = jsDate.m;
                const day = jsDate.d;
                const formattedYear = String(year).padStart(4, '0');
                const formattedMonth = String(month).padStart(2, '0');
                const formattedDay = String(day).padStart(2, '0');
                return { valid: true, value: `${formattedYear}-${formattedMonth}-${formattedDay}` };
            }
        } catch (e) {
            // fall through to string parsing
        }
    }


    if (typeof dateInput !== 'string') return { valid: false, error: "Data não fornecida ou formato irreconhecível." };
    
    const trimmedDateStr = dateInput.trim();
    const parts = trimmedDateStr.split(/[-\/.]/); 
    
    if (parts.length !== 3) return { valid: false, error: "Formato de data inválido. Use DD/MM/YYYY." };
    
    let day = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10);
    let year = parseInt(parts[2], 10);

    // Handle DD/MM/YY by assuming 20YY
    if (year >= 0 && year <= 99) {
        year += 2000;
    }

    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      return { valid: false, error: "Componentes da data inválidos. Use DD/MM/YYYY." };
    }
    
    if (year < 1000 || year > 3000 || month < 1 || month > 12 || day < 1 || day > 31) {
        return { valid: false, error: "Valores de data fora do intervalo permitido." };
    }

    const dateObj = new Date(year, month - 1, day);
    if (dateObj.getFullYear() !== year || dateObj.getMonth() + 1 !== month || dateObj.getDate() !== day) {
        return { valid: false, error: "Data inválida (ex: 31 de Fevereiro)." };
    }
    
    const formattedYear = String(year).padStart(4, '0');
    const formattedMonth = String(month).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    
    return { valid: true, value: `${formattedYear}-${formattedMonth}-${formattedDay}` };
  };


  const handleDownloadTemplate = () => {
    if (!objective) return;

    const headerRow1Values = [`Objetivo Vinculado: ${objective.title}`, `ID do Objetivo: ${objective.id}`, `Empresa: ${objective.company}`];
    
    const today = new Date();
    const exampleDate = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());

    const dataForSheet = [
      headerRow1Values,
      EXCEL_USER_COLUMNS,
      [
        "Analisar Feedback dos Usuários", 
        "Coletar e analisar os feedbacks da última pesquisa.",
        exampleDate, // Passando como objeto Date
        "exemplo.responsavel@empresa.com"
      ]
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(dataForSheet);

    // Formatar a célula de data no exemplo (C3)
    // A indexação é baseada em 0, então C3 é [2][2] nos dados (após os cabeçalhos)
    // Na worksheet, é a célula na linha 3 (index 2), coluna C (index 2)
    if (worksheet['C3']) { // Célula C3 (Data Limite exemplo)
      worksheet['C3'].t = 'd'; // tipo data
      worksheet['C3'].z = 'dd/mm/yyyy'; // formato de número
    }
    
    // Definir largura das colunas
    const colWidths = EXCEL_USER_COLUMNS.map((header, index) => {
        if (index === 2) return ({ wch: 15 }); // Coluna de data
        return ({ wch: Math.max(header.length, 25) });
    });
    worksheet['!cols'] = colWidths;
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Modelo Tarefas");
    
    XLSX.writeFile(workbook, MODEL_FILE_NAME);
    toast({ title: "Modelo Baixado", description: `${MODEL_FILE_NAME} para "${objective.title}" baixado.` });
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
    if (!selectedFile || !objective) {
      toast({ title: "Erro", description: "Arquivo ou objetivo não selecionado.", variant: "warning" });
      return;
    }
    setIsProcessing(true);
    setProcessingFeedback([{ type: 'info', message: `Iniciando processamento para o objetivo: ${objective.title}` }]);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target.result;
        // cellDates: true para que a lib tente converter datas do Excel em objetos Date do JS
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true, cellNF: false, cellText: false }); 
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // range: 1 para pular a linha de cabeçalho informativo do objetivo
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 1, rawNumbers: false }); 

        if (jsonData.length < 2) { 
          setProcessingFeedback(prev => [...prev, { type: 'error', message: "Arquivo Excel vazio ou sem dados de tarefas (após os cabeçalhos)." }]);
          setIsProcessing(false);
          return;
        }

        const headers = jsonData[0].map(h => String(h).trim());
        const expectedHeaders = EXCEL_USER_COLUMNS.map(h => String(h).trim());
        
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
          if (row.every(cell => cell === null || cell === undefined || String(cell).trim() === '')) continue; 

          const taskData = {};
          headers.forEach((header, index) => {
            taskData[header] = row[index];
          });

          const rowIndexForError = i + 1 + 1; // +1 (json é 0-index), +1 (pulamos header informativo), +1 (headers de coluna)

          if (!taskData[EXCEL_USER_COLUMNS[0]]?.trim()) { 
            validationErrors.push({ line: rowIndexForError, field: EXCEL_USER_COLUMNS[0], message: "Nome da Tarefa é obrigatório." });
            continue;
          }
          
          const responsibleEmail = String(taskData[EXCEL_USER_COLUMNS[3]] || '').trim();
          if (!responsibleEmail) {
            validationErrors.push({ line: rowIndexForError, field: EXCEL_USER_COLUMNS[3], message: "E-mail do Responsável é obrigatório." });
            continue;
          }
          const responsibleUser = allAppUsers.find(u => u.email === responsibleEmail && u.company === objective.company);
          if (!responsibleUser) {
            validationErrors.push({ line: rowIndexForError, field: EXCEL_USER_COLUMNS[3], message: `E-mail do Responsável "${responsibleEmail}" não encontrado na empresa ${objective.company}.` });
            continue;
          }
          
          // A data vem de taskData[EXCEL_USER_COLUMNS[2]]
          // Com cellDates: true, pode ser um objeto Date ou um número serial, ou string se o Excel não formatou.
          const dateValueFromExcel = taskData[EXCEL_USER_COLUMNS[2]];
          const dateValidationResult = parseAndValidateDate(dateValueFromExcel);
          if (!dateValidationResult.valid) {
             validationErrors.push({ line: rowIndexForError, field: EXCEL_USER_COLUMNS[2], message: dateValidationResult.error });
             continue;
          }
          const dueDate = dateValidationResult.value;
                    
          const canCreateForObjective = currentUser.group === 'admin' ||
            (currentUser.group === 'product_owner' && objective.responsible_id === currentUser.id) ||
            (currentUser.group === 'scrum_master' && objective.coordinator_scrum_master_id === currentUser.id);

          if (!canCreateForObjective) {
            validationErrors.push({ line: rowIndexForError, field: "Geral", message: `Você não tem permissão para criar tarefas para o objetivo "${objective.title}".` });
            setProcessingFeedback(prev => [...prev, ...validationErrors.map(err => ({ type: 'validation', message: `Linha ${err.line}: [${err.field}] ${err.message}` }))]);
            setIsProcessing(false);
            return;
          }

          tasksToCreate.push({
            title: String(taskData[EXCEL_USER_COLUMNS[0]]).trim(),
            description: String(taskData[EXCEL_USER_COLUMNS[1]] || '').trim(), 
            objective_id: objective.id,
            responsible_id: responsibleUser.id,
            due_date: dueDate,
            status: "Backlog", 
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
        
        setProcessingFeedback(prev => [...prev, { type: 'info', message: `Validado. Tentando criar ${tasksToCreate.length} tarefas para o objetivo "${objective.title}"...` }]);

        const { data: insertedTasks, error: insertError } = await supabase.from('tasks').insert(tasksToCreate).select();

        if (insertError) {
          console.error("Error inserting batch tasks for objective:", insertError);
          setProcessingFeedback(prev => [...prev, { type: 'error', message: `Erro ao criar tarefas: ${insertError.message}` }]);
          setIsProcessing(false);
          return;
        }

        setProcessingFeedback(prev => [...prev, { type: 'success', message: `${insertedTasks.length} tarefas criadas e vinculadas ao objetivo "${objective.title}" com sucesso!` }]);
        toast({ title: "Sucesso!", description: `${insertedTasks.length} tarefas criadas e vinculadas com sucesso ao Objetivo ${objective.title}.` });
        onTasksCreated(); 
      } catch (err) {
        console.error("Error processing Excel file for objective:", err);
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
            As tarefas serão vinculadas ao objetivo: <span className="font-semibold">{objective?.title || "Carregando..."}</span>.
            O status inicial será "Backlog". Use o formato DD/MM/YYYY para datas.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 my-6">
          <div>
            <Label className="text-base font-semibold">1. Baixar Modelo</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Use este modelo para garantir o formato correto. O nome do arquivo será "{MODEL_FILE_NAME}".
            </p>
            <Button variant="outline" onClick={handleDownloadTemplate} className="w-full sm:w-auto" disabled={!objective}>
              <Download className="mr-2 h-4 w-4" /> Baixar Modelo
            </Button>
          </div>

          <div>
            <Label className="text-base font-semibold">2. Selecionar Arquivo e Importar</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Selecione o arquivo .xlsx com os dados das tarefas para este objetivo.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Label htmlFor="objective-batch-task-file-upload" className="flex-grow">
                <div className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed rounded-md cursor-pointer hover:border-primary dark:border-gray-600 dark:hover:border-primary-foreground">
                  <UploadCloud className="w-6 h-6 mr-2 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {fileName || "Clique para selecionar o arquivo Excel"}
                  </span>
                </div>
                <Input 
                  id="objective-batch-task-file-upload" 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden"
                  accept=".xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                />
              </Label>
              <Button onClick={processAndUploadFile} disabled={!selectedFile || isProcessing || !objective} className="w-full sm:w-auto">
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                {isProcessing ? "Processando..." : "Selecionar Arquivo e Importar"}
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

export default ObjectiveBatchTaskUploadModal;
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const ChartModal = ({ isOpen, onClose, title, children }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {isOpen && (
        <DialogContent 
          className="p-0 border-0 bg-card dark:bg-slate-800 text-card-foreground dark:text-slate-100 w-[95vw] h-[90vh] max-w-[1400px] max-h-[900px] flex flex-col overflow-hidden rounded-xl shadow-2xl"
        >
          <DialogHeader className="p-4 border-b border-border dark:border-slate-700 flex flex-row items-center justify-between space-y-0 shrink-0">
            <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </DialogClose>
          </DialogHeader>
          <div className="flex-grow p-6 overflow-auto">
            {children}
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
};

export default ChartModal;
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Target, Edit, Save, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const ObjectiveTag = ({ objectiveId, initialTag, onUpdate, canEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tag, setTag] = useState(initialTag || '');
  const { toast } = useToast();

  useEffect(() => {
    setTag(initialTag || '');
  }, [initialTag]);

  const handleSave = async () => {
    if (tag === initialTag) {
      setIsEditing(false);
      return;
    }
    try {
      await onUpdate(objectiveId, tag);
      toast({ title: "Etiqueta atualizada com sucesso!" });
      setIsEditing(false);
    } catch (error) {
      toast({ title: "Erro ao atualizar etiqueta", description: error.message, variant: "destructive" });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    }
    if (e.key === 'Escape') {
      setTag(initialTag || '');
      setIsEditing(false);
    }
  };

  if (!canEdit && !initialTag) {
    return null;
  }

  return (
    <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs text-muted-foreground flex items-center gap-2">
      <Target className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" />
      {isEditing ? (
        <div className="flex items-center gap-1 w-full">
          <Input
            type="text"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            placeholder="Adicionar etiqueta..."
            className="h-7 text-xs"
            autoFocus
          />
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleSave}>
            <Save className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setTag(initialTag || ''); setIsEditing(false); }}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 group w-full cursor-pointer" onClick={() => canEdit && setIsEditing(true)}>
          <span className="italic truncate" title={tag || "Nenhuma etiqueta"}>
            {tag || (canEdit ? "Adicionar etiqueta..." : "Nenhuma etiqueta")}
          </span>
          {canEdit && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Edit className="h-3.5 w-3.5" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ObjectiveTag;
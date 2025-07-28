import React from 'react';
    import { useAuth } from '@/contexts/AuthContext';
    import KanbanColumn from '@/components/dashboard/KanbanColumn';
    import { useObjectiveOperations } from '@/hooks/useObjectiveOperations';
    import { DragDropContext } from 'react-beautiful-dnd';
    import { useToast } from '@/components/ui/use-toast';
    import DashboardFilter from '@/components/dashboard/DashboardFilter';
    
    const DashboardPage = () => {
      const { currentUser } = useAuth();
      const { toast } = useToast();
      const {
        objectives,
        users,
        filters,
        setFilters,
        clearFilters,
        loading,
        updateObjectiveStatus,
        updateObjectiveTag,
      } = useObjectiveOperations();
    
      const onDragEnd = async (result) => {
        const { destination, source, draggableId } = result;
    
        if (!destination) {
          return;
        }
    
        if (
          destination.droppableId === source.droppableId &&
          destination.index === source.index
        ) {
          return;
        }
    
        const newStatus = destination.droppableId;
        const success = await updateObjectiveStatus(draggableId, newStatus);
    
        if (success) {
          toast({
            title: "Objetivo Atualizado!",
            description: `O objetivo foi movido para "${newStatus}".`,
            variant: "success",
          });
        } else {
          toast({
            title: "Erro ao Mover Objetivo",
            description: "Não foi possível atualizar o status do objetivo. Tente novamente.",
            variant: "destructive",
          });
        }
      };
    
      const handleTagUpdate = async (objectiveId, newTag) => {
        const success = await updateObjectiveTag(objectiveId, newTag);
        if (success) {
          toast({
            title: "Etiqueta Atualizada!",
            description: "A etiqueta do objetivo foi salva.",
            variant: "success",
          });
        } else {
          toast({
            title: "Erro ao Atualizar Etiqueta",
            description: "Não foi possível salvar a etiqueta. Tente novamente.",
            variant: "destructive",
          });
        }
      };
    
      const usersList = users || [];
      const productOwners = usersList.filter(u => u.user_group === 'product_owner');
      const scrumMasters = usersList.filter(u => u.user_group === 'scrum_master');
    
      const objectivesList = objectives || [];
    
      const columns = {
        'Não Iniciado': objectivesList.filter(obj => obj.status === 'Não Iniciado'),
        'Em Progresso': objectivesList.filter(obj => obj.status === 'Em Progresso'),
        'Concluído': objectivesList.filter(obj => obj.status === 'Concluído'),
      };
    
      return (
        <>
          <DashboardFilter
            productOwners={productOwners}
            scrumMasters={scrumMasters}
            filters={filters}
            onFilterChange={setFilters}
            onClearFilters={clearFilters}
          />
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <p className="text-lg text-gray-500">Carregando objetivos...</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 h-full">
                {Object.entries(columns).map(([status, objectivesInColumn]) => (
                  <KanbanColumn
                    key={status}
                    title={status}
                    objectives={objectivesInColumn}
                    allUsers={usersList}
                    currentUser={currentUser}
                    onUpdateObjectiveTag={handleTagUpdate}
                  />
                ))}
              </div>
            </DragDropContext>
          )}
        </>
      );
    };
    
    export default DashboardPage;
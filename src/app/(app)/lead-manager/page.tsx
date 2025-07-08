
'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { getLeads, addLead, updateLead, deleteLead, type Lead, type LeadData, type LeadStatus } from '@/services/leads';
import { AddLeadDialog } from '@/components/leads/add-lead-dialog';
import { EditLeadDialog } from '@/components/leads/edit-lead-dialog';
import { LeadKanbanBoard } from '@/components/leads/lead-kanban-board';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';


export default function LeadManagerPage() {
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [user, setUser] = React.useState(auth.currentUser);
  const { toast } = useToast();
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  
  // Data for dialogs
  const [editingLead, setEditingLead] = React.useState<Lead | null>(null);
  const [deletingLead, setDeletingLead] = React.useState<Lead | null>(null);

  React.useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  React.useEffect(() => {
    if (user) {
      setIsLoading(true);
      const unsubscribe = getLeads(user.uid, (fetchedLeads) => {
        setLeads(fetchedLeads);
        setIsLoading(false);
      });
      return () => unsubscribe();
    } else {
      setLeads([]);
      setIsLoading(false);
    }
  }, [user]);

  const handleAddLead = async (leadData: LeadData) => {
    if (!user) {
        toast({ variant: "destructive", title: "Error", description: "You must be logged in." });
        return;
    }
    try {
        await addLead(user.uid, leadData);
        toast({ title: "Success!", description: "Lead added successfully." });
        setIsAddDialogOpen(false);
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: (error as Error).message });
    }
  };

  const openEditDialog = (lead: Lead) => {
    setEditingLead(lead);
    setIsEditDialogOpen(true);
  };
  
  const handleUpdateLead = async (leadId: string, data: Partial<LeadData>) => {
    if (!user) return;
    try {
      await updateLead(user.uid, leadId, data);
      toast({ title: 'Success!', description: 'Lead updated successfully.' });
      setIsEditDialogOpen(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
    }
  };

  const handleUpdateLeadStatus = async (leadId: string, status: LeadStatus) => {
    if (!user) return;
    try {
      await updateLead(user.uid, leadId, { status });
      toast({ title: 'Lead Moved', description: `Lead status updated to "${status}".` });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
    }
  };

  const openDeleteDialog = (lead: Lead) => {
    setDeletingLead(lead);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteLead = async () => {
    if (!user || !deletingLead) return;
    try {
      await deleteLead(user.uid, deletingLead.id);
      toast({ title: 'Success', description: 'Lead deleted successfully.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingLead(null);
    }
  };


  return (
    <>
      <PageHeader title="Lead Manager" description="Visualize and manage your sales pipeline.">
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusCircle className="mr-2" />
          Add Lead
        </Button>
      </PageHeader>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <LeadKanbanBoard 
            leads={leads}
            onEditLead={openEditDialog}
            onDeleteLead={openDeleteDialog}
            onUpdateLeadStatus={handleUpdateLeadStatus}
        />
      )}

      <AddLeadDialog 
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddLead={handleAddLead}
      />

      <EditLeadDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onUpdateLead={handleUpdateLead}
        lead={editingLead}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete the lead "{deletingLead?.name}". This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteLead} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { getLeads, addLead, type Lead, type LeadData } from '@/services/leads';
import { AddLeadDialog } from '@/components/leads/add-lead-dialog';
import { LeadKanbanBoard } from '@/components/leads/lead-kanban-board';

export default function LeadManagerPage() {
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [user, setUser] = React.useState(auth.currentUser);
  const { toast } = useToast();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);

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
        <LeadKanbanBoard leads={leads} />
      )}

      <AddLeadDialog 
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddLead={handleAddLead}
      />
    </>
  );
}

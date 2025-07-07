'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { PlusCircle, Loader2 } from 'lucide-react';
import { AddRecipientListDialog } from '@/components/add-recipient-list-dialog';
import { auth } from '@/lib/firebase';
import { getRecipientLists, addRecipientList } from '@/services/recipients';
import type { RecipientList } from '@/services/recipients';
import { useToast } from '@/hooks/use-toast';

export default function RecipientsPage() {
  const [recipientLists, setRecipientLists] = React.useState<RecipientList[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [user, setUser] = React.useState(auth.currentUser);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  React.useEffect(() => {
    if (user) {
      setIsLoading(true);
      const unsubscribe = getRecipientLists(user.uid, (fetchedLists) => {
        setRecipientLists(fetchedLists);
        setIsLoading(false);
      });
      return () => unsubscribe();
    } else {
      setRecipientLists([]);
      setIsLoading(false);
    }
  }, [user]);

  const handleAddList = async (list: { name: string; description: string; emails: string[] }) => {
    if (!user) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "You must be logged in to add a list.",
        });
        return;
    }
    try {
        await addRecipientList(user.uid, { name: list.name, description: list.description, emails: list.emails });
        toast({
            title: "Success!",
            description: "Recipient list added successfully.",
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to add recipient list.",
        });
        console.error(error);
    }
  };

  return (
    <>
      <PageHeader
        title="Recipient Lists"
        description="Manage your audience by grouping them into lists."
      >
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusCircle className="mr-2" />
          Add List
        </Button>
      </PageHeader>
      {isLoading ? (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : recipientLists.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold">No Recipient Lists Found</h3>
          <p className="text-muted-foreground mt-2">Get started by creating your first list.</p>
          <Button onClick={() => setIsAddDialogOpen(true)} className="mt-4">
            <PlusCircle className="mr-2" />
            Add List
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recipientLists.map((list) => (
            <Card key={list.id}>
              <CardHeader>
                <CardTitle>{list.name}</CardTitle>
                <CardDescription>{list.count.toLocaleString()} recipients</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{list.description || 'No description provided.'}</p>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button variant="outline">Manage</Button>
                <Button>Send To</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      <AddRecipientListDialog 
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddList={handleAddList}
      />
    </>
  );
}


'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PageHeader } from '@/components/page-header';
import { PlusCircle, Loader2, MoreVertical, Trash2, Edit, Send, Eye } from 'lucide-react';
import { AddRecipientListDialog } from '@/components/add-recipient-list-dialog';
import { EditRecipientListDialog } from '@/components/edit-recipient-list-dialog';
import { auth } from '@/lib/firebase';
import { getRecipientLists, addRecipientList, updateRecipientList, deleteRecipientList } from '@/services/recipients';
import type { RecipientList } from '@/services/recipients';
import { useToast } from '@/hooks/use-toast';

export default function RecipientsPage() {
  const [recipientLists, setRecipientLists] = React.useState<RecipientList[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [user, setUser] = React.useState(auth.currentUser);
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  // State for actions
  const [editingList, setEditingList] = React.useState<RecipientList | null>(null);
  const [deletingList, setDeletingList] = React.useState<RecipientList | null>(null);

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

  // ADD
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
            description: (error as Error).message || "Failed to add recipient list.",
        });
        console.error(error);
    }
  };

  // EDIT
  const openEditDialog = (list: RecipientList) => {
    setEditingList(list);
    setIsEditDialogOpen(true);
  };
  
  const handleUpdateList = async (listId: string, data: { name: string; description: string }) => {
    if (!user) return;
    try {
        await updateRecipientList(user.uid, listId, data);
        toast({ title: 'Success!', description: 'Recipient list updated.' });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
    }
  };

  // DELETE
  const openDeleteDialog = (list: RecipientList) => {
    setDeletingList(list);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteList = async () => {
    if (!user || !deletingList) return;
    try {
        await deleteRecipientList(user.uid, deletingList.id);
        toast({ title: 'Success!', description: `List "${deletingList.name}" deleted.` });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
    } finally {
        setDeletingList(null);
        setIsDeleteDialogOpen(false);
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
            <Card key={list.id} className="flex flex-col">
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle>{list.name}</CardTitle>
                  <CardDescription>{list.count.toLocaleString()} recipients</CardDescription>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                           <Link href={`/recipients/${list.id}`}><Eye className="mr-2"/>View / Manage</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(list)}>
                            <Edit className="mr-2"/>Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => openDeleteDialog(list)}>
                           <Trash2 className="mr-2"/>Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-2">{list.description || 'No description provided.'}</p>
              </CardContent>
              <CardFooter>
                 <Button asChild className="w-full">
                  <Link href={`/campaigns/new?recipientListId=${list.id}`}>
                    <Send className="mr-2" />
                    Send To This List
                  </Link>
                </Button>
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
      <EditRecipientListDialog 
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onUpdateList={handleUpdateList}
        list={editingList}
      />
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the recipient list
                    <span className="font-semibold">{` "${deletingList?.name}" `}</span>
                    and all of its recipients.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteList} className="text-destructive-foreground bg-destructive hover:bg-destructive/90">
                    Yes, delete list
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

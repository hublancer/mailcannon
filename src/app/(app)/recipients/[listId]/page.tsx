
'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import { Loader2, ArrowLeft, Trash2, UserPlus } from 'lucide-react';
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
import { auth } from '@/lib/firebase';
import { getRecipientList, getRecipients, deleteRecipientList, deleteRecipient, addRecipientsToList, type RecipientList, type Recipient } from '@/services/recipients';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { AddRecipientsDialog } from '@/components/add-recipients-dialog';

export default function ManageRecipientListPage() {
  const params = useParams();
  const router = useRouter();
  const listId = params.listId as string;

  const [list, setList] = React.useState<RecipientList | null>(null);
  const [recipients, setRecipients] = React.useState<Recipient[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [user, setUser] = React.useState(auth.currentUser);
  const { toast } = useToast();
  
  // Dialog states
  const [isDeleteListDialogOpen, setIsDeleteListDialogOpen] = React.useState(false);
  const [isDeleteRecipientDialogOpen, setIsDeleteRecipientDialogOpen] = React.useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);

  // Data for dialogs
  const [recipientToDelete, setRecipientToDelete] = React.useState<Recipient | null>(null);


  React.useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribeAuth();
  }, [router]);

  React.useEffect(() => {
    if (user && listId) {
      setIsLoading(true);
      const unsubList = getRecipientList(user.uid, listId, (data) => {
        setList(data);
      });
      const unsubRecipients = getRecipients(user.uid, listId, (data) => {
        setRecipients(data);
        setIsLoading(false);
      });

      return () => {
        unsubList();
        unsubRecipients();
      };
    }
  }, [user, listId]);

  const handleDeleteList = async () => {
    if (!user || !list) return;
    try {
        await deleteRecipientList(user.uid, list.id);
        toast({ title: 'Success!', description: `List "${list.name}" has been deleted.` });
        router.push('/recipients');
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
    } finally {
        setIsDeleteListDialogOpen(false);
    }
  };

  const openDeleteRecipientDialog = (recipient: Recipient) => {
    setRecipientToDelete(recipient);
    setIsDeleteRecipientDialogOpen(true);
  };

  const handleDeleteRecipient = async () => {
    if (!user || !listId || !recipientToDelete) return;
    try {
        await deleteRecipient(user.uid, listId, recipientToDelete.id);
        toast({ title: 'Success!', description: `Recipient ${recipientToDelete.email} has been removed.` });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
    } finally {
        setIsDeleteRecipientDialogOpen(false);
        setRecipientToDelete(null);
    }
  };

  const handleAddRecipients = async (emails: string[]) => {
    if (!user || !listId) return;
    try {
        await addRecipientsToList(user.uid, listId, emails);
        toast({ title: 'Success!', description: `New recipients have been added to the list.` });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
    }
  }


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!list) {
    return (
        <>
            <PageHeader title="List Not Found" description="The requested recipient list could not be found." />
            <Button variant="outline" onClick={() => router.push('/recipients')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Lists
            </Button>
        </>
    );
  }

  return (
    <>
      <PageHeader
        title={`Manage: ${list.name}`}
        description={list.description || "View and manage the recipients in this list."}
      >
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/recipients')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Lists
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Recipients
            </Button>
            <Button variant="destructive" onClick={() => setIsDeleteListDialogOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete List
            </Button>
        </div>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Recipients ({recipients.length})</CardTitle>
          <CardDescription>
            A list of all email addresses subscribed to this list.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {recipients.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                    <h3 className="text-xl font-semibold">This List is Empty</h3>
                    <p className="text-muted-foreground mt-2">Add some recipients to get started.</p>
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email Address</TableHead>
                            <TableHead>Date Added</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recipients.map((recipient) => (
                            <TableRow key={recipient.id}>
                                <TableCell className="font-medium">{recipient.email}</TableCell>
                                <TableCell>{recipient.addedAt ? format(recipient.addedAt, 'PPP') : 'N/A'}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" onClick={() => openDeleteRecipientDialog(recipient)}>Remove</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </CardContent>
      </Card>

      {/* Dialog for deleting entire list */}
      <AlertDialog open={isDeleteListDialogOpen} onOpenChange={setIsDeleteListDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the recipient list
                    <span className="font-semibold">{` "${list?.name}" `}</span>
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

      {/* Dialog for deleting single recipient */}
      <AlertDialog open={isDeleteRecipientDialogOpen} onOpenChange={setIsDeleteRecipientDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Remove Recipient?</AlertDialogTitle>
                <AlertDialogDescription>
                    Are you sure you want to remove 
                    <span className="font-semibold">{` ${recipientToDelete?.email} `}</span>
                    from this list? This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteRecipient} className="text-destructive-foreground bg-destructive hover:bg-destructive/90">
                    Yes, remove
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog for adding new recipients */}
      <AddRecipientsDialog 
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddRecipients={handleAddRecipients}
      />
    </>
  );
}

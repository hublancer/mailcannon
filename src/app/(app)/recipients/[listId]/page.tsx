
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
import { getRecipientList, getRecipients, deleteRecipientList, type RecipientList, type Recipient } from '@/services/recipients';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function ManageRecipientListPage() {
  const params = useParams();
  const router = useRouter();
  const listId = params.listId as string;

  const [list, setList] = React.useState<RecipientList | null>(null);
  const [recipients, setRecipients] = React.useState<Recipient[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [user, setUser] = React.useState(auth.currentUser);
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

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
        setIsDeleteDialogOpen(false);
    }
  };


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
            <Button disabled>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Recipients
            </Button>
            <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
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
                                    <Button variant="ghost" size="sm" disabled>Remove</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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
    </>
  );
}

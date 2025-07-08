
'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import { Loader2, ArrowLeft, Trash2, UserPlus } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { getRecipientList, getRecipients, type RecipientList, type Recipient } from '@/services/recipients';
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
            <Button variant="destructive" disabled>
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
    </>
  );
}

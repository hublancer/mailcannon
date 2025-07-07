'use client';

import * as React from 'react';
import { MoreHorizontal, PowerIcon, PlusCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import { AddSmtpAccountDialog } from '@/components/add-smtp-account-dialog';
import { auth } from '@/lib/firebase';
import { getSmtpAccounts, addSmtpAccount } from '@/services/smtp';
import type { SmtpAccount } from '@/services/smtp';
import { useToast } from '@/hooks/use-toast';

export default function SmtpAccountsPage() {
  const [accounts, setAccounts] = React.useState<SmtpAccount[]>([]);
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
      const unsubscribe = getSmtpAccounts(user.uid, (fetchedAccounts) => {
        setAccounts(fetchedAccounts);
        setIsLoading(false);
      });
      return () => unsubscribe();
    } else {
        setAccounts([]);
        setIsLoading(false);
    }
  }, [user]);

  const handleAddAccount = async (account: Omit<SmtpAccount, 'id' | 'status'> & { password?: string }) => {
    if (!user) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "You must be logged in to add an account.",
        });
        return;
    }
    try {
        await addSmtpAccount(user.uid, account);
        toast({
            title: "Success!",
            description: "SMTP Account added successfully.",
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to add SMTP account.",
        });
        console.error(error);
    }
  };

  return (
    <>
      <PageHeader
        title="SMTP Accounts"
        description="Configure and manage your SMTP server accounts for email distribution."
      >
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusCircle className="mr-2" />
          Add Account
        </Button>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Server Accounts</CardTitle>
          <CardDescription>
            Manage your connections to third-party SMTP providers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
              <h3 className="text-xl font-semibold">No SMTP Accounts Configured</h3>
              <p className="text-muted-foreground mt-2">Get started by adding your first SMTP provider.</p>
              <Button onClick={() => setIsAddDialogOpen(true)} className="mt-4">
                Add Your First Account
              </Button>
            </div>
          ) : (
            <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Server</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Port</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.server}</TableCell>
                      <TableCell className="font-mono text-xs">{account.username}</TableCell>
                      <TableCell>{account.port}</TableCell>
                      <TableCell>
                        <Badge variant={account.status === 'Error' ? 'destructive' : account.status === 'Connected' ? 'default' : 'secondary'}>
                          <PowerIcon className={`mr-2 h-3 w-3 ${account.status === 'Connected' ? 'text-green-400' : 'text-red-400'}`} />
                          {account.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem>Test Connection</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <AddSmtpAccountDialog 
        isOpen={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen} 
        onAddAccount={handleAddAccount} 
      />
    </>
  );
}

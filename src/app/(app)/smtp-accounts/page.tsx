
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
import { TestSmtpDialog } from '@/components/test-smtp-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { auth } from '@/lib/firebase';
import { getSmtpAccounts, addSmtpAccount, updateSmtpAccount, deleteSmtpAccount, type SmtpAccount, type SmtpAccountData } from '@/services/smtp';
import { useToast } from '@/hooks/use-toast';
import { sendTestEmail } from '@/app/actions/send-test-email';

export default function SmtpAccountsPage() {
  const [accounts, setAccounts] = React.useState<SmtpAccount[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [user, setUser] = React.useState(auth.currentUser);
  
  // Dialog states
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = React.useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  // State for selected accounts for actions
  const [editingAccount, setEditingAccount] = React.useState<SmtpAccount | null>(null);
  const [testingAccount, setTestingAccount] = React.useState<SmtpAccount | null>(null);
  const [deletingAccount, setDeletingAccount] = React.useState<SmtpAccount | null>(null);

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

  const openAddDialog = () => {
    setEditingAccount(null);
    setIsAddEditDialogOpen(true);
  }

  const openEditDialog = (account: SmtpAccount) => {
    setEditingAccount(account);
    setIsAddEditDialogOpen(true);
  }

  const openTestDialog = (account: SmtpAccount) => {
    setTestingAccount(account);
    setIsTestDialogOpen(true);
  }
  
  const openDeleteDialog = (account: SmtpAccount) => {
    setDeletingAccount(account);
    setIsDeleteDialogOpen(true);
  }

  const handleSaveAccount = async (accountData: SmtpAccountData, accountId?: string) => {
    if (!user) {
        toast({ variant: "destructive", title: "Error", description: "You must be logged in." });
        return;
    }
    try {
        if (accountId) { // Editing existing account
            await updateSmtpAccount(user.uid, accountId, accountData);
            toast({ title: "Success!", description: "SMTP Account updated successfully." });
        } else { // Adding new account
            await addSmtpAccount(user.uid, accountData);
            toast({ title: "Success!", description: "SMTP Account added successfully." });
        }
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: (error as Error).message });
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !deletingAccount) {
        toast({ variant: "destructive", title: "Error", description: "Could not delete account." });
        return;
    }
    try {
        await deleteSmtpAccount(user.uid, deletingAccount.id);
        toast({ title: "Success!", description: `Account ${deletingAccount.server} deleted.` });
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: (error as Error).message });
    } finally {
        setIsDeleteDialogOpen(false);
        setDeletingAccount(null);
    }
  }

  const handleSendTestEmail = async (email: string) => {
    if (!testingAccount) return;
    
    toast({
        title: "Testing Connection...",
        description: `Sending a test email to ${email}.`,
    });

    const result = await sendTestEmail({ smtpAccountId: testingAccount.id, toEmail: email });

    if (result.success) {
        toast({
            title: "Connection Successful!",
            description: "The test email was sent successfully.",
        });
    } else {
        toast({
            variant: "destructive",
            title: "Connection Failed",
            description: result.error || "An unknown error occurred.",
            duration: 9000,
        });
    }
  };

  return (
    <>
      <PageHeader
        title="SMTP Accounts"
        description="Configure and manage your SMTP server accounts for email distribution."
      >
        <Button onClick={openAddDialog}>
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
              <Button onClick={openAddDialog} className="mt-4">
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
                    <TableHead>SSL</TableHead>
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
                      <TableCell>{account.secure ? 'Yes' : 'No'}</TableCell>
                      <TableCell>
                        <Badge variant={account.status === 'Error' ? 'destructive' : account.status === 'Connected' ? 'default' : 'secondary'}>
                          <PowerIcon className={`mr-2 h-3 w-3 ${account.status === 'Connected' ? 'text-green-400' : (account.status === 'Error' ? 'text-red-400' : '')}`} />
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
                            <DropdownMenuItem onSelect={() => openEditDialog(account)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => openTestDialog(account)}>
                              Test Connection
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onSelect={() => openDeleteDialog(account)}>
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
      
      {/* Dialogs */}
      <AddSmtpAccountDialog 
        isOpen={isAddEditDialogOpen} 
        onOpenChange={setIsAddEditDialogOpen} 
        onSaveAccount={handleSaveAccount} 
        account={editingAccount}
      />
      <TestSmtpDialog
        isOpen={isTestDialogOpen}
        onOpenChange={setIsTestDialogOpen}
        onSendTest={handleSendTestEmail}
      />
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the SMTP account
                    for <span className="font-semibold">{deletingAccount?.server}</span>.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAccount} className="text-destructive-foreground bg-destructive hover:bg-destructive/90">
                    Yes, delete account
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

    
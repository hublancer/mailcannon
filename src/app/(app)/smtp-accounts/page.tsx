
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MoreHorizontal, PowerIcon, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/page-header';
import { AddSmtpAccountDialog } from '@/components/add-smtp-account-dialog';
import { TestSmtpDialog } from '@/components/test-smtp-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { auth } from '@/lib/firebase';
import { getSmtpAccounts, addSmtpAccount, updateSmtpAccount, deleteSmtpAccount, type SmtpAccount, type SmtpAccountData } from '@/services/smtp';
import { useToast } from '@/hooks/use-toast';
import { sendTestEmail } from '@/app/actions/send-test-email';
import { testSmtpConnection } from '@/app/actions/test-smtp-connection';

const formSchema = z.object({
  server: z.string().min(1, 'Server is required'),
  port: z.coerce.number().int().min(1, 'Port is required'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  secure: z.boolean().default(true),
  testEmail: z.string().email({ message: "Please enter a valid email for testing." }),
  testMessage: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function SmtpAccountsPage() {
  const [accounts, setAccounts] = React.useState<SmtpAccount[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [user, setUser] = React.useState(auth.currentUser);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  // Dialog states
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = React.useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  // State for selected accounts for actions
  const [editingAccount, setEditingAccount] = React.useState<SmtpAccount | null>(null);
  const [testingAccount, setTestingAccount] = React.useState<SmtpAccount | null>(null);
  const [deletingAccount, setDeletingAccount] = React.useState<SmtpAccount | null>(null);

  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      server: 'smtp.hostinger.com',
      port: 465,
      username: 'info@hublancer.pk',
      password: '0300Ali$',
      secure: true,
      testEmail: 'info@hublancer.pk',
      testMessage: 'This is a test message from MailCannon to confirm the SMTP connection is working!',
    },
  });

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
    if (!user || !accountId) {
        toast({ variant: "destructive", title: "Error", description: "You must be logged in and editing an account." });
        return;
    }

    try {
        await updateSmtpAccount(user.uid, accountId, accountData);
        toast({ title: "Success!", description: "SMTP Account updated successfully." });
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

  const handleTestAndSaveSubmit = async (data: FormValues) => {
    if (!user) {
        toast({ variant: "destructive", title: "Error", description: "You must be logged in." });
        return;
    }
    setIsSubmitting(true);
    
    toast({
        title: "Testing Connection...",
        description: `Verifying credentials for ${data.server}...`,
    });

    const result = await testSmtpConnection(data);

    if (result.success) {
        toast({
            title: "Connection Successful!",
            description: "A test email was sent. Saving account...",
        });
        try {
            // Exclude test fields before saving
            const { testEmail, testMessage, ...accountToSave } = data;
            await addSmtpAccount(user.uid, accountToSave); 
            toast({
                title: "Account Saved!",
                description: "Your SMTP account has been successfully tested and saved.",
            });
            form.reset();
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Failed to save account',
                description: (error as Error).message,
            });
        }
    } else {
        toast({
            variant: "destructive",
            title: "Connection Failed",
            description: result.error || "An unknown error occurred. The account was not saved.",
            duration: 9000,
        });
    }

    setIsSubmitting(false);
  };

  return (
    <>
      <PageHeader
        title="SMTP Accounts"
        description="Configure and manage your SMTP server accounts for email distribution."
      />
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
              <p className="text-muted-foreground mt-2">Get started by adding your first SMTP provider below.</p>
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
      
      <Card className="mt-8">
        <CardHeader>
            <CardTitle>Add New SMTP Account</CardTitle>
            <CardDescription>
                Use this form to add a new account. The system will test the connection before saving.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleTestAndSaveSubmit)} className="space-y-4">
                    <FormField
                    control={form.control}
                    name="server"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Server</FormLabel>
                        <FormControl>
                            <Input placeholder="smtp.example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <div className="grid grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="port"
                        render={({ field }) => (
                        <FormItem className="col-span-1">
                            <FormLabel>Port</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="465" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="secure"
                        render={({ field }) => (
                        <FormItem className="col-span-2 flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-2">
                            <div className="space-y-0.5">
                            <FormLabel>Use SSL/TLS</FormLabel>
                            </div>
                            <FormControl>
                            <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                            </FormControl>
                        </FormItem>
                        )}
                    />
                    </div>
                    <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                            <Input placeholder="your-username" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Password / API Key</FormLabel>
                        <FormControl>
                            <Input type="password" {...field} />
                        </FormControl>
                        <FormDescription>
                            Your password will be stored securely.
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />

                    <hr className="my-6"/>

                    <FormField
                      control={form.control}
                      name="testEmail"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Test Recipient Email</FormLabel>
                          <FormControl>
                              <Input placeholder="recipient@example.com" {...field} />
                          </FormControl>
                          <FormDescription>
                              An email will be sent to this address to verify the connection.
                          </FormDescription>
                          <FormMessage />
                          </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="testMessage"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Test Message (Optional)</FormLabel>
                          <FormControl>
                              <Textarea placeholder="Type a custom message for the test email." {...field} />
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Test & Save Account
                    </Button>
                </form>
            </Form>
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

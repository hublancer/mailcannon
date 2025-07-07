'use client';

import * as React from 'react';
import { MoreHorizontal, PowerIcon, PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import { AddSmtpAccountDialog } from '@/components/add-smtp-account-dialog';

const initialAccounts = [
  { server: 'smtp.mailgun.org', username: 'postmaster@mg.example.com', port: 587, status: 'Connected' },
  { server: 'smtp.sendgrid.net', username: 'apikey', port: 465, status: 'Connected' },
  { server: 'email-smtp.us-east-1.amazonaws.com', username: 'AKIA...', port: 587, status: 'Disconnected' },
  { server: 'smtp.postmarkapp.com', username: 'server-token', port: 587, status: 'Error' },
];

type SmtpAccount = typeof initialAccounts[0];

export default function SmtpAccountsPage() {
  const [accounts, setAccounts] = React.useState(initialAccounts);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);

  const handleAddAccount = (account: SmtpAccount) => {
    setAccounts((prev) => [...prev, account]);
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
                <TableRow key={account.server}>
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

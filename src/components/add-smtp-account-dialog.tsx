'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { type SmtpAccount, type SmtpAccountData } from '@/services/smtp';

const formSchema = z.object({
  server: z.string().min(1, 'Server is required'),
  port: z.coerce.number().int().min(1, 'Port is required'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().optional(),
  secure: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface AddSmtpAccountDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSaveAccount: (account: SmtpAccountData, accountId?: string) => void;
  account?: SmtpAccount | null;
}

export function AddSmtpAccountDialog({ isOpen, onOpenChange, onSaveAccount, account }: AddSmtpAccountDialogProps) {
  const isEditing = !!account;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      server: 'smtp.hostinger.com',
      port: 465,
      username: '',
      password: '',
      secure: true,
    },
  });

  React.useEffect(() => {
    if (account && isOpen) {
      form.reset({
        server: account.server,
        port: account.port,
        username: account.username,
        secure: account.secure,
        password: '',
      });
    } else if (!isOpen) {
      form.reset({
        server: 'smtp.hostinger.com',
        port: 465,
        username: '',
        password: '',
        secure: true,
      });
    }
  }, [account, isOpen, form]);

  const onSubmit = (values: FormValues) => {
    if (isEditing && !values.password) {
      const { password, ...rest } = values;
      onSaveAccount(rest, account?.id);
    } else {
      onSaveAccount(values, account?.id);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit' : 'Add'} SMTP Account</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the details for your SMTP server.' : "Enter the details for your SMTP server. Click save when you're done."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    {isEditing ? "Leave blank to keep the current password." : "Your password will be stored securely."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">{isEditing ? 'Save Changes' : 'Save Account'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

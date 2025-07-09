'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type Lead } from '@/services/leads';
import { type SmtpAccount } from '@/services/smtp';

const formSchema = z.object({
  smtpAccountId: z.string({ required_error: 'Please select an SMTP account.' }),
  subject: z.string().min(3, 'Subject must be at least 3 characters.'),
  message: z.string().min(10, 'Message must be at least 10 characters.'),
});

export type SendLeadEmailFormValues = z.infer<typeof formSchema>;

interface SendLeadEmailDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSendEmail: (data: SendLeadEmailFormValues) => Promise<void>;
  lead: Lead | null;
  smtpAccounts: SmtpAccount[];
}

export function SendLeadEmailDialog({ isOpen, onOpenChange, onSendEmail, lead, smtpAccounts }: SendLeadEmailDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<SendLeadEmailFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      smtpAccountId: smtpAccounts.length > 0 ? smtpAccounts[0].id : undefined,
      subject: '',
      message: '',
    },
  });

  React.useEffect(() => {
    if (!isOpen) {
      form.reset({
        smtpAccountId: smtpAccounts.length > 0 ? smtpAccounts[0].id : undefined,
        subject: '',
        message: '',
      });
      setIsSubmitting(false);
    }
  }, [isOpen, form, smtpAccounts]);

  const onSubmit = async (values: SendLeadEmailFormValues) => {
    setIsSubmitting(true);
    await onSendEmail(values);
    setIsSubmitting(false);
  };
  
  if (!lead) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Send Email to {lead.name}</DialogTitle>
          <DialogDescription>
            Compose and send a direct email to this lead.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormItem>
              <FormLabel>To</FormLabel>
              <FormControl>
                <Input readOnly disabled value={lead.email} />
              </FormControl>
            </FormItem>

            <FormField
              control={form.control}
              name="smtpAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Send Via (SMTP Account)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {smtpAccounts.map(account => (
                        <SelectItem key={account.id} value={account.id}>{account.server} ({account.username})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField control={form.control} name="subject" render={({ field }) => (
              <FormItem>
                <FormLabel>Subject</FormLabel>
                <FormControl><Input placeholder="Following up on our conversation" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="message" render={({ field }) => (
              <FormItem>
                <FormLabel>Message</FormLabel>
                <FormControl><Textarea placeholder={`Hi ${lead.name.split(' ')[0]},\n\n`} className="min-h-[150px]" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting || smtpAccounts.length === 0}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Email
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';
import Papa from 'papaparse';

const formSchema = z.object({
  emails: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddRecipientsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddRecipients: (emails: string[]) => Promise<void>;
}

export function AddRecipientsDialog({ isOpen, onOpenChange, onAddRecipients }: AddRecipientsDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = React.useState('paste');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      emails: '',
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsSubmitting(true);
    Papa.parse<string[]>(file, {
      complete: async (results) => {
        // Assuming emails are in the first column
        const emails = results.data.map(row => row[0]).filter(email => z.string().email().safeParse(email).success);
        if (emails.length > 0) {
            await onAddRecipients(emails);
            toast({ title: "Success!", description: `${emails.length} recipients added from CSV.` });
            onOpenChange(false);
        } else {
            toast({ variant: 'destructive', title: "No valid emails found", description: "The CSV file did not contain any valid email addresses in the first column." });
        }
        setIsSubmitting(false);
      },
      error: (error) => {
        toast({ variant: 'destructive', title: "CSV Parsing Error", description: error.message });
        setIsSubmitting(false);
      }
    });
  };

  const onSubmit = async (values: FormValues) => {
    const pastedEmails = values.emails?.split(/[ ,;\n]+/).map(e => e.trim()).filter(e => z.string().email().safeParse(e).success) ?? [];
    
    if (pastedEmails.length === 0) {
      form.setError('emails', { message: 'Please provide at least one valid email address.' });
      return;
    }
    
    setIsSubmitting(true);
    await onAddRecipients(pastedEmails);
    setIsSubmitting(false);
    onOpenChange(false);
  };
  
  React.useEffect(() => {
    if (!isOpen) {
        form.reset();
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }
  }, [isOpen, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add More Recipients</DialogTitle>
          <DialogDescription>
            Paste a list of emails or upload a CSV file. Duplicates will be ignored by Firestore.
          </DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="paste">Paste Emails</TabsTrigger>
            <TabsTrigger value="upload">Upload CSV</TabsTrigger>
            </TabsList>
            <TabsContent value="paste">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="emails"
                            render={({ field }) => (
                                <FormItem className="mt-4">
                                <FormLabel>Emails</FormLabel>
                                <FormControl>
                                    <Textarea
                                    placeholder="user1@example.com, user2@example.com, ..."
                                    className="min-h-[150px]"
                                    {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Enter a comma, space, or new-line separated list of emails.
                                </FormDescription>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Add Pasted Emails
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </TabsContent>
            <TabsContent value="upload">
                <div className="mt-4 flex flex-col items-center justify-center space-y-4 p-6 border-2 border-dashed rounded-lg">
                    <Upload className="h-10 w-10 text-muted-foreground" />
                    <p className="text-center text-muted-foreground">Click the button to upload a CSV file. <br /> (Emails in the first column)</p>
                    <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={isSubmitting}>
                        {isSubmitting ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                        ) : (
                            'Select CSV File'
                        )}
                    </Button>
                    <Input 
                        ref={fileInputRef}
                        type="file" 
                        accept=".csv"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </div>
            </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

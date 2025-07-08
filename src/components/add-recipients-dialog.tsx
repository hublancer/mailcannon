'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Papa from 'papaparse';
import { Loader2, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  pastedEmails: z.string().optional(),
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

  // State for CSV parsing
  const [csvEmails, setCsvEmails] = React.useState<string[]>([]);
  const [csvFileName, setCsvFileName] = React.useState('');
  const [isParsing, setIsParsing] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pastedEmails: '',
    },
  });

  const resetState = () => {
    form.reset();
    setActiveTab('paste');
    setCsvEmails([]);
    setCsvFileName('');
    setIsSubmitting(false);
    setIsParsing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetState();
    }
    onOpenChange(open);
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvEmails([]);
    setCsvFileName(file.name);
    setIsParsing(true);

    Papa.parse<string[]>(file, {
      complete: (results) => {
        const emails = results.data
          .map(row => row[0])
          .filter(email => z.string().email().safeParse(email).success);
        
        setCsvEmails(emails);
        setIsParsing(false);
        if (emails.length > 0) {
          toast({ title: "CSV Parsed", description: `Found ${emails.length} valid emails in "${file.name}".` });
        } else {
          toast({ variant: 'destructive', title: "No valid emails found", description: "The CSV did not contain any valid email addresses in the first column." });
        }
      },
      error: (error) => {
        toast({ variant: 'destructive', title: "CSV Parsing Error", description: error.message });
        setIsParsing(false);
      }
    });
  };

  const handleAddPastedEmails = async (values: FormValues) => {
    const pastedEmails = values.pastedEmails?.split(/[ ,;\n]+/).map(e => e.trim()).filter(e => z.string().email().safeParse(e).success) ?? [];
    
    if (pastedEmails.length === 0) {
      form.setError('pastedEmails', { message: 'Please paste at least one valid email address.' });
      return;
    }
    
    setIsSubmitting(true);
    await onAddRecipients(pastedEmails);
    setIsSubmitting(false);
    handleOpenChange(false);
  };

  const handleAddCsvEmails = async () => {
    if (csvEmails.length === 0) {
      toast({ variant: 'destructive', title: 'No Emails to Add', description: 'Please upload a CSV with valid emails first.' });
      return;
    }

    setIsSubmitting(true);
    await onAddRecipients(csvEmails);
    setIsSubmitting(false);
    handleOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add More Recipients</DialogTitle>
          <DialogDescription>
            Paste a list of emails or upload a CSV file. Duplicates will be ignored.
          </DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-grow flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-2 shrink-0">
              <TabsTrigger value="paste">Paste Emails</TabsTrigger>
              <TabsTrigger value="upload">Upload CSV</TabsTrigger>
            </TabsList>
            <TabsContent value="paste" className="pt-2 flex-grow">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleAddPastedEmails)} className="space-y-4 h-full flex flex-col">
                        <div className="flex-grow overflow-y-auto pr-6 space-y-4">
                            <FormField
                                control={form.control}
                                name="pastedEmails"
                                render={({ field }) => (
                                    <FormItem className="mt-4">
                                    <FormLabel className="sr-only">Pasted Emails</FormLabel>
                                    <FormControl>
                                        <Textarea
                                        placeholder="user1@example.com, user2@example.com, ..."
                                        className="min-h-[200px]"
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
                        </div>
                        <DialogFooter className="pt-4 shrink-0">
                            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Add Pasted Emails
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </TabsContent>
            <TabsContent value="upload" className="pt-2 flex-grow">
                <div className="h-full flex flex-col">
                    <div className="flex-grow overflow-y-auto pr-6 space-y-4">
                        <div className="flex flex-col items-center justify-center space-y-3 p-4 border-2 border-dashed rounded-lg">
                            <Upload className="h-8 w-8 text-muted-foreground" />
                            <p className="text-center text-sm text-muted-foreground">Upload a CSV file with emails in the first column.</p>
                            <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={isParsing}>
                                {isParsing ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Parsing...</>
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
                        {csvEmails.length > 0 && (
                            <div className="mt-4">
                                <div className='flex justify-between items-center mb-2'>
                                    <h4 className="font-medium">Parsed Emails from <span className='font-normal italic'>{csvFileName}</span></h4>
                                    <Badge variant="secondary">{csvEmails.length} emails</Badge>
                                </div>
                                <ScrollArea className="h-40 w-full rounded-md border p-2">
                                    <div className="text-sm">
                                        {csvEmails.map((email, index) => (
                                            <p key={index} className="truncate">{email}</p>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        )}
                    </div>

                    {csvEmails.length > 0 && (
                         <DialogFooter className="pt-4 shrink-0">
                             <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button type="button" onClick={handleAddCsvEmails} disabled={isSubmitting || csvEmails.length === 0}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Add {csvEmails.length} Emails
                            </Button>
                        </DialogFooter>
                    )}
                </div>
            </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

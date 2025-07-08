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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';

// Form schema now only validates the text fields, email validation will be handled separately.
const formSchema = z.object({
  name: z.string().min(1, 'List name is required'),
  description: z.string().optional(),
  pastedEmails: z.string().optional(), // For the paste tab
});

type FormValues = z.infer<typeof formSchema>;

interface AddRecipientListDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddList: (list: { name: string; description: string; emails: string[] }) => void;
}

export function AddRecipientListDialog({ isOpen, onOpenChange, onAddList }: AddRecipientListDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState('paste');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // State for CSV parsing
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [csvEmails, setCsvEmails] = React.useState<string[]>([]);
  const [csvFileName, setCsvFileName] = React.useState('');
  const [isParsing, setIsParsing] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
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
          .map(row => row[0]) // Assume email is in the first column
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

  const onSubmit = (values: FormValues) => {
    let emailArray: string[] = [];

    if (activeTab === 'paste') {
      emailArray = values.pastedEmails?.split(/[ ,;\n]+/).map(e => e.trim()).filter(e => z.string().email().safeParse(e).success) ?? [];
      if (emailArray.length === 0) {
        form.setError('pastedEmails', { message: 'Please paste at least one valid email.' });
        return;
      }
    } else if (activeTab === 'upload') {
      emailArray = csvEmails;
       if (emailArray.length === 0) {
        toast({ variant: 'destructive', title: 'No Emails to Add', description: 'Please upload a CSV with valid emails first.' });
        return;
      }
    }
    
    setIsSubmitting(true);
    onAddList({ name: values.name, description: values.description || '', emails: emailArray });
    setIsSubmitting(false);
    handleOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add New Recipient List</DialogTitle>
          <DialogDescription>
            Create a new list by giving it a name and adding recipients.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form id="add-list-form" onSubmit={form.handleSubmit(onSubmit)} className="flex-grow overflow-y-auto pr-6 space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>List Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Q4 Leads" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="A short description of this list" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormLabel>Add Recipients</FormLabel>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="paste">Paste Emails</TabsTrigger>
                <TabsTrigger value="upload">Upload CSV</TabsTrigger>
              </TabsList>
              <TabsContent value="paste" className="pt-2">
                <FormField
                  control={form.control}
                  name="pastedEmails"
                  render={({ field }) => (
                    <FormItem>
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
              </TabsContent>
              <TabsContent value="upload" className="pt-2">
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
              </TabsContent>
            </Tabs>
          </form>
        </Form>
        <DialogFooter className="pt-4 border-t shrink-0">
           <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button form="add-list-form" type="submit" disabled={isSubmitting || isParsing}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create List
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

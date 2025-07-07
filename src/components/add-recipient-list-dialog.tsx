'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const formSchema = z.object({
  name: z.string().min(1, 'List name is required'),
  description: z.string().optional(),
  emails: z.string().refine((val) => val.split(',').every(email => z.string().email().safeParse(email.trim()).success), {
    message: 'Please provide a valid, comma-separated list of emails.',
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface AddRecipientListDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddList: (list: { name: string; description: string; count: number }) => void;
}

export function AddRecipientListDialog({ isOpen, onOpenChange, onAddList }: AddRecipientListDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      emails: '',
    },
  });

  const onSubmit = (values: FormValues) => {
    const emailCount = values.emails.split(',').filter(e => e.trim()).length;
    onAddList({ name: values.name, description: values.description || '', count: emailCount });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Recipient List</DialogTitle>
          <DialogDescription>
            Create a new list by uploading a CSV or pasting emails.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            <Tabs defaultValue="paste" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="paste">Paste Emails</TabsTrigger>
                <TabsTrigger value="upload" disabled>Upload CSV</TabsTrigger>
              </TabsList>
              <TabsContent value="paste">
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
                        Enter a comma-separated list of email addresses.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
               <TabsContent value="upload">
                    {/* CSV Upload UI would go here */}
               </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button type="submit">Create List</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { RecipientList } from '@/services/recipients';

const formSchema = z.object({
  name: z.string().min(1, 'List name is required'),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditRecipientListDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUpdateList: (listId: string, data: { name: string; description: string }) => void;
  list: RecipientList | null;
}

export function EditRecipientListDialog({ isOpen, onOpenChange, onUpdateList, list }: EditRecipientListDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  React.useEffect(() => {
    if (list && isOpen) {
      form.reset({
        name: list.name,
        description: list.description,
      });
    } else if (!isOpen) {
        form.reset();
    }
  }, [list, isOpen, form]);

  const onSubmit = (values: FormValues) => {
    if (list) {
      onUpdateList(list.id, { name: values.name, description: values.description || '' });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Recipient List</DialogTitle>
          <DialogDescription>
            Update the name and description for this list.
          </DialogDescription>
        </DialogHeader>
        {list && (
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
                <DialogFooter>
                <Button type="submit">Save Changes</Button>
                </DialogFooter>
            </form>
            </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

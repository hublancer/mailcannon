
'use client'

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { addPlan, updatePlan, type Plan, type PlanData } from '@/services/plans';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(3, 'Plan name must be at least 3 characters.'),
  durationDays: z.coerce.number().int().min(1, 'Duration must be at least 1 day.'),
  smtpAccountLimit: z.coerce.number().int().min(1, 'SMTP limit must be at least 1.'),
  price: z.coerce.number().min(0, 'Price cannot be negative.'),
});

type FormValues = z.infer<typeof formSchema>;

interface AddEditPlanDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  plan: Plan | null;
}

export function AddEditPlanDialog({ isOpen, onOpenChange, plan }: AddEditPlanDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const isEditing = !!plan;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      durationDays: 30,
      smtpAccountLimit: 1,
      price: 10,
    },
  });

  React.useEffect(() => {
    if (plan && isOpen) {
      form.reset(plan);
    } else if (!isOpen) {
      form.reset();
    }
  }, [plan, isOpen, form]);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      if (isEditing) {
        await updatePlan(plan.id, values);
        toast({ title: 'Success', description: 'Plan updated successfully.' });
      } else {
        await addPlan(values as PlanData);
        toast({ title: 'Success', description: 'New plan created.' });
      }
      onOpenChange(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Plan' : 'Add New Plan'}</DialogTitle>
          <DialogDescription>
            Fill in the details for the subscription plan.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Plan Name</FormLabel>
                <FormControl><Input placeholder="e.g., Basic Plan" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="price" render={({ field }) => (
              <FormItem>
                <FormLabel>Price ($)</FormLabel>
                <FormControl><Input type="number" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="durationDays" render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (in days)</FormLabel>
                <FormControl><Input type="number" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="smtpAccountLimit" render={({ field }) => (
              <FormItem>
                <FormLabel>SMTP Account Limit</FormLabel>
                <FormControl><Input type="number" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Save Changes' : 'Create Plan'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

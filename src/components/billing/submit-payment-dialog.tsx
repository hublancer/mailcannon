
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { submitPayment } from '@/services/payments';
import type { Plan } from '@/services/plans';
import { Loader2 } from 'lucide-react';
import { Separator } from '../ui/separator';

const formSchema = z.object({
  transactionId: z.string().min(5, 'Transaction ID must be at least 5 characters.'),
});

type FormValues = z.infer<typeof formSchema>;

interface SubmitPaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  plan: Plan;
  userId: string;
}

export function SubmitPaymentDialog({ isOpen, onOpenChange, plan, userId }: SubmitPaymentDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const pkrPrice = plan.price * 285;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      transactionId: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      await submitPayment(userId, plan, values.transactionId);
      toast({ title: 'Success', description: 'Your payment has been submitted for review.' });
      onOpenChange(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
    } finally {
        setIsSubmitting(false);
    }
  };

  React.useEffect(() => {
    if(!isOpen) {
        form.reset();
    }
  }, [isOpen, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Activate "{plan.name}" Plan</DialogTitle>
          <DialogDescription>
            To activate your plan, please make a payment and submit the transaction ID below.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
            <div className="p-4 border rounded-lg bg-secondary/50">
                <h4 className="font-semibold mb-2">Payment Instructions</h4>
                <div className="space-y-1 text-sm">
                    <p><strong>Bank:</strong> Sadapay</p>
                    <p><strong>Account Name:</strong> Abdul Wahab</p>
                    <p><strong>Account Number:</strong> 03406333938</p>
                    <Separator className="my-2" />
                    <p><strong>Total Amount:</strong> ${plan.price} USD</p>
                    <p className="font-bold">Total in PKR: Rs {pkrPrice.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground pt-1">(Using conversion rate of 1 USD = 285 PKR)</p>
                </div>
            </div>

            <p className="text-xs text-center text-muted-foreground">
                After making the payment, enter the transaction ID below for verification. Your 24-hour free trial will continue until an admin approves your payment.
            </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="transactionId" render={({ field }) => (
              <FormItem>
                <FormLabel>Transaction ID / Reference</FormLabel>
                <FormControl><Input placeholder="e.g., TRF123456789" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit for Approval
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

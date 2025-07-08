
'use client'

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getPayments, approvePayment, rejectPayment, type Payment } from '@/services/payments';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function AdminPaymentsPage() {
    const [payments, setPayments] = React.useState<Payment[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isProcessing, setIsProcessing] = React.useState<string | null>(null);
    const { toast } = useToast();

    React.useEffect(() => {
        const unsubscribe = getPayments((fetchedPayments) => {
            setPayments(fetchedPayments);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleApprove = async (paymentId: string) => {
        setIsProcessing(paymentId);
        try {
            await approvePayment(paymentId);
            toast({ title: 'Success', description: 'Payment approved and subscription activated.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
        } finally {
            setIsProcessing(null);
        }
    };

    const handleReject = async (paymentId: string) => {
        setIsProcessing(paymentId);
        try {
            await rejectPayment(paymentId);
            toast({ title: 'Success', description: 'Payment has been rejected.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
        } finally {
            setIsProcessing(null);
        }
    };

    const getStatusBadgeVariant = (status?: string) => {
        switch (status) {
            case 'approved':
                return 'default';
            case 'pending':
                return 'secondary';
            case 'rejected':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    return (
        <>
            <PageHeader
                title="Manage Payments"
                description="Approve or reject user payment submissions."
            />
            <Card>
                <CardHeader>
                    <CardTitle>Payment Submissions</CardTitle>
                    <CardDescription>Review all pending and processed payments.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User Email</TableHead>
                                    <TableHead>Plan</TableHead>
                                    <TableHead>Transaction ID</TableHead>
                                    <TableHead>Submitted At</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.map((payment) => (
                                    <TableRow key={payment.id}>
                                        <TableCell className="font-medium">{payment.userEmail}</TableCell>
                                        <TableCell>{payment.planName} (${payment.price})</TableCell>
                                        <TableCell className="font-mono text-xs">{payment.transactionId}</TableCell>
                                        <TableCell>{payment.submittedAt ? format(payment.submittedAt, 'Pp') : 'N/A'}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusBadgeVariant(payment.status)}>{payment.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {payment.status === 'pending' && (
                                                <div className="flex gap-2 justify-end">
                                                    <Button size="sm" onClick={() => handleApprove(payment.id)} disabled={isProcessing === payment.id}>
                                                        {isProcessing === payment.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                        Approve
                                                    </Button>
                                                    <Button size="sm" variant="destructive" onClick={() => handleReject(payment.id)} disabled={isProcessing === payment.id}>
                                                        Reject
                                                    </Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </>
    );
}


'use client'

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, MoreHorizontal, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { getPlans, deletePlan, type Plan } from '@/services/plans';
import { AddEditPlanDialog } from '@/components/admin/add-edit-plan-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function AdminPlansPage() {
    const [plans, setPlans] = React.useState<Plan[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const { toast } = useToast();

    // Dialog states
    const [isAddEditDialogOpen, setIsAddEditDialogOpen] = React.useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
    
    // Data for dialogs
    const [editingPlan, setEditingPlan] = React.useState<Plan | null>(null);
    const [deletingPlan, setDeletingPlan] = React.useState<Plan | null>(null);

    React.useEffect(() => {
        setIsLoading(true);
        const unsubscribe = getPlans((fetchedPlans) => {
            setPlans(fetchedPlans);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const openAddDialog = () => {
        setEditingPlan(null);
        setIsAddEditDialogOpen(true);
    };

    const openEditDialog = (plan: Plan) => {
        setEditingPlan(plan);
        setIsAddEditDialogOpen(true);
    };

    const openDeleteDialog = (plan: Plan) => {
        setDeletingPlan(plan);
        setIsDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!deletingPlan) return;
        try {
            await deletePlan(deletingPlan.id);
            toast({ title: 'Success', description: 'Plan deleted successfully.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
        } finally {
            setIsDeleteDialogOpen(false);
            setDeletingPlan(null);
        }
    };

    return (
        <>
            <PageHeader title="Manage Plans" description="Create, edit, and delete subscription plans.">
                <Button onClick={openAddDialog}>
                    <PlusCircle className="mr-2" />
                    Add Plan
                </Button>
            </PageHeader>
            <Card>
                <CardHeader>
                    <CardTitle>Subscription Plans</CardTitle>
                    <CardDescription>A list of all available plans for users.</CardDescription>
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
                                    <TableHead>Plan Name</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Duration (Days)</TableHead>
                                    <TableHead>SMTP Accounts</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {plans.map((plan) => (
                                    <TableRow key={plan.id}>
                                        <TableCell className="font-medium">{plan.name}</TableCell>
                                        <TableCell>${plan.price}</TableCell>
                                        <TableCell>{plan.durationDays}</TableCell>
                                        <TableCell>{plan.smtpAccountLimit}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => openEditDialog(plan)}>Edit</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive" onClick={() => openDeleteDialog(plan)}>Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <AddEditPlanDialog 
                isOpen={isAddEditDialogOpen}
                onOpenChange={setIsAddEditDialogOpen}
                plan={editingPlan}
            />

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the plan "{deletingPlan?.name}". This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

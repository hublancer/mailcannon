
'use client'

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, MoreHorizontal, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { getAllUsers, banUser, unbanUser, UserProfile } from '@/services/users';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function AdminUsersPage() {
    const [users, setUsers] = React.useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const { toast } = useToast();

    const [isBanUnbanDialogOpen, setIsBanUnbanDialogOpen] = React.useState(false);
    const [processingUser, setProcessingUser] = React.useState<UserProfile | null>(null);

    React.useEffect(() => {
        const fetchUsers = async () => {
            setIsLoading(true);
            try {
                const fetchedUsers = await getAllUsers();
                setUsers(fetchedUsers);
            } catch (error) {
                console.error("Error fetching users:", error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Could not fetch user data. You may not have the required permissions.'
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, [toast]);
    
    const openBanUnbanDialog = (user: UserProfile) => {
        setProcessingUser(user);
        setIsBanUnbanDialogOpen(true);
    };

    const handleBanUnbanUser = async () => {
        if (!processingUser) return;
    
        try {
            if (processingUser.isBanned) {
                await unbanUser(processingUser.uid);
                toast({ title: 'Success', description: `User ${processingUser.email} has been unbanned.` });
            } else {
                await banUser(processingUser.uid);
                toast({ title: 'Success', description: `User ${processingUser.email} has been banned.` });
            }
            // Refresh the user list
            const fetchedUsers = await getAllUsers();
            setUsers(fetchedUsers);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
        } finally {
            setIsBanUnbanDialogOpen(false);
            setProcessingUser(null);
        }
    };


    const getStatusBadgeVariant = (status?: string) => {
        switch (status) {
            case 'active':
                return 'default';
            case 'trial':
                return 'secondary';
            case 'pending':
                return 'outline';
            case 'rejected':
                return 'destructive';
            default:
                return 'secondary';
        }
    };

    return (
        <>
            <PageHeader
                title="Manage Users"
                description="View and manage all registered users."
            />
            <Card>
                <CardHeader>
                    <CardTitle>User List</CardTitle>
                    <CardDescription>A list of all users in the system.</CardDescription>
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
                                    <TableHead>Email</TableHead>
                                    <TableHead>Subscription</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>End Date</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.uid} className={cn(user.isBanned && 'bg-destructive/10')}>
                                        <TableCell className="font-medium">{user.email}</TableCell>
                                        <TableCell>{user.subscription?.planName || 'N/A'}</TableCell>
                                        <TableCell>
                                            {user.isBanned ? (
                                                <Badge variant="destructive">Banned</Badge>
                                            ) : (
                                                <Badge variant={getStatusBadgeVariant(user.subscription?.status)}>
                                                    {user.subscription?.status || 'N/A'}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {user.subscription?.endDate ? format(user.subscription.endDate, 'PPP') : 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.role === 'admin' ? 'destructive' : 'outline'}>{user.role}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {user.role !== 'admin' && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem disabled>View Details</DropdownMenuItem>
                                                        <DropdownMenuItem 
                                                            className={cn(user.isBanned ? "text-green-600 focus:text-green-700" : "text-destructive focus:text-destructive")} 
                                                            onSelect={() => openBanUnbanDialog(user)}>
                                                            <Trash2 className="mr-2 h-4 w-4"/> {user.isBanned ? 'Unban User' : 'Ban User'}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={isBanUnbanDialogOpen} onOpenChange={setIsBanUnbanDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You are about to {processingUser?.isBanned ? 'unban' : 'ban'} the user 
                            <span className="font-semibold">{` ${processingUser?.email}`}</span>.
                            {processingUser?.isBanned ? ' They will regain access to the application.' : ' This will prevent them from logging in.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBanUnbanUser} className={cn(processingUser?.isBanned ? "" : "bg-destructive hover:bg-destructive/90")}>
                           {processingUser?.isBanned ? 'Yes, Unban' : 'Yes, Ban'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

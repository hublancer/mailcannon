
'use client'

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, MoreHorizontal, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { getAllUsers, UserProfile } from '@/services/users';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function AdminUsersPage() {
    const [users, setUsers] = React.useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const { toast } = useToast();

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
                                    <TableRow key={user.uid}>
                                        <TableCell className="font-medium">{user.email}</TableCell>
                                        <TableCell>{user.subscription?.planName || 'N/A'}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusBadgeVariant(user.subscription?.status)}>
                                                {user.subscription?.status || 'N/A'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {user.subscription?.endDate ? format(user.subscription.endDate, 'PPP') : 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.role === 'admin' ? 'destructive' : 'outline'}>{user.role}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem disabled>View Details</DropdownMenuItem>
                                                    <DropdownMenuItem disabled className="text-destructive"><Trash2 className="mr-2"/> Ban User</DropdownMenuItem>
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
        </>
    );
}

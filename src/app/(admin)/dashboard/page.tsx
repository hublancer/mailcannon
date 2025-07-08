
'use client'

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CreditCard, CheckCircle, Clock } from 'lucide-react';
import { getAllUsers, UserProfile } from '@/services/users';
import { getPayments, Payment } from '@/services/payments';

export default function AdminDashboardPage() {
    const [users, setUsers] = React.useState<UserProfile[]>([]);
    const [payments, setPayments] = React.useState<Payment[]>([]);

    React.useEffect(() => {
        const unsubUsers = getAllUsers(setUsers);
        const unsubPayments = getPayments(setPayments);

        return () => {
            unsubUsers();
            unsubPayments();
        };
    }, []);

    const stats = React.useMemo(() => {
        const totalUsers = users.length;
        const pendingPayments = payments.filter(p => p.status === 'pending').length;
        const approvedPlans = payments.filter(p => p.status === 'approved').length;
        const activeUsers = users.filter(u => u.subscription?.status === 'active' || u.subscription?.status === 'trial').length;

        return { totalUsers, pendingPayments, approvedPlans, activeUsers };
    }, [users, payments]);

    return (
        <>
            <PageHeader
                title="Admin Dashboard"
                description="An overview of your application's activity."
            />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalUsers}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeUsers}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pendingPayments}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Approved Plans</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.approvedPlans}</div>
                    </CardContent>
                </Card>
            </div>
            {/* Can add charts here in the future */}
        </>
    );
}

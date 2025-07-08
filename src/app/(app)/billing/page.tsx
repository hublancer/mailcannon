
'use client'

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getPlans, Plan } from '@/services/plans';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { SubmitPaymentDialog } from '@/components/billing/submit-payment-dialog';
import { UserProfile } from '@/services/users';
import { format } from 'date-fns';

export default function BillingPage() {
    const [plans, setPlans] = React.useState<Plan[]>([]);
    const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [user, setUser] = React.useState(auth.currentUser);

    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = React.useState(false);
    const [selectedPlan, setSelectedPlan] = React.useState<Plan | null>(null);

    React.useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
          setUser(user);
        });
        return () => unsubscribeAuth();
    }, []);

    React.useEffect(() => {
        if (user) {
            const unsubPlans = getPlans(setPlans);
            const unsubProfile = onSnapshot(doc(db, 'users', user.uid), (doc) => {
                if(doc.exists()) {
                    const data = doc.data();
                    setUserProfile({
                        ...data,
                        uid: doc.id,
                        createdAt: (data.createdAt as any)?.toDate(),
                        subscription: data.subscription ? {
                            ...data.subscription,
                            startDate: (data.subscription.startDate as any)?.toDate(),
                            endDate: (data.subscription.endDate as any)?.toDate(),
                        } : undefined
                    } as UserProfile);
                }
                setIsLoading(false);
            });
            return () => {
                unsubPlans();
                unsubProfile();
            }
        } else {
            setIsLoading(false);
        }
    }, [user]);

    const handleSelectPlan = (plan: Plan) => {
        setSelectedPlan(plan);
        setIsPaymentDialogOpen(true);
    }
    
    if (isLoading) {
        return (
          <div className="flex items-center justify-center min-h-[50vh]">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        );
    }

    const currentSub = userProfile?.subscription;

    return (
        <>
            <PageHeader title="Billing & Plans" description="Manage your subscription and upgrade your plan." />

            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Current Subscription</CardTitle>
                </CardHeader>
                <CardContent>
                    {currentSub ? (
                        <div className="space-y-2">
                            <p><strong>Plan:</strong> {currentSub.planName}</p>
                            <p><strong>Status:</strong> <span className="font-semibold capitalize">{currentSub.status}</span></p>
                            {currentSub.status === 'pending' && <p className="text-sm text-muted-foreground">Your payment is being reviewed. Please wait for admin approval.</p>}
                            {currentSub.status === 'rejected' && <p className="text-sm text-destructive">Your last payment was rejected. Please contact support or try again.</p>}
                            {(currentSub.status === 'active' || currentSub.status === 'trial') && (
                                <p><strong>Expires on:</strong> {format(currentSub.endDate, 'PPP')}</p>
                            )}
                        </div>
                    ) : (
                        <p>You do not have an active subscription.</p>
                    )}
                </CardContent>
            </Card>

            <div className="space-y-4">
                <h2 className="text-2xl font-bold font-headline">Choose Your Plan</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {plans.map(plan => (
                        <Card key={plan.id} className="flex flex-col">
                            <CardHeader>
                                <CardTitle>{plan.name}</CardTitle>
                                <CardDescription>${plan.price} / {plan.durationDays} days</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow space-y-4">
                                <ul className="space-y-2">
                                    <li className="flex items-center"><Check className="mr-2 text-primary" />{plan.smtpAccountLimit} SMTP Account(s)</li>
                                    <li className="flex items-center"><Check className="mr-2 text-primary" />Full Campaign Management</li>
                                    <li className="flex items-center"><Check className="mr-2 text-primary" />AI Content Generation</li>
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" onClick={() => handleSelectPlan(plan)} disabled={currentSub?.status === 'pending'}>
                                    {currentSub?.planId === plan.id ? 'Current Plan' : 'Select Plan'}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>

            {selectedPlan && user && (
                <SubmitPaymentDialog
                    isOpen={isPaymentDialogOpen}
                    onOpenChange={setIsPaymentDialogOpen}
                    plan={selectedPlan}
                    userId={user.uid}
                />
            )}
        </>
    );
}

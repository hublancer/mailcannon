
'use client';

import * as React from 'react';
import Link from 'next/link';
import { MoreHorizontal, PlusCircle, Loader2, Play, Pause, StopCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/page-header';
import { auth, db } from '@/lib/firebase';
import { getCampaigns, deleteCampaign, updateCampaign, logCampaignFailure, getCampaignFailures, type Campaign, type CampaignFailure } from '@/services/campaigns';
import { getRecipientLists, getRecipientsForList, type RecipientList } from '@/services/recipients';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { sendCampaignEmail } from '@/app/actions/send-campaign-email';
import { Progress } from '@/components/ui/progress';
import { increment, getDoc, doc } from 'firebase/firestore';
import { format } from 'date-fns';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [recipientLists, setRecipientLists] = React.useState<RecipientList[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [user, setUser] = React.useState(auth.currentUser);
  const { toast } = useToast();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [deletingCampaign, setDeletingCampaign] = React.useState<Campaign | null>(null);

  const [isFailuresDialogOpen, setIsFailuresDialogOpen] = React.useState(false);
  const [currentFailures, setCurrentFailures] = React.useState<CampaignFailure[]>([]);
  const [viewingFailuresFor, setViewingFailuresFor] = React.useState<Campaign | null>(null);
  const [isLoadingFailures, setIsLoadingFailures] = React.useState(false);

  // --- State for the sending process ---
  const [activeCampaignId, setActiveCampaignId] = React.useState<string | null>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  // ------------------------------------

  React.useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribeAuth();
  }, []);
  
  // This useEffect handles fetching all necessary data from Firestore
  React.useEffect(() => {
    if (!user) {
      setCampaigns([]);
      setRecipientLists([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubRecipients = getRecipientLists(user.uid, setRecipientLists);
    
    // This onSnapshot listener is crucial for updating the UI in real-time
    const unsubCampaigns = getCampaigns(user.uid, (fetchedCampaigns) => {
      setCampaigns(fetchedCampaigns);
      setIsLoading(false);
    });
    
    return () => {
      unsubCampaigns();
      unsubRecipients();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [user]);

  // This is the new, robust campaign runner effect.
  React.useEffect(() => {
    // Stop any running process if user logs out
    if (!user) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setActiveCampaignId(null);
        return;
    }
    
    const campaignToRun = campaigns.find(c => c.status === 'Running');

    // Case 1: A campaign should be running, but we haven't started the process for it yet.
    if (campaignToRun && campaignToRun.id !== activeCampaignId) {
        
        // Make sure any previous runner is stopped before starting a new one
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        
        setActiveCampaignId(campaignToRun.id);

        const runCampaignStep = async () => {
            // Re-check user in case they logged out during the process
            if (!auth.currentUser) {
                setActiveCampaignId(null);
                return;
            }
            const currentUserId = auth.currentUser.uid;

            try {
                // Fetch the absolute latest campaign state from Firestore to avoid race conditions
                const campaignDoc = await getDoc(doc(db, 'users', currentUserId, 'campaigns', campaignToRun.id));
                
                if (!campaignDoc.exists()) {
                    throw new Error("Campaign has been deleted.");
                }

                const currentCampaign = { id: campaignDoc.id, ...campaignDoc.data() } as Campaign;
                
                // Stop condition: Campaign was paused, completed, or failed by another action
                if (currentCampaign.status !== 'Running') {
                    setActiveCampaignId(null);
                    return; 
                }
                
                const recipients = await getRecipientsForList(currentUserId, currentCampaign.recipientListId);
                const currentIndex = (currentCampaign.sentCount || 0) + (currentCampaign.failedCount || 0);

                // Stop condition: All recipients have been processed
                if (currentIndex >= recipients.length) {
                    await updateCampaign(currentUserId, currentCampaign.id, { status: 'Completed' });
                    toast({ title: 'Campaign Finished', description: `Campaign "${currentCampaign.campaignName}" has completed.` });
                    setActiveCampaignId(null);
                    return;
                }

                const recipient = recipients[currentIndex];
                if (!currentCampaign.emailVariants || currentCampaign.emailVariants.length === 0) {
                  throw new Error("Campaign has no email variants.");
                }
                // Loop through variants deterministically as requested
                const variantIndex = currentIndex % currentCampaign.emailVariants.length;
                const variant = currentCampaign.emailVariants[variantIndex];

                const result = await sendCampaignEmail({
                    to: recipient,
                    subject: variant.subject,
                    html: variant.body,
                    userId: currentUserId,
                    smtpAccountId: currentCampaign.smtpAccountId,
                });
                
                if (result.success) {
                    await updateCampaign(currentUserId, currentCampaign.id, { sentCount: increment(1) });
                } else {
                    await logCampaignFailure(currentUserId, currentCampaign.id, recipient, result.error || 'Unknown error');
                }

                // *** CRITICAL STEP: Schedule the next iteration of the loop ***
                let delay = 0;
                if (currentCampaign.speedLimit > 0) {
                    const avgDelay = (3600 * 1000) / currentCampaign.speedLimit;
                    delay = avgDelay * (0.75 + Math.random() * 0.5); // Randomize to appear human
                }
                timeoutRef.current = setTimeout(runCampaignStep, delay);
                
            } catch (e) {
                toast({ variant: 'destructive', title: 'Campaign Error', description: (e as Error).message });
                if (auth.currentUser) {
                    await updateCampaign(auth.currentUser.uid, campaignToRun.id, { status: 'Failed' });
                }
                setActiveCampaignId(null);
            }
        };
        
        // Start the campaign runner
        runCampaignStep();
    } 
    // Case 2: No campaign should be running, but our state thinks one is.
    else if (!campaignToRun && activeCampaignId) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setActiveCampaignId(null);
    }
    
    // This cleanup is for when the component unmounts
    return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  }, [campaigns, user, toast, activeCampaignId]);


  const handleStartCampaign = async (campaign: Campaign) => {
    if (!user) return;
    if (activeCampaignId && activeCampaignId !== campaign.id) {
        toast({ variant: 'destructive', title: 'Error', description: 'Another campaign is already running.' });
        return;
    }
    
    await updateCampaign(user.uid, campaign.id, { status: 'Running' });
    toast({ title: 'Campaign Queued!', description: `"${campaign.campaignName}" is starting.`});
  };

  const handlePauseCampaign = async (campaign: Campaign) => {
    if (!user) return;
    await updateCampaign(user.uid, campaign.id, { status: 'Paused' });
    toast({ title: 'Campaign Paused', description: `"${campaign.campaignName}" has been paused.` });
  };

  const handleStopCampaign = async (campaign: Campaign) => {
    if (!user) return;
    await updateCampaign(user.uid, campaign.id, { status: 'Completed' }); // Mark as completed to stop
    toast({ title: 'Campaign Stopped', description: `"${campaign.campaignName}" has been manually stopped.` });
  }

  const openDeleteDialog = (campaign: Campaign) => {
    setDeletingCampaign(campaign);
    setIsDeleteDialogOpen(true);
  }

  const handleDeleteCampaign = async () => {
    if (!user || !deletingCampaign) return;
    try {
        await deleteCampaign(user.uid, deletingCampaign.id);
        toast({ title: "Success!", description: `Campaign "${deletingCampaign.campaignName}" deleted.` });
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: (error as Error).message });
    } finally {
        setIsDeleteDialogOpen(false);
        setDeletingCampaign(null);
    }
  }

  const getRecipientList = (listId: string) => recipientLists.find(l => l.id === listId);

  const handleViewFailures = async (campaign: Campaign) => {
    if (!user) return;
    setViewingFailuresFor(campaign);
    setIsLoadingFailures(true);
    setIsFailuresDialogOpen(true);
    try {
        const failures = await getCampaignFailures(user.uid, campaign.id);
        setCurrentFailures(failures);
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load failure details.' });
        setIsFailuresDialogOpen(false);
    } finally {
        setIsLoadingFailures(false);
    }
  };


  return (
    <>
      <PageHeader
        title="Campaigns"
        description="Create and manage your email campaigns."
      >
        <Button asChild>
          <Link href="/campaigns/new">
            <PlusCircle className="mr-2" />
            Create Campaign
          </Link>
        </Button>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Campaign List</CardTitle>
          <CardDescription>
            An overview of all your email campaigns.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <h3 className="text-xl font-semibold">No Campaigns Yet</h3>
                <p className="text-muted-foreground mt-2">Get started by creating your first email campaign.</p>
                <Button asChild className="mt-4">
                    <Link href="/campaigns/new">Create Your First Campaign</Link>
                </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => {
                  const list = getRecipientList(campaign.recipientListId);
                  const totalRecipients = list?.count || 0;
                  const sentCount = campaign.sentCount || 0;
                  const failedCount = campaign.failedCount || 0;
                  const totalProcessed = sentCount + failedCount;
                  const progress = totalRecipients > 0 ? (totalProcessed / totalRecipients) * 100 : 0;
                  const isThisCampaignRunning = activeCampaignId === campaign.id;

                  return (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.campaignName}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            campaign.status === 'Completed' ? 'secondary'
                            : campaign.status === 'Draft' ? 'outline'
                            : 'default'
                          }
                          className={cn({
                              'bg-blue-100 text-blue-800': campaign.status === 'Scheduled',
                              'bg-green-100 text-green-800': campaign.status === 'Running',
                              'bg-yellow-100 text-yellow-800': campaign.status === 'Paused',
                              'bg-red-100 text-red-800': campaign.status === 'Failed',
                          })}
                        >
                          {isThisCampaignRunning && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                          {campaign.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-4">
                           <div className="w-28">
                            {campaign.status !== 'Draft' && campaign.status !== 'Scheduled' && totalRecipients > 0 ? (
                                <Progress value={progress} className="h-2" />
                            ) : (
                                <span className="text-muted-foreground text-xs">Not started</span>
                            )}
                           </div>
                           <div className="text-xs text-muted-foreground">
                                <div>{sentCount} sent / {totalRecipients}</div>
                                {failedCount > 0 ? (
                                    <Button variant="link" className="h-auto p-0 text-destructive text-xs" onClick={() => handleViewFailures(campaign)}>
                                        {failedCount} failed
                                    </Button>
                                ) : (
                                    <div>0 failed</div>
                                )}
                           </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-haspopup="true"
                              size="icon"
                              variant="ghost"
                              disabled={activeCampaignId !== null && !isThisCampaignRunning}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            { (campaign.status === 'Draft' || campaign.status === 'Paused' || (campaign.status === 'Completed' && progress < 100) ) && (
                                <DropdownMenuItem onSelect={() => handleStartCampaign(campaign)} disabled={activeCampaignId !== null}>
                                    <Play className="mr-2"/>
                                    {campaign.status === 'Paused' || campaign.status === 'Completed' ? 'Resume' : 'Start'}
                                </DropdownMenuItem>
                            )}
                            { isThisCampaignRunning && (
                                <DropdownMenuItem onSelect={() => handlePauseCampaign(campaign)}>
                                    <Pause className="mr-2"/>
                                    Pause
                                </DropdownMenuItem>
                            )}
                             { isThisCampaignRunning && (
                                <DropdownMenuItem onSelect={() => handleStopCampaign(campaign)}>
                                    <StopCircle className="mr-2"/>
                                    Stop
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem disabled>Edit</DropdownMenuItem>
                            <DropdownMenuItem disabled>View Report</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onSelect={() => openDeleteDialog(campaign)} disabled={isThisCampaignRunning}>
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the campaign
                    <span className="font-semibold">{` "${deletingCampaign?.campaignName}"`}</span>.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteCampaign} className="text-destructive-foreground bg-destructive hover:bg-destructive/90">
                    Yes, delete campaign
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isFailuresDialogOpen} onOpenChange={setIsFailuresDialogOpen}>
        <DialogContent className="max-w-3xl">
            <DialogHeader>
                <DialogTitle>Failure Report for "{viewingFailuresFor?.campaignName}"</DialogTitle>
                <DialogDescription>
                    The following recipients could not be reached.
                </DialogDescription>
            </DialogHeader>
            {isLoadingFailures ? (
                <div className="flex items-center justify-center p-10">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <div className="max-h-[60vh] overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Recipient</TableHead>
                                <TableHead>Error Message</TableHead>
                                <TableHead className="w-[180px]">Timestamp</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {currentFailures.length > 0 ? currentFailures.map((failure) => (
                                <TableRow key={failure.id}>
                                    <TableCell>{failure.recipient}</TableCell>
                                    <TableCell className="text-xs">{failure.error}</TableCell>
                                    <TableCell>{failure.timestamp ? format(failure.timestamp, 'Pp') : 'N/A'}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center">No failures to report.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}
        </DialogContent>
      </Dialog>
    </>
  );
}

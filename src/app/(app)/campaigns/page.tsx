
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
import { PageHeader } from '@/components/page-header';
import { auth, db } from '@/lib/firebase';
import { getCampaigns, deleteCampaign, updateCampaign, type Campaign } from '@/services/campaigns';
import { getRecipientLists, getRecipientsForList, type RecipientList } from '@/services/recipients';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { sendCampaignEmail } from '@/app/actions/send-campaign-email';
import { Progress } from '@/components/ui/progress';
import { getDoc, doc } from 'firebase/firestore';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [recipientLists, setRecipientLists] = React.useState<RecipientList[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [user, setUser] = React.useState(auth.currentUser);
  const { toast } = useToast();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [deletingCampaign, setDeletingCampaign] = React.useState<Campaign | null>(null);

  // Campaign running state
  const [activeCampaignId, setActiveCampaignId] = React.useState<string | null>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // Ref to hold the latest campaigns to avoid stale state in timeouts
  const campaignsRef = React.useRef(campaigns);
  campaignsRef.current = campaigns;

  React.useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  const sendNextEmail = React.useCallback(async (campaignId: string, recipientEmails: string[], currentIndex: number) => {
      if (!user) return;

      // Use the ref to get the latest campaign data, which is updated by the onSnapshot listener
      const campaign = campaignsRef.current.find(c => c.id === campaignId);

      // Stop if campaign is gone, paused, completed, or otherwise not 'Running'
      if (!campaign || campaign.status !== 'Running') {
          setActiveCampaignId(null);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          return;
      }

      // Stop if we've sent all emails
      if (currentIndex >= recipientEmails.length) {
          await updateCampaign(user.uid, campaign.id, { status: 'Completed' });
          setActiveCampaignId(null);
          toast({ title: 'Campaign Finished', description: `Campaign "${campaign.campaignName}" has completed.`});
          return;
      }

      const recipient = recipientEmails[currentIndex];
      const result = await sendCampaignEmail({
          to: recipient,
          subject: campaign.emailSubject,
          html: campaign.emailBody,
          userId: user.uid,
          smtpAccountId: campaign.smtpAccountId,
      });

      // To avoid race conditions, fetch the latest counts before updating
      const campaignDoc = await getDoc(doc(db, 'users', user.uid, 'campaigns', campaign.id));
      const latestData = campaignDoc.data() as Campaign;
      
      const updatedSentCount = (latestData.sentCount || 0) + (result.success ? 1 : 0);
      const updatedFailedCount = (latestData.failedCount || 0) + (result.success ? 0 : 1);
      
      await updateCampaign(user.uid, campaign.id, {
          sentCount: updatedSentCount,
          failedCount: updatedFailedCount,
      });

      const nextIndex = currentIndex + 1;
      if (nextIndex < recipientEmails.length) {
        let delay = 0;
        // Calculate a randomized delay based on the hourly speed limit
        if (campaign.speedLimit > 0) {
            const avgDelay = (3600 * 1000) / campaign.speedLimit;
            // Add jitter to the delay (+/- 25%) to appear more human
            delay = avgDelay * (0.75 + Math.random() * 0.5);
        }
        
        timeoutRef.current = setTimeout(() => sendNextEmail(campaignId, recipientEmails, nextIndex), delay);
      } else {
        await updateCampaign(user.uid, campaign.id, { status: 'Completed' });
        setActiveCampaignId(null);
        toast({ title: 'Campaign Finished', description: `Campaign "${campaign.campaignName}" has completed.`});
      }
  }, [user, toast]);
  
  // This useEffect hook is responsible for starting and stopping the sending loop
  // based on real-time data from Firestore.
  React.useEffect(() => {
    if (user) {
      setIsLoading(true);
      const unsubRecipients = getRecipientLists(user.uid, setRecipientLists);
      
      const unsubCampaigns = getCampaigns(user.uid, (fetchedCampaigns) => {
        setCampaigns(fetchedCampaigns);
        campaignsRef.current = fetchedCampaigns; // Keep the ref updated

        const activeCampaign = fetchedCampaigns.find(c => c.id === activeCampaignId);
        
        // **START CONDITION**: If a campaign is active, its status is 'Running', and the loop isn't already going.
        if (activeCampaign && activeCampaign.status === 'Running' && !timeoutRef.current) {
            const startSendingProcess = async () => {
                try {
                    const recipients = await getRecipientsForList(user.uid, activeCampaign.recipientListId);
                    const currentIndex = (activeCampaign.sentCount || 0) + (activeCampaign.failedCount || 0);

                    if (recipients.length === 0) {
                        toast({ variant: 'destructive', title: 'Error', description: 'Recipient list is empty.' });
                        await updateCampaign(user.uid, activeCampaign.id, { status: 'Failed' });
                        return;
                    }
                    if (currentIndex >= recipients.length) {
                        toast({ title: 'Campaign Already Completed' });
                        if (activeCampaign.status !== 'Completed') await updateCampaign(user.uid, activeCampaign.id, { status: 'Completed' });
                        return;
                    }
                    
                    // Start the sending loop. The first email is sent without delay inside sendNextEmail.
                    sendNextEmail(activeCampaign.id, recipients, currentIndex);

                } catch (error) {
                    toast({ variant: 'destructive', title: 'Failed to start campaign', description: (error as Error).message });
                    if (activeCampaign) await updateCampaign(user.uid, activeCampaign.id, { status: 'Failed' });
                }
            };
            startSendingProcess();
        }

        // **STOP CONDITION**: If the active campaign is no longer in the 'Running' state.
        if (activeCampaignId && (!activeCampaign || activeCampaign.status !== 'Running')) {
            setActiveCampaignId(null);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        }
        setIsLoading(false);
      });
      
      return () => {
        unsubCampaigns();
        unsubRecipients();
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    } else {
      setCampaigns([]);
      setRecipientLists([]);
      setIsLoading(false);
    }
  }, [user, activeCampaignId, toast, sendNextEmail]);


  const handleStartCampaign = async (campaign: Campaign) => {
    if (!user) return;
    if (activeCampaignId) {
        toast({ variant: 'destructive', title: 'Error', description: 'Another campaign is already running.' });
        return;
    }
    
    // This just sets the intention. The useEffect will detect the state change and start the process.
    await updateCampaign(user.uid, campaign.id, { status: 'Running' });
    setActiveCampaignId(campaign.id);
    toast({ title: 'Campaign Queued!', description: `"${campaign.campaignName}" is starting.`});
  };

  const handlePauseCampaign = async (campaign: Campaign) => {
    if (!user) return;
    if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
    }
    await updateCampaign(user.uid, campaign.id, { status: 'Paused' });
    setActiveCampaignId(null);
    toast({ title: 'Campaign Paused', description: `"${campaign.campaignName}" has been paused.` });
  };

  const handleStopCampaign = async (campaign: Campaign) => {
    if (!user) return;
    if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
    }
    // Set a final status. We consider it 'Completed' as it's a manual final action.
    await updateCampaign(user.uid, campaign.id, { status: 'Completed' });
    setActiveCampaignId(null);
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
                  const progress = totalRecipients > 0 ? (((campaign.sentCount || 0) + (campaign.failedCount || 0)) / totalRecipients) * 100 : 0;
                  const isCampaignRunning = activeCampaignId === campaign.id;

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
                          {isCampaignRunning && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                          {campaign.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                           <div className="w-28">
                            {campaign.status !== 'Draft' && campaign.status !== 'Scheduled' ? (
                                <Progress value={progress} className="h-2" />
                            ) : (
                                <span className="text-muted-foreground text-xs">Not started</span>
                            )}
                           </div>
                           <span className="text-muted-foreground text-xs">
                             {(campaign.sentCount || 0) + (campaign.failedCount || 0)} / {totalRecipients}
                           </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-haspopup="true"
                              size="icon"
                              variant="ghost"
                              disabled={activeCampaignId !== null && !isCampaignRunning}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            { (campaign.status === 'Draft' || campaign.status === 'Paused' || campaign.status === 'Completed' && progress < 100) && (
                                <DropdownMenuItem onSelect={() => handleStartCampaign(campaign)} disabled={activeCampaignId !== null}>
                                    <Play className="mr-2"/>
                                    {campaign.status === 'Paused' ? 'Resume' : 'Start'}
                                </DropdownMenuItem>
                            )}
                            { isCampaignRunning && (
                                <DropdownMenuItem onSelect={() => handlePauseCampaign(campaign)}>
                                    <Pause className="mr-2"/>
                                    Pause
                                </DropdownMenuItem>
                            )}
                             { isCampaignRunning && (
                                <DropdownMenuItem onSelect={() => handleStopCampaign(campaign)}>
                                    <StopCircle className="mr-2"/>
                                    Stop
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem disabled>Edit</DropdownMenuItem>
                            <DropdownMenuItem disabled>View Report</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onSelect={() => openDeleteDialog(campaign)} disabled={isCampaignRunning}>
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
    </>
  );
}

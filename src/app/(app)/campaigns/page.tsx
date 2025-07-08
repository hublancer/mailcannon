
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
import { auth } from '@/lib/firebase';
import { getCampaigns, deleteCampaign, updateCampaign, type Campaign } from '@/services/campaigns';
import { getRecipientLists, getRecipientsForList, type RecipientList } from '@/services/recipients';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { sendCampaignEmail } from '@/app/actions/send-campaign-email';
import { Progress } from '@/components/ui/progress';

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

  React.useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  React.useEffect(() => {
    if (user) {
      setIsLoading(true);
      const unsubCampaigns = getCampaigns(user.uid, (fetchedCampaigns) => {
        setCampaigns(fetchedCampaigns);
        setIsLoading(false);
      });
      const unsubRecipients = getRecipientLists(user.uid, setRecipientLists);
      
      return () => {
        unsubCampaigns();
        unsubRecipients();
      };
    } else {
      setCampaigns([]);
      setRecipientLists([]);
      setIsLoading(false);
    }
  }, [user]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const sendNextEmail = React.useCallback(async (campaignId: string, recipientEmails: string[], currentIndex: number) => {
      if (!user) return;

      const campaign = campaigns.find(c => c.id === campaignId);
      if (!campaign || campaign.status !== 'Running') {
          setActiveCampaignId(null);
          return;
      }

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
          html: campaign.emailBody, // Placeholder replacement would happen here in a real scenario
          userId: user.uid,
          smtpAccountId: campaign.smtpAccountId,
      });

      const updatedSentCount = campaign.sentCount + (result.success ? 1 : 0);
      const updatedFailedCount = campaign.failedCount + (result.success ? 0 : 1);
      
      await updateCampaign(user.uid, campaign.id, {
          sentCount: updatedSentCount,
          failedCount: updatedFailedCount,
      });

      const nextIndex = currentIndex + 1;
      if (nextIndex < recipientEmails.length) {
        // First email is sent instantly, subsequent have delay.
        let delay = 0;
        if (campaign.speedLimit > 0) {
            const avgDelay = (3600 * 1000) / campaign.speedLimit;
            delay = avgDelay * (0.5 + Math.random());
        }
        
        timeoutRef.current = setTimeout(() => sendNextEmail(campaignId, recipientEmails, nextIndex), delay);
      } else {
        await updateCampaign(user.uid, campaign.id, { status: 'Completed' });
        setActiveCampaignId(null);
        toast({ title: 'Campaign Finished', description: `Campaign "${campaign.campaignName}" has completed.`});
      }
  }, [campaigns, user, toast]);

  const handleStartCampaign = async (campaign: Campaign) => {
    if (!user) return;
    if (activeCampaignId) {
        toast({ variant: 'destructive', title: 'Error', description: 'Another campaign is already running.' });
        return;
    }
    
    try {
        const recipients = await getRecipientsForList(user.uid, campaign.recipientListId);
        if (recipients.length === 0) {
            toast({ variant: 'destructive', title: 'Error', description: 'Recipient list is empty.' });
            return;
        }

        await updateCampaign(user.uid, campaign.id, { status: 'Running' });
        setActiveCampaignId(campaign.id);
        toast({ title: 'Campaign Started!', description: `Campaign "${campaign.campaignName}" is now running.`});

        // Start sending the first email
        sendNextEmail(campaign.id, recipients, 0);

    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not start campaign.' });
    }
  };

  const handlePauseCampaign = async (campaign: Campaign) => {
    if (!user) return;
    if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
    }
    await updateCampaign(user.uid, campaign.id, { status: 'Paused' });
    setActiveCampaignId(null);
    toast({ title: 'Campaign Paused', description: `"${campaign.campaignName}" has been paused.` });
  };

  const handleStopCampaign = async (campaign: Campaign) => {
    if (!user) return;
    if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
    }
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
                  const progress = totalRecipients > 0 ? ((campaign.sentCount + campaign.failedCount) / totalRecipients) * 100 : 0;
                  
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
                          {campaign.status === 'Running' && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                          {campaign.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                           <div className="w-28">
                            {campaign.status === 'Running' || campaign.status === 'Paused' || campaign.status === 'Completed' ? (
                                <Progress value={progress} className="h-2" />
                            ) : (
                                <span className="text-muted-foreground text-xs">Not started</span>
                            )}
                           </div>
                           <span className="text-muted-foreground text-xs">
                             {campaign.sentCount + campaign.failedCount} / {totalRecipients}
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
                              disabled={activeCampaignId !== null && activeCampaignId !== campaign.id}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            { (campaign.status === 'Draft' || campaign.status === 'Paused' || campaign.status === 'Scheduled') && (
                                <DropdownMenuItem onSelect={() => handleStartCampaign(campaign)} disabled={activeCampaignId !== null}>
                                    <Play className="mr-2"/>
                                    {campaign.status === 'Paused' ? 'Resume' : 'Start'}
                                </DropdownMenuItem>
                            )}
                            { campaign.status === 'Running' && (
                                <DropdownMenuItem onSelect={() => handlePauseCampaign(campaign)}>
                                    <Pause className="mr-2"/>
                                    Pause
                                </DropdownMenuItem>
                            )}
                             { campaign.status === 'Running' && (
                                <DropdownMenuItem onSelect={() => handleStopCampaign(campaign)}>
                                    <StopCircle className="mr-2"/>
                                    Stop
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem disabled>Edit</DropdownMenuItem>
                            <DropdownMenuItem disabled>View Report</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onSelect={() => openDeleteDialog(campaign)}>
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

'use client';

import * as React from 'react';
import Link from 'next/link';
import { MoreHorizontal, PlusCircle, Loader2 } from 'lucide-react';
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
import { PageHeader } from '@/components/page-header';
import { auth } from '@/lib/firebase';
import { getCampaigns, type Campaign } from '@/services/campaigns';
import { getRecipientLists, type RecipientList } from '@/services/recipients';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [recipientLists, setRecipientLists] = React.useState<RecipientList[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [user, setUser] = React.useState(auth.currentUser);

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

  const getRecipientCount = (listId: string) => {
    const list = recipientLists.find(l => l.id === listId);
    return list ? list.count.toLocaleString() : '0';
  };

  const formatScheduledAt = (campaign: Campaign) => {
    if (campaign.status === 'Draft') return '-';
    if (campaign.status === 'Active') return 'Ongoing';
    if (campaign.scheduledAt) {
        return new Date(campaign.scheduledAt).toLocaleString();
    }
    return 'Not Scheduled';
  }

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
                  <TableHead>Recipients</TableHead>
                  <TableHead>Scheduled At</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.campaignName}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          campaign.status === 'Sent'
                            ? 'secondary'
                            : campaign.status === 'Draft'
                            ? 'outline'
                            : 'default'
                        }
                        className={
                          campaign.status === 'Scheduled'
                            ? 'bg-accent text-accent-foreground'
                            : campaign.status === 'Active' ? 'bg-primary/20 text-primary' : ''
                        }
                      >
                        {campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getRecipientCount(campaign.recipientListId)}
                    </TableCell>
                    <TableCell>{formatScheduledAt(campaign)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            aria-haspopup="true"
                            size="icon"
                            variant="ghost"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Duplicate</DropdownMenuItem>
                          <DropdownMenuItem>View Report</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            Delete
                          </DropdownMenuItem>
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

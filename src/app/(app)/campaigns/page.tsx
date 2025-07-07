import Link from 'next/link';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
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

const campaigns = [
  {
    name: 'Summer Sale 2024',
    status: 'Scheduled',
    recipients: 1200,
    scheduledAt: '2024-08-01 10:00 AM',
  },
  {
    name: 'New Product Launch',
    status: 'Sent',
    recipients: 5000,
    scheduledAt: '2024-07-20 09:00 AM',
  },
  {
    name: 'Weekly Newsletter',
    status: 'Recurring',
    recipients: 15000,
    scheduledAt: 'Every Friday at 8:00 AM',
  },
  {
    name: 'Holiday Promotions',
    status: 'Draft',
    recipients: 0,
    scheduledAt: '-',
  },
  {
    name: 'Q3 Onboarding Series',
    status: 'Active',
    recipients: 350,
    scheduledAt: 'Ongoing',
  },
];

export default function CampaignsPage() {
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
                <TableRow key={campaign.name}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
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
                          : campaign.status === 'Active' || campaign.status === 'Recurring' ? 'bg-primary/20 text-primary' : ''
                      }
                    >
                      {campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {campaign.recipients.toLocaleString()}
                  </TableCell>
                  <TableCell>{campaign.scheduledAt}</TableCell>
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
        </CardContent>
      </Card>
    </>
  );
}

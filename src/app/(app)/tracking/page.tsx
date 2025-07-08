'use client'

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Loader2 } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { getCampaigns, type Campaign } from '@/services/campaigns';

export default function TrackingPage() {
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
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
      const unsubscribe = getCampaigns(user.uid, (fetchedCampaigns) => {
        setCampaigns(fetchedCampaigns);
        setIsLoading(false);
      });
      return () => unsubscribe();
    } else {
      setCampaigns([]);
      setIsLoading(false);
    }
  }, [user]);

  const trackingData = React.useMemo(() => {
    const totalSent = campaigns.reduce((acc, c) => acc + (c.sentCount || 0), 0);
    const totalFailed = campaigns.reduce((acc, c) => acc + (c.failedCount || 0), 0);
    const totalDeliveries = totalSent + totalFailed;

    const kpiData = [
      { title: 'Total Emails Sent', value: totalSent.toLocaleString() },
      { title: 'Delivery Rate', value: totalDeliveries > 0 ? `${((totalSent / totalDeliveries) * 100).toFixed(1)}%` : 'N/A' },
      { title: 'Failed/Bounced', value: totalDeliveries > 0 ? `${((totalFailed / totalDeliveries) * 100).toFixed(1)}%` : 'N/A' },
    ];
    
    const recentCampaigns = campaigns.slice(0, 7);
    const chartData = recentCampaigns.map(c => ({
        name: c.campaignName.length > 15 ? `${c.campaignName.substring(0, 15)}...` : c.campaignName,
        sent: c.sentCount || 0,
        failed: c.failedCount || 0,
    })).reverse();

    const recentActivity = campaigns.slice(0, 4).map(c => ({
        campaign: c.campaignName,
        status: c.status,
        sent: `${c.sentCount || 0}`,
        failed: `${c.failedCount || 0}`,
    }));

    return { kpiData, chartData, recentActivity };
  }, [campaigns]);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }


  return (
    <>
      <PageHeader
        title="Tracking & Accuracy"
        description="Monitor send rates and failed deliveries for your campaigns."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        {trackingData.kpiData.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Campaigns Performance</CardTitle>
            <CardDescription>
              Volume of emails sent and failed for your most recent campaigns.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{
                sent: { label: 'Sent', color: 'hsl(var(--primary))' },
                failed: { label: 'Failed', color: 'hsl(var(--destructive))' },
            }}>
              <BarChart data={trackingData.chartData} accessibilityLayer margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <YAxis />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar dataKey="sent" fill="var(--color-sent)" radius={4} />
                <Bar dataKey="failed" fill="var(--color-failed)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Status of your most recent campaign sends.
            </CardDescription>
          </CardHeader>
          <CardContent>
             {trackingData.recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No recent campaign activity.</p>
             ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Campaign</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Sent</TableHead>
                            <TableHead>Failed</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {trackingData.recentActivity.map(activity => (
                            <TableRow key={activity.campaign}>
                                <TableCell className="font-medium">{activity.campaign}</TableCell>
                                <TableCell>
                                    <Badge variant={activity.status === 'Completed' ? 'secondary' : 'default'}>{activity.status}</Badge>
                                </TableCell>
                                <TableCell>{activity.sent}</TableCell>
                                <TableCell className="text-destructive">{activity.failed}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
             )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

'use client'

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

const kpiData = [
  { title: 'Total Emails Sent (30d)', value: '1,250,432', change: '+12.5%' },
  { title: 'Delivery Rate', value: '99.2%', change: '+0.1%' },
  { title: 'Open Rate', value: '24.8%', change: '-1.2%' },
  { title: 'Failed/Bounced', value: '0.8%', change: '-0.1%' },
];

const chartData = [
  { date: '2024-07-01', sent: 4000, failed: 24 },
  { date: '2024-07-02', sent: 3000, failed: 13 },
  { date: '2024-07-03', sent: 2000, failed: 98 },
  { date: '2024-07-04', sent: 2780, failed: 39 },
  { date: '2024-07-05', sent: 1890, failed: 48 },
  { date: '2024-07-06', sent: 2390, failed: 38 },
  { date: '2024-07-07', sent: 3490, failed: 43 },
];

const recentActivity = [
    { campaign: 'New Product Launch', status: 'Completed', sent: '5,000', failed: '32', timestamp: '3 days ago' },
    { campaign: 'Weekly Newsletter', status: 'Completed', sent: '15,000', failed: '112', timestamp: '1 day ago' },
    { campaign: 'Summer Sale 2024', status: 'In Progress', sent: '850/1200', failed: '5', timestamp: 'Ongoing' },
    { campaign: 'Q3 Onboarding Series', status: 'Active', sent: 'Ongoing', failed: '2', timestamp: 'Ongoing' },
]

export default function TrackingPage() {
  return (
    <>
      <PageHeader
        title="Tracking & Accuracy"
        description="Monitor send rates and failed deliveries for your campaigns."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {kpiData.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground">{kpi.change} from last month</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Send Volume (Last 7 Days)</CardTitle>
            <CardDescription>
              Volume of emails sent and failed over the last week.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{
                sent: { label: 'Sent', color: 'hsl(var(--primary))' },
                failed: { label: 'Failed', color: 'hsl(var(--destructive))' },
            }}>
              <BarChart data={chartData} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
                    {recentActivity.map(activity => (
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
          </CardContent>
        </Card>
      </div>
    </>
  );
}

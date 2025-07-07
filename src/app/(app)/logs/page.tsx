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

const logs = [
    { timestamp: '2024-07-28 10:05:12', severity: 'Error', message: 'Failed to connect to SMTP server smtp.mailgun.org: Connection timed out.' },
    { timestamp: '2024-07-28 10:05:01', severity: 'Info', message: 'Starting campaign "Summer Sale 2024". 1200 recipients.' },
    { timestamp: '2024-07-28 09:30:00', severity: 'Warning', message: 'Recipient list "Inactive Users" has a high bounce rate prediction (15%).' },
    { timestamp: '2024-07-28 09:15:45', severity: 'Info', message: 'User admin@mailcannon.com updated settings.' },
    { timestamp: '2024-07-27 18:00:25', severity: 'Success', message: 'Campaign "Weekly Newsletter" completed. Sent: 15,000, Failed: 112.' },
    { timestamp: '2024-07-27 17:45:10', severity: 'Info', message: 'AI content generation completed for "Holiday Promotions". 5 versions created.' },
    { timestamp: '2024-07-27 17:45:00', severity: 'Info', message: 'Starting campaign "Weekly Newsletter".' },
];

export default function LogsPage() {
  return (
    <>
      <PageHeader
        title="Detailed Logs"
        description="Review successful and failed operations across the application."
      />
      <Card>
        <CardHeader>
          <CardTitle>System Logs</CardTitle>
          <CardDescription>
            Logs are displayed in reverse chronological order.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Timestamp</TableHead>
                <TableHead className="w-[120px]">Severity</TableHead>
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log, index) => (
                <TableRow key={index}>
                  <TableCell className="font-mono text-xs">{log.timestamp}</TableCell>
                  <TableCell>
                    <Badge variant={
                        log.severity === 'Error' ? 'destructive' :
                        log.severity === 'Warning' ? 'secondary' :
                        'outline'
                    }
                    className={log.severity === 'Success' ? 'bg-green-100 text-green-800' : ''}>
                      {log.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.message}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

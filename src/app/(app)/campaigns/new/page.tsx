'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { PageHeader } from '@/components/page-header';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Mock data, in a real app this would be fetched from a database
const smtpAccounts = [
  { id: '1', name: 'smtp.mailgun.org (postmaster@mg.example.com)' },
  { id: '2', name: 'smtp.sendgrid.net (apikey)' },
];

const recipientLists = [
  { id: '1', name: 'Newsletter Subscribers (15,234)' },
  { id: '2', name: 'Active Customers (4,892)' },
  { id: '3', name: 'High-Value Clients (350)' },
];

const formSchema = z.object({
  campaignName: z.string().min(3, 'Campaign name must be at least 3 characters.'),
  emailSubject: z.string().min(5, 'Email subject must be at least 5 characters.'),
  smtpAccountId: z.string({ required_error: 'Please select an SMTP account.' }),
  recipientListId: z.string({ required_error: 'Please select a recipient list.' }),
  emailBody: z.string().min(20, 'Email body must be at least 20 characters.'),
  scheduleSend: z.boolean().default(false),
  scheduledAtDate: z.date().optional(),
  scheduledAtTime: z.string().optional(),
  delay: z.coerce.number().int().min(0).default(1000),
  speedLimit: z.coerce.number().int().min(0).default(0),
}).refine(data => {
    if (data.scheduleSend) {
      return !!data.scheduledAtDate && !!data.scheduledAtTime;
    }
    return true;
}, {
    message: 'Please select a date and time for scheduled sending.',
    path: ['scheduledAtDate'],
});

type FormValues = z.infer<typeof formSchema>;

export default function NewCampaignPage() {
  const router = useRouter();
  const { toast } = useToast();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      campaignName: '',
      emailSubject: '',
      emailBody: '',
      scheduleSend: false,
      delay: 1000,
      speedLimit: 0,
    },
  });

  const watchScheduleSend = form.watch('scheduleSend');

  function onSubmit(data: FormValues) {
    console.log('Campaign Data:', data);
    toast({
        title: "Campaign Created!",
        description: "Your new campaign has been successfully saved as a draft.",
    });
    router.push('/campaigns');
  }

  return (
    <>
      <PageHeader
        title="Create New Campaign"
        description="Configure and launch your next email campaign."
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Campaign Details</CardTitle>
                            <CardDescription>Give your campaign a name and a compelling subject line.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <FormField
                                control={form.control}
                                name="campaignName"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Campaign Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Q1 Product Update" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                             <FormField
                                control={form.control}
                                name="emailSubject"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Email Subject</FormLabel>
                                    <FormControl>
                                        <Input placeholder="What's new this month at Acme Corp" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle>Email Content</CardTitle>
                            <CardDescription>Write your email message below. Use markdown for formatting.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <FormField
                                control={form.control}
                                name="emailBody"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Email Body</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Hi {{firstName}}, ..." className="min-h-[300px]" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                            <Button variant="outline" className="mt-4" asChild>
                                <Link href="/ai-generator" target="_blank">
                                    <Wand2 className="mr-2" />
                                    Generate with AI
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-1 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Audience & Sender</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="recipientListId"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Recipient List</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a list" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                        {recipientLists.map(list => (
                                            <SelectItem key={list.id} value={list.id}>{list.name}</SelectItem>
                                        ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="smtpAccountId"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Send Via (SMTP Account)</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select an account" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                         {smtpAccounts.map(account => (
                                            <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                                        ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Scheduling & Delivery</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField
                                control={form.control}
                                name="scheduleSend"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                        <FormLabel>Schedule for later</FormLabel>
                                        <FormDescription>
                                        Send this campaign at a future date and time.
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    </FormItem>
                                )}
                            />
                            {watchScheduleSend && (
                                <div className="space-y-4">
                                     <FormField
                                        control={form.control}
                                        name="scheduledAtDate"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                            <FormLabel>Scheduled Date</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                        >
                                                        {field.value ? (
                                                            format(field.value, "PPP")
                                                        ) : (
                                                            <span>Pick a date</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                                                        initialFocus
                                                    />
                                                    </PopoverContent>
                                                </Popover>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                        />
                                    <FormField
                                        control={form.control}
                                        name="scheduledAtTime"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Scheduled Time</FormLabel>
                                            <FormControl>
                                                <Input type="time" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                        />
                                </div>
                            )}
                            <FormField
                                control={form.control}
                                name="delay"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Delay Between Sends</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="1000" {...field} />
                                    </FormControl>
                                    <FormDescription>In milliseconds (e.g., 1000ms = 1 second).</FormDescription>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                             <FormField
                                control={form.control}
                                name="speedLimit"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Speed Limit (Optional)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="0" {...field} />
                                    </FormControl>
                                     <FormDescription>Max emails per hour. 0 for unlimited.</FormDescription>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                        </CardContent>
                    </Card>
                </div>
            </div>
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => router.push('/campaigns')}>Cancel</Button>
                <Button type="submit">Create Campaign</Button>
            </div>
        </form>
      </Form>
    </>
  );
}

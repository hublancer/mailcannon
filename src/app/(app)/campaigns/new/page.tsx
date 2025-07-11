
'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, Wand2, Loader2, Trash2, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PageHeader } from '@/components/page-header';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { getSmtpAccounts, type SmtpAccount } from '@/services/smtp';
import { getRecipientLists, type RecipientList } from '@/services/recipients';
import { addCampaign } from '@/services/campaigns';
import { AIGeneratorDialog } from '@/components/ai-generator-dialog';

const formSchema = z.object({
  campaignName: z.string().min(3, 'Campaign name must be at least 3 characters.'),
  smtpAccountId: z.string({ required_error: 'Please select an SMTP account.' }),
  recipientListId: z.string({ required_error: 'Please select a recipient list.' }),
  emailVariants: z.array(z.object({
    subject: z.string().min(5, 'Email subject must be at least 5 characters.'),
    body: z.string().min(20, 'Email body must be at least 20 characters.'),
  })).min(1, 'You must have at least one email variant.'),
  scheduleSend: z.boolean().default(false),
  scheduledAtDate: z.date().optional(),
  scheduledAtTime: z.string().optional(),
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
  const searchParams = useSearchParams();
  const recipientListIdFromQuery = searchParams.get('recipientListId');

  const { toast } = useToast();
  const [user, setUser] = React.useState(auth.currentUser);
  const [smtpAccounts, setSmtpAccounts] = React.useState<SmtpAccount[]>([]);
  const [recipientLists, setRecipientLists] = React.useState<RecipientList[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isAiDialogOpen, setIsAiDialogOpen] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      campaignName: '',
      scheduleSend: false,
      recipientListId: recipientListIdFromQuery ?? undefined,
      speedLimit: 0,
      emailVariants: [{ subject: '', body: '' }],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "emailVariants"
  });

  React.useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  React.useEffect(() => {
    if (user) {
        setIsLoading(true);
        const unsubSmtp = getSmtpAccounts(user.uid, setSmtpAccounts);
        const unsubRecipients = getRecipientLists(user.uid, setRecipientLists);
        setIsLoading(false);
        return () => {
            unsubSmtp();
            unsubRecipients();
        };
    }
  }, [user]);

  const watchScheduleSend = form.watch('scheduleSend');

  async function onSubmit(data: FormValues) {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to create a campaign.' });
      return;
    }
    setIsSubmitting(true);
    
    let scheduledAt: Date | null = null;
    if (data.scheduleSend && data.scheduledAtDate && data.scheduledAtTime) {
      const [hours, minutes] = data.scheduledAtTime.split(':');
      scheduledAt = new Date(data.scheduledAtDate);
      scheduledAt.setHours(parseInt(hours, 10), parseInt(minutes, 10));
    }

    try {
        await addCampaign(user.uid, {
            ...data,
            scheduledAt,
        });
        toast({
            title: "Campaign Created!",
            description: "Your new campaign has been successfully saved.",
        });
        router.push('/campaigns');
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Failed to create campaign',
            description: (error as Error).message,
        });
    } finally {
        setIsSubmitting(false);
    }
  }

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
                            <CardDescription>Give your campaign a name.</CardDescription>
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
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Email Content</CardTitle>
                                    <CardDescription>Create one or more email variants for this campaign.</CardDescription>
                                </div>
                                <Button variant="outline" type="button" onClick={() => setIsAiDialogOpen(true)}>
                                    <Wand2 className="mr-2" />
                                    Generate with AI
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
                                {fields.map((field, index) => (
                                    <AccordionItem value={`item-${index}`} key={field.id}>
                                        <AccordionTrigger>
                                            <div className="flex justify-between w-full pr-4 items-center">
                                                <span>Variant {index + 1}</span>
                                                {fields.length > 1 && (
                                                    <Button asChild variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); remove(index); }} className="h-8 w-8">
                                                        <div>
                                                            <Trash2 className="h-4 w-4 text-destructive"/>
                                                        </div>
                                                    </Button>
                                                )}
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="space-y-4">
                                            <FormField
                                                control={form.control}
                                                name={`emailVariants.${index}.subject`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                    <FormLabel>Email Subject</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="What's new this month" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name={`emailVariants.${index}.body`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                    <FormLabel>Email Body</FormLabel>
                                                    <FormControl>
                                                        <Textarea placeholder="Hi {{firstName}}, ..." className="min-h-[200px]" {...field} />
                                                    </FormControl>
                                                     <FormDescription>Use markdown for formatting.</FormDescription>
                                                    <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-4"
                                onClick={() => append({ subject: '', body: '' })}
                            >
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Variant
                            </Button>
                             {form.formState.errors.emailVariants && (
                                <p className="text-sm font-medium text-destructive mt-2">
                                    {form.formState.errors.emailVariants.message || form.formState.errors.emailVariants.root?.message}
                                </p>
                            )}
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
                                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a list" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                        {recipientLists.map(list => (
                                            <SelectItem key={list.id} value={list.id}>{list.name} ({list.count})</SelectItem>
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
                                            <SelectItem key={account.id} value={account.id}>{account.server} ({account.username})</SelectItem>
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
                                                        disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
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
                                                <Input type="time" {...field} value={field.value ?? ""} />
                                            </FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                        />
                                </div>
                            )}
                             <FormField
                                control={form.control}
                                name="speedLimit"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Speed Limit</FormLabel>
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
                <Button variant="outline" type="button" onClick={() => router.push('/campaigns')}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Campaign
                </Button>
            </div>
        </form>
      </Form>
      <AIGeneratorDialog 
        isOpen={isAiDialogOpen}
        onOpenChange={setIsAiDialogOpen}
        onApplyVariants={(variants) => {
            replace(variants);
            toast({
                title: "Content Applied!",
                description: `${variants.length} AI-generated variants have been added to your campaign.`,
            });
        }}
      />
    </>
  );
}

'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/page-header';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';

const profileFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, 'New password must be at least 6 characters.').optional().or(z.literal('')),
}).refine(data => {
    if (data.newPassword && !data.currentPassword) {
      return false;
    }
    return true;
}, {
    message: 'Current password is required to set a new password.',
    path: ['currentPassword'],
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const [user, setUser] = React.useState(auth.currentUser);
  const [isLoading, setIsLoading] = React.useState(false);
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      email: '',
      currentPassword: '',
      newPassword: '',
    },
  });

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        form.reset({
          name: user.displayName || '',
          email: user.email || '',
        });
      }
    });
    return () => unsubscribe();
  }, [form]);

  async function onSubmit(data: ProfileFormValues) {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'Not authenticated.' });
      return;
    }
    setIsLoading(true);

    try {
      let requiresReauth = data.newPassword;
      if (requiresReauth && data.currentPassword) {
        const credential = EmailAuthProvider.credential(user.email!, data.currentPassword);
        await reauthenticateWithCredential(user, credential);
        
        if (data.newPassword) {
          await updatePassword(user, data.newPassword);
        }
      }

      const promises = [];
      if (user.displayName !== data.name) {
          promises.push(updateProfile(user, { displayName: data.name }));
          promises.push(updateDoc(doc(db, 'users', user.uid), { name: data.name }));
      }
      
      await Promise.all(promises);

      toast({
        title: 'Profile Updated',
        description: 'Your settings have been saved successfully.',
      });
      form.reset({ ...data, currentPassword: '', newPassword: '' });

    } catch (error: any) {
        let description = "An unexpected error occurred.";
        if (error.code === 'auth/wrong-password') {
            description = "The current password you entered is incorrect.";
        } else if (error.code === 'auth/requires-recent-login') {
            description = "This action is sensitive and requires recent authentication. Please log in again.";
        }
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description,
        });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your account settings, notifications, and software preferences."
      />
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="software">Software</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
              <CardDescription>
                Update your personal information and password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                           <Input type="email" readOnly disabled {...field} />
                        </FormControl>
                         <FormDescription>Changing email address is not supported yet.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} value={field.value ?? ''} placeholder="Enter your current password" />
                        </FormControl>
                        <FormDescription>
                          Required to change your password.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                           <Input type="password" {...field} value={field.value ?? ''} placeholder="Enter a new password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Profile
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Manage how you receive notifications from MailCannon.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-2 p-4 rounded-lg border">
                <Label htmlFor="campaign-summary" className="flex flex-col space-y-1">
                  <span>Campaign Summaries</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    Receive a summary report after a campaign is completed.
                  </span>
                </Label>
                <Switch id="campaign-summary" defaultChecked />
              </div>
              <div className="flex items-center justify-between space-x-2 p-4 rounded-lg border">
                <Label htmlFor="failed-sends" className="flex flex-col space-y-1">
                  <span>Failed Send Alerts</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    Get an immediate notification for critical send failures.
                  </span>
                </Label>
                <Switch id="failed-sends" defaultChecked />
              </div>
              <div className="flex items-center justify-between space-x-2 p-4 rounded-lg border">
                <Label htmlFor="weekly-digest" className="flex flex-col space-y-1">
                  <span>Weekly Performance Digest</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    A weekly roundup of your account's performance.
                  </span>
                </Label>
                <Switch id="weekly-digest" />
              </div>
              <Button>Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="software">
          <Card>
            <CardHeader>
              <CardTitle>Software</CardTitle>
              <CardDescription>
                Manage software updates and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <p>Current Version: <span className="font-medium">2.1.3</span></p>
                <p className="text-sm text-muted-foreground">Last checked for updates: Just now</p>
                <Button variant="outline">Check for Updates</Button>
              </div>
              <div className="flex items-center justify-between space-x-2 p-4 rounded-lg border">
                <Label htmlFor="auto-update" className="flex flex-col space-y-1">
                  <span>Automatic Updates</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    Automatically download and install updates in the background.
                  </span>
                </Label>
                <Switch id="auto-update" defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

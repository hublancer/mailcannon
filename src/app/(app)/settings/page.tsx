import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/page-header';

export default function SettingsPage() {
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
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" defaultValue="Admin User" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" defaultValue="admin@mailcannon.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" />
              </div>
              <Button>Update Profile</Button>
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

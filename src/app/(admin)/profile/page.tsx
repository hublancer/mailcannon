
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminProfilePage() {
  return (
    <>
      <PageHeader
        title="Admin Profile"
        description="Manage your admin account settings."
      />
      <Card>
        <CardHeader>
          <CardTitle>Profile Management</CardTitle>
          <CardDescription>
            This feature is coming soon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>You will be able to change your password and other profile details here.</p>
        </CardContent>
      </Card>
    </>
  );
}

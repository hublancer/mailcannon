'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { PlusCircle } from 'lucide-react';
import { AddRecipientListDialog } from '@/components/add-recipient-list-dialog';


const initialRecipientLists = [
  { name: 'Newsletter Subscribers', count: 15234, description: 'All users who subscribed to the weekly newsletter.' },
  { name: 'Active Customers (Last 90 Days)', count: 4892, description: 'Customers with a purchase in the last 3 months.' },
  { name: 'High-Value Clients', count: 350, description: 'Tier 1 and Tier 2 enterprise clients.' },
  { name: 'Potential Leads - Q3 2024', count: 820, description: 'Leads from the summer marketing campaign.' },
  { name: 'Internal Staff', count: 125, description: 'All full-time employees.' },
  { name: 'Inactive Users', count: 22108, description: 'Users who have not logged in for over 6 months.' },
];

type RecipientList = typeof initialRecipientLists[0];

export default function RecipientsPage() {
  const [recipientLists, setRecipientLists] = React.useState(initialRecipientLists);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);

  const handleAddList = (list: RecipientList) => {
    setRecipientLists((prev) => [...prev, list]);
  };

  return (
    <>
      <PageHeader
        title="Recipient Lists"
        description="Manage your audience by grouping them into lists."
      >
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusCircle className="mr-2" />
          Add List
        </Button>
      </PageHeader>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {recipientLists.map((list) => (
          <Card key={list.name}>
            <CardHeader>
              <CardTitle>{list.name}</CardTitle>
              <CardDescription>{list.count.toLocaleString()} recipients</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{list.description}</p>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button variant="outline">Manage</Button>
              <Button>Send To</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      <AddRecipientListDialog 
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddList={handleAddList}
      />
    </>
  );
}

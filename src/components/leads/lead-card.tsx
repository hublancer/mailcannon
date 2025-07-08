
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Mail, Edit, Trash2 } from 'lucide-react';
import type { Lead } from '@/services/leads';

interface LeadCardProps {
  lead: Lead;
}

export function LeadCard({ lead }: LeadCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between p-4">
        <CardTitle className="text-base font-medium truncate">{lead.name}</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled>
              <Edit className="mr-2 h-4 w-4" />
              <span>Edit</span>
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <Mail className="mr-2 h-4 w-4" />
              <span>Send Email</span>
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-2 text-sm text-muted-foreground">
        <p className="truncate"><strong>Email:</strong> {lead.email}</p>
        <p><strong>Phone:</strong> {lead.phone || 'N/A'}</p>
      </CardContent>
    </Card>
  );
}

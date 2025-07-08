
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Mail, Edit, Trash2, StickyNote, Move } from 'lucide-react';
import { leadStatuses, type Lead, type LeadStatus } from '@/services/leads';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '../ui/tooltip';

interface LeadCardProps {
  lead: Lead;
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
  onUpdateStatus: (leadId: string, status: LeadStatus) => void;
}

export function LeadCard({ lead, onEdit, onDelete, onUpdateStatus }: LeadCardProps) {
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
            <DropdownMenuItem onClick={() => onEdit(lead)}>
              <Edit className="mr-2 h-4 w-4" />
              <span>Edit</span>
            </DropdownMenuItem>
             <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                    <Move className="mr-2 h-4 w-4" />
                    <span>Move to</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                        {leadStatuses.map(status => (
                            <DropdownMenuItem 
                                key={status} 
                                onClick={() => onUpdateStatus(lead.id, status)}
                                disabled={lead.status === status}
                            >
                                {status}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuSubContent>
                </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuItem disabled>
              <Mail className="mr-2 h-4 w-4" />
              <span>Send Email</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => onDelete(lead)}>
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-2 text-sm text-muted-foreground">
        <p className="truncate"><strong>Email:</strong> {lead.email}</p>
        <div className="flex justify-between items-center">
            <p className="truncate"><strong>Phone:</strong> {lead.phone || 'N/A'}</p>
            {lead.note && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <StickyNote className="h-4 w-4 text-primary cursor-pointer"/>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs whitespace-pre-wrap">
                            <p>{lead.note}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
        </div>
      </CardContent>
    </Card>
  );
}

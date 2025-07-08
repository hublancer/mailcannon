
'use client';

import * as React from 'react';
import { leadStatuses, type Lead, type LeadStatus } from '@/services/leads';
import { LeadCard } from './lead-card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface LeadKanbanBoardProps {
  leads: Lead[];
}

export function LeadKanbanBoard({ leads }: LeadKanbanBoardProps) {
  const groupedLeads = React.useMemo(() => {
    const initialGroups: Record<LeadStatus, Lead[]> = {
      'New': [],
      'Active': [],
      'Deal': [],
      'Done': [],
    };
    return leads.reduce((acc, lead) => {
      if (acc[lead.status]) {
        acc[lead.status].push(lead);
      }
      return acc;
    }, initialGroups);
  }, [leads]);

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-4 pb-4">
        {leadStatuses.map((status) => (
          <div key={status} className="w-72 shrink-0">
            <div className="flex items-center justify-between p-2 mb-2 bg-secondary rounded-md">
              <h3 className="font-semibold">{status}</h3>
              <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-background">
                {groupedLeads[status].length}
              </span>
            </div>
            <div className="space-y-3 p-1 h-[calc(100vh-250px)] overflow-y-auto rounded-md">
              {groupedLeads[status].map((lead) => (
                <LeadCard key={lead.id} lead={lead} />
              ))}
              {groupedLeads[status].length === 0 && (
                <div className="flex items-center justify-center h-24 border-2 border-dashed rounded-md text-muted-foreground">
                    <p className="text-sm">Empty</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

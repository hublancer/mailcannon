'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import {
  Send,
  Users,
  Server,
  Sparkles,
  LineChart,
  FileText,
  Settings,
  CircleUser,
  PanelLeft,
} from 'lucide-react';
import { MailCannonIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const navItems = [
  { href: '/campaigns', icon: Send, label: 'Campaigns' },
  { href: '/recipients', icon: Users, label: 'Recipients' },
  { href: '/smtp-accounts', icon: Server, label: 'SMTP Accounts' },
  { href: '/ai-generator', icon: Sparkles, label: 'AI Generator' },
  { href: '/tracking', icon: LineChart, label: 'Tracking' },
  { href: '/logs', icon: FileText, label: 'Logs' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  const sidebarContent = (
    <>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <MailCannonIcon className="w-8 h-8 text-primary" />
          <span className="text-xl font-semibold font-headline">MailCannon</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href)}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/settings'} tooltip="Settings">
              <Link href="/settings">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
             <SidebarMenuButton asChild tooltip="Profile">
                <Link href="/settings">
                    <CircleUser />
                    <span>User Profile</span>
                </Link>
             </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );

  if (isMobile) {
    return (
      <SidebarProvider>
        <div className="flex flex-col min-h-screen">
          <header className="sticky top-0 z-10 flex items-center justify-between h-14 px-4 border-b bg-background">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <PanelLeft className="w-6 h-6" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[300px] bg-sidebar text-sidebar-foreground">
                  <SidebarHeader className="p-4 border-b">
                      <div className="flex items-center gap-2">
                      <MailCannonIcon className="w-8 h-8 text-primary" />
                      <span className="text-xl font-semibold font-headline">MailCannon</span>
                      </div>
                  </SidebarHeader>
                  <div className="flex flex-col h-[calc(100%-65px)]">
                      <SidebarContent className="flex-1 p-2 overflow-y-auto">
                          <SidebarMenu>
                          {navItems.map((item) => (
                              <SidebarMenuItem key={item.href}>
                              <SidebarMenuButton
                                  asChild
                                  isActive={pathname.startsWith(item.href)}
                              >
                                  <Link href={item.href}>
                                  <item.icon />
                                  <span>{item.label}</span>
                                  </Link>
                              </SidebarMenuButton>
                              </SidebarMenuItem>
                          ))}
                          </SidebarMenu>
                      </SidebarContent>
                      <SidebarFooter className="p-2 mt-auto border-t">
                          <SidebarMenu>
                          <SidebarMenuItem>
                              <SidebarMenuButton asChild isActive={pathname === '/settings'} tooltip="Settings">
                              <Link href="/settings">
                                  <Settings />
                                  <span>Settings</span>
                              </Link>
                              </SidebarMenuButton>
                          </SidebarMenuItem>
                          <SidebarMenuItem>
                            <SidebarMenuButton asChild tooltip="Profile">
                                <Link href="/settings">
                                    <CircleUser />
                                    <span>User Profile</span>
                                </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                          </SidebarMenu>
                      </SidebarFooter>
                  </div>
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2 font-semibold">
               <MailCannonIcon className="w-6 h-6 text-primary" />
               <span className="font-headline">MailCannon</span>
            </div>
            <Button variant="ghost" size="icon">
              <CircleUser className="w-6 h-6" />
            </Button>
          </header>
          <main className="flex-1 p-4 overflow-auto">{children}</main>
        </div>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <Sidebar
        collapsible="icon"
        className="border-r"
      >
        {sidebarContent}
      </Sidebar>
      <SidebarInset>
        <div className="p-4 lg:p-6">
            {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

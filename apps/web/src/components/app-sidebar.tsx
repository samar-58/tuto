import {
    Calendar,
    Home,
    Settings,
    Video,
    Trophy,
    LogOut,
    User,
    Activity
} from "lucide-react"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarSeparator,
} from "@/components/ui/sidebar"
import { Link, useLocation } from "@tanstack/react-router"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Menu items.
const items = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: Home,
    },
    {
        title: "Classes",
        url: "/meetings",
        icon: Calendar,
    },
    {
        title: "Recordings",
        url: "/recordings",
        icon: Video,
    },
    {
        title: "Performance",
        url: "/performance", // Placeholder
        icon: Activity,
    },
    {
        title: "Tournaments",
        url: "/tournaments", // Placeholder
        icon: Trophy,
    },
]

export function AppSidebar() {
    const { data: session } = authClient.useSession()
    const location = useLocation()

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader className="h-16 flex items-center justify-center border-b border-sidebar-border/50 px-4">
                <div className="flex items-center justify-center w-full">
                    <span className="group-data-[collapsible=icon]:hidden font-bold text-2xl text-sidebar-primary tracking-tight">
                        Tuto
                    </span>
                </div>
            </SidebarHeader>
            <SidebarContent className="px-2 py-4">
                <SidebarGroup>
                    <SidebarGroupLabel className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60">
                        Platform
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="space-y-1">
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={location.pathname === item.url}
                                        tooltip={item.title}
                                        className="group relative rounded-lg transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:shadow-sm"
                                    >
                                        <Link to={item.url} className="flex items-center gap-3">
                                            <item.icon className="size-5 shrink-0" />
                                            <span className="font-medium">{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarSeparator className="my-4 mx-3" />

                <SidebarGroup>
                    <SidebarGroupLabel className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60">
                        Settings
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton 
                                    asChild 
                                    tooltip="Settings"
                                    isActive={location.pathname === "/settings"}
                                    className="group relative rounded-lg transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:shadow-sm"
                                >
                                    <Link to="/settings" className="flex items-center gap-3">
                                        <Settings className="size-5 shrink-0" />
                                        <span className="font-medium">Settings</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="border-t border-sidebar-border/50 p-3">
                {session ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuButton
                                size="lg"
                                className="w-full rounded-lg data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
                            >
                                <Avatar className="h-9 w-9 rounded-lg border-2 border-sidebar-border">
                                    <AvatarImage src={session.user.image || ''} alt={session.user.name || ''} />
                                    <AvatarFallback className="rounded-lg bg-sidebar-accent text-sidebar-accent-foreground font-semibold">
                                        {session.user.name?.slice(0, 2).toUpperCase() || 'CN'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">{session.user.name}</span>
                                    <span className="truncate text-xs text-sidebar-foreground/70">{session.user.email}</span>
                                </div>
                                <User className="ml-auto size-4 opacity-60" />
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                            side="bottom"
                            align="end"
                            sideOffset={4}
                        >
                            <DropdownMenuItem onClick={() => authClient.signOut()} className="cursor-pointer">
                                <LogOut className="mr-2 h-4 w-4" />
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <Button variant="outline" className="w-full justify-start gap-2 rounded-lg" asChild>
                        <Link to="/login">
                            <User className="h-4 w-4" />
                            <span>Sign In</span>
                        </Link>
                    </Button>
                )}
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}

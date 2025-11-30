import { createFileRoute, Link } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Plus,
    Video,
    Calendar,
    Loader2,
    AlertCircle,
    Trophy,
    Activity,
    TrendingUp,
    ArrowUpRight
} from 'lucide-react'
import { useTRPC } from '@/utils/trpc'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { authClient } from '@/lib/auth-client'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'


export const Route = createFileRoute('/dashboard')({
    component: RouteComponent,
})

function RouteComponent() {
    const trpc = useTRPC()
    const { data: meetings, isLoading, error } = useQuery(trpc.meeting.getMeetings.queryOptions())
    const { data: session } = authClient.useSession()

    const stats = useMemo(() => {
        if (!meetings) return { total: 0, thisWeek: 0, hours: 0 }

        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

        const thisWeekMeetings = meetings.filter(m =>
            new Date(m.createdAt.toString()) > oneWeekAgo
        )

        return {
            total: meetings.length,
            thisWeek: thisWeekMeetings.length,
            hours: Math.floor(meetings.length * 1.2) // Mock hours
        }
    }, [meetings])


    const recentMeetings = useMemo(() => {
        if (!meetings) return []
        return [...meetings]
            .sort((a, b) => new Date(b.createdAt.toString()).getTime() - new Date(a.createdAt.toString()).getTime())
            .slice(0, 3)
    }, [meetings])

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="bg-background overflow-hidden">

                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">
                                Game, Set, Match, {session?.user.name?.split(' ')[0] || 'Player'}!
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Your performance overview for today.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20">
                                <Link to="/meetings">
                                    <Plus className="mr-2 h-4 w-4" />
                                    New Match
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                            <p className="text-muted-foreground">Loading stats...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <AlertCircle className="w-12 h-12 text-destructive mb-4" />
                            <p className="text-destructive font-semibold">Failed to load data</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-4 md:grid-cols-3">
                                <StatsCard
                                    title="Total Matches"
                                    value={stats.total}
                                    trend={stats.thisWeek}
                                    icon={Trophy}
                                    delay={100}
                                />
                                <StatsCard
                                    title="Training Hours"
                                    value={stats.hours}
                                    trend={Math.floor(stats.thisWeek * 1.2)}
                                    icon={Activity}
                                    delay={200}
                                    suffix="h"
                                />
                                <StatsCard
                                    title="Recordings"
                                    value={stats.total}
                                    trend={stats.thisWeek}
                                    icon={Video}
                                    delay={300}
                                />
                            </div>

                            <div className="grid gap-6 md:grid-cols-7 lg:grid-cols-7">
                                <Card className="md:col-span-4 border-border/60 shadow-sm animate-fade-in [animation-delay:400ms]">
                                    <CardHeader>
                                        <CardTitle>Recent Activity</CardTitle>
                                        <CardDescription>Your latest sessions on the court.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {meetings && meetings.length === 0 ? (
                                            <div className="text-center py-10">
                                                <div className="bg-muted/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <Trophy className="w-8 h-8 text-muted-foreground/50" />
                                                </div>
                                                <h3 className="text-lg font-medium">No matches yet</h3>
                                                <p className="text-muted-foreground text-sm mt-1 mb-4">Start your first session to see stats here.</p>
                                                <Button variant="outline" asChild>
                                                    <Link to="/meetings">Create Class</Link>
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {recentMeetings.map((meeting) => (
                                                    <div key={meeting.id} className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-card hover:bg-accent/5 transition-colors group">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                                <Video className="h-5 w-5" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-sm">{meeting.name}</p>
                                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                                    <Calendar className="h-3 w-3" />
                                                                    {new Date(meeting.createdAt.toString()).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <Button variant="ghost" size="icon" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Link to="/meeting/$uuid" params={{ uuid: meeting.id }}>
                                                                <ArrowUpRight className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <div className="md:col-span-3 space-y-6 animate-fade-in [animation-delay:500ms]">
                                    <Card className="bg-gradient-to-br from-secondary/40 to-secondary/10 border-none shadow-md overflow-hidden relative">
                                        <div className="absolute inset-0 pointer-events-none opacity-10">
                                            <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white"></div>
                                            <div className="absolute top-0 bottom-0 left-1/2 w-[2px] bg-white"></div>
                                            <div className="absolute top-[20%] bottom-[20%] left-[20%] right-[20%] border-2 border-white"></div>
                                        </div>

                                        <CardHeader>
                                            <CardTitle className="text-foreground">Court Status</CardTitle>
                                            <CardDescription className="text-foreground/70">Ready for your next match?</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4 relative z-10">
                                                <div className="flex items-center justify-between bg-background/40 backdrop-blur-md p-3 rounded-lg">
                                                    <span className="text-sm font-medium">Next Session</span>
                                                    <Badge variant="secondary" className="bg-primary/20 text-primary-foreground hover:bg-primary/30">Today, 4 PM</Badge>
                                                </div>
                                                <div className="flex items-center justify-between bg-background/40 backdrop-blur-md p-3 rounded-lg">
                                                    <span className="text-sm font-medium">Court Type</span>
                                                    <span className="text-sm text-muted-foreground">Clay</span>
                                                </div>
                                                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg" asChild>
                                                    <Link to="/meetings">
                                                        Start Session
                                                    </Link>
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-border/60">
                                        <CardHeader>
                                            <CardTitle>Performance Trend</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="h-[150px] flex items-end justify-between gap-2 px-2">
                                                {[40, 65, 45, 80, 55, 90, 75].map((h, i) => (
                                                    <div key={i} className="w-full bg-primary/20 rounded-t-sm hover:bg-primary/40 transition-colors relative group">
                                                        <div
                                                            className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-sm transition-all duration-500"
                                                            style={{ height: `${h}%` }}
                                                        ></div>
                                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                                                            {h}%
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                                                <span>Mon</span>
                                                <span>Sun</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}

function StatsCard({ title, value, trend, icon: Icon, delay, suffix = '' }: { title: string, value: number, trend: number, icon: any, delay: number, suffix?: string }) {
    return (
        <Card className={`overflow-hidden border-border/60 shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in`} style={{ animationDelay: `${delay}ms` }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}{suffix}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                    {trend > 0 ? (
                        <span className="text-primary flex items-center mr-1">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            +{trend}
                        </span>
                    ) : (
                        <span className="text-muted-foreground mr-1">0</span>
                    )}
                    <span className="opacity-70">this week</span>
                </p>
            </CardContent>
        </Card>
    )
}


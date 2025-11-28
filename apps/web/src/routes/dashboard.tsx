import { createFileRoute, Link } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { PlayCircle, Plus, Video, Users, Clock, Calendar, Loader2, AlertCircle, User } from 'lucide-react'
import { useTRPC } from '@/utils/trpc'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { authClient } from '@/lib/auth-client'

export const Route = createFileRoute('/dashboard')({
    component: RouteComponent,
})

const r2Url = import.meta.env.VITE_R2_URL

function RouteComponent() {
    const trpc = useTRPC()
    const { data: meetings, isLoading, error } = useQuery(trpc.meeting.getMeetings.queryOptions())
    const { data: session } = authClient.useSession()

    const stats = useMemo(() => {
        if (!meetings) return { total: 0, thisWeek: 0 }

        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

        const thisWeekMeetings = meetings.filter(m =>
            new Date(m.createdAt.toString()) > oneWeekAgo
        )

        return {
            total: meetings.length,
            thisWeek: thisWeekMeetings.length
        }
    }, [meetings])

    // Get recent meetings (last 3)
    const recentMeetings = useMemo(() => {
        if (!meetings) return []
        return [...meetings]
            .sort((a, b) => new Date(b.createdAt.toString()).getTime() - new Date(a.createdAt.toString()).getTime())
            .slice(0, 3)
    }, [meetings])

    return (
        <div className="min-h-screen bg-background">

            <main className="container mx-auto px-4 py-8">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                            Welcome back
                        </h1>
                        <p className="text-muted-foreground text-lg">Here's what's happening with your classes today</p>
                    </div>
                    {session && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full"
                                >
                                    <Avatar className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                                        {session.user.image && (
                                            <AvatarImage src={session.user.image} alt={session.user.name || 'User'} />
                                        )}
                                        <AvatarFallback className="bg-primary/10 text-primary">
                                            {session.user.name
                                                ? session.user.name
                                                    .split(' ')
                                                    .map(n => n[0])
                                                    .join('')
                                                    .toUpperCase()
                                                    .slice(0, 2)
                                                : <User className="h-5 w-5" />}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                sideOffset={12}
                                className="w-72 overflow-hidden rounded-2xl border border-border/60 bg-popover/95 p-0 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-background/80"
                            >
                                <div className="flex items-center gap-4 px-4 py-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
                                    <Avatar className="h-14 w-14 ring-2 ring-primary/30 shadow-lg">
                                        {session.user.image && (
                                            <AvatarImage src={session.user.image} alt={session.user.name || 'User'} />
                                        )}
                                        <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                                            {session.user.name
                                                ? session.user.name
                                                    .split(' ')
                                                    .map(n => n[0])
                                                    .join('')
                                                    .toUpperCase()
                                                    .slice(0, 2)
                                                : <User className="h-6 w-6" />}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-1">
                                        <p className="text-sm uppercase tracking-wide text-primary/80">Signed in as</p>
                                        <p className="text-lg font-semibold leading-none">{session.user.name || 'User'}</p>
                                        <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                                            {session.user.email || 'Not provided'}
                                        </p>
                                    </div>
                                </div>
                                <DropdownMenuSeparator className="bg-border/60" />
                                <div className="px-4 py-3 space-y-3 text-sm">
                                    <div className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Email Status</p>
                                            <p className="text-sm font-medium">{session.user.emailVerified ? 'Verified' : 'Not verified'}</p>
                                        </div>
                                        <Badge variant={session.user.emailVerified ? "default" : "secondary"}>
                                            {session.user.emailVerified ? "Verified" : "Pending"}
                                        </Badge>
                                    </div>
                                    {session.user.image && (
                                        <div className="rounded-lg border border-border/70 px-3 py-2 bg-muted/40">
                                            <p className="text-xs text-muted-foreground mb-1">Profile Image URL</p>
                                            <p className="text-[11px] break-all text-muted-foreground">{session.user.image}</p>
                                        </div>
                                    )}
                                </div>
                                <DropdownMenuSeparator className="bg-border/60" />
                                <div className="px-4 py-3 flex gap-2">
                                    <DropdownMenuItem asChild className="p-0">
                                        <Button variant="outline" className="w-full justify-center text-xs" asChild>
                                            <Link to="/dashboard">View Dashboard</Link>
                                        </Button>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild className="p-0">
                                        <Button variant="ghost" className="w-full justify-center text-xs" asChild>
                                            <Link to="/recordings">Recordings</Link>
                                        </Button>
                                    </DropdownMenuItem>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>


                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground">Loading your dashboard...</p>
                    </div>
                )}

                {error && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
                        <p className="text-destructive font-semibold mb-2">Failed to load dashboard</p>
                        <p className="text-muted-foreground text-sm">
                            {error instanceof Error ? error.message : 'Unknown error occurred'}
                        </p>
                    </div>
                )}

                {!isLoading && !error && (
                    <>
                        <div className="grid gap-6 md:grid-cols-3 mb-8">
                            <Card className="relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Classes</CardTitle>
                                        <Video className="h-4 w-4 text-primary" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">{stats.total}</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {stats.thisWeek > 0 && <span className="text-primary">+{stats.thisWeek}</span>} {stats.thisWeek > 0 ? 'this week' : 'No new classes this week'}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Recordings</CardTitle>
                                        <PlayCircle className="h-4 w-4 text-primary" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">{stats.total}</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {stats.thisWeek > 0 && <span className="text-primary">+{stats.thisWeek}</span>} {stats.thisWeek > 0 ? 'this week' : 'No new recordings this week'}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">Hours Taught</CardTitle>
                                        <Users className="h-4 w-4 text-primary" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">{Math.floor(stats.total * 1.2)}</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Approximate hours
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="mb-8 flex gap-3">
                            <Button asChild className="shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
                                <Link to="/meetings">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create New Class
                                </Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link to="/recordings">
                                    <Video className="h-4 w-4 mr-2" />
                                    View All Recordings
                                </Link>
                            </Button>
                        </div>

                        {meetings && meetings.length === 0 ? (
                            <Card>
                                <CardContent className="py-16 text-center">
                                    <Video className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No classes yet</h3>
                                    <p className="text-muted-foreground mb-6">Create your first class to get started</p>
                                    <Button asChild>
                                        <Link to="/meetings">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Create Your First Class
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-8 lg:grid-cols-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Recent Classes</CardTitle>
                                        <CardDescription>Your latest sessions</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {recentMeetings.map((meeting) => (
                                            <MeetingItem
                                                key={meeting.id}
                                                id={meeting.id}
                                                title={meeting.name}
                                                description={meeting.description}
                                                createdAt={new Date(meeting.createdAt.toString())}
                                            />
                                        ))}

                                        {meetings && meetings.length > 3 && (
                                            <Button variant="ghost" className="w-full mt-2" asChild>
                                                <Link to="/meetings">
                                                    View All Classes →
                                                </Link>
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Recent Recordings</CardTitle>
                                        <CardDescription>Latest class recordings available</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {recentMeetings.map((meeting) => (
                                            <RecordingItem
                                                key={meeting.id}
                                                id={meeting.id}
                                                title={meeting.name}
                                                createdAt={new Date(meeting.createdAt.toString())}
                                                playlistUrl={`${r2Url}/${meeting.id}.m3u8`}
                                            />
                                        ))}

                                        {meetings && meetings.length > 3 && (
                                            <Button variant="ghost" className="w-full mt-2" asChild>
                                                <Link to="/recordings">
                                                    View All Recordings →
                                                </Link>
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    )
}

function MeetingItem({
    id,
    title,
    description,
    createdAt
}: {
    id: string
    title: string
    description: string
    createdAt: Date
}) {
    const timeAgo = getTimeAgo(createdAt)

    return (
        <Link to="/meeting/$uuid" params={{ uuid: id }}>
            <div className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                    <Calendar className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-sm truncate">{title}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{description}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {timeAgo}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    )
}

function RecordingItem({
    id,
    title,
    createdAt,
    playlistUrl
}: {
    id: string
    title: string
    createdAt: Date
    playlistUrl: string
}) {
    const timeAgo = getTimeAgo(createdAt)

    return (
        <Link to="/recordings">
            <div className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                    <PlayCircle className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-sm truncate">{title}</h4>
                        <Badge variant="outline" className="text-xs whitespace-nowrap">
                            Recording
                        </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{timeAgo}</span>
                    </div>
                </div>
            </div>
        </Link>
    )
}

function getTimeAgo(date: Date): string {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`

    return date.toLocaleDateString()
}

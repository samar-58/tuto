import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import {
    Play,
    Calendar,
    Clock,
    Loader2,
    AlertCircle,
    Video,
    Plus,
    Grid3X3,
    List,
    Search,
    ChevronRight,
    Sparkles
} from 'lucide-react';
import { useTRPC } from '@/utils/trpc';
import { useQuery } from '@tanstack/react-query';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';

interface Recording {
    id: string;
    playlistUrl: string;
    title: string;
    description: string;
    duration: string;
    createdAt: Date;
    thumbnailUrl?: string;
    meetingId: string;
}

const r2Url = import.meta.env.VITE_R2_URL;

export const Route = createFileRoute('/recordings')({
    component: RecordingsPage,
});

function RecordingsPage() {
    const navigate = useNavigate();
    const trpc = useTRPC();
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const { data, isLoading, error, refetch, isFetching } = useQuery(trpc.meeting.getMeetings.queryOptions());

    const recordings = useMemo<Recording[]>(() => {
        if (!data) return [];

        return data.map((meeting) => ({
            id: meeting.id,
            playlistUrl: `${r2Url}/${meeting.id}.m3u8`,
            title: meeting.name,
            description: meeting.description,
            duration: 'N/A',
            createdAt: new Date(meeting.createdAt.toString()),
            meetingId: meeting.id,
        }));
    }, [data]);

    const filteredRecordings = useMemo(() => {
        if (!searchQuery.trim()) return recordings;
        const query = searchQuery.toLowerCase();
        return recordings.filter(
            (rec) =>
                rec.title.toLowerCase().includes(query) ||
                rec.description.toLowerCase().includes(query)
        );
    }, [recordings, searchQuery]);

    const isPriming = (!data && (isLoading || isFetching)) || (isLoading && recordings.length === 0);

    // Stats
    const stats = useMemo(() => {
        const now = new Date();
        const thisWeek = recordings.filter((r) => {
            const diff = now.getTime() - r.createdAt.getTime();
            return diff < 7 * 24 * 60 * 60 * 1000;
        });
        const thisMonth = recordings.filter((r) => {
            const diff = now.getTime() - r.createdAt.getTime();
            return diff < 30 * 24 * 60 * 60 * 1000;
        });
        return {
            total: recordings.length,
            thisWeek: thisWeek.length,
            thisMonth: thisMonth.length,
        };
    }, [recordings]);

    const handleRecordingClick = (recordingId: string) => {
        navigate({ to: '/recording/$id', params: { id: recordingId } });
    };

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="bg-background overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                    <div className="min-h-screen bg-background relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />

                        <div className="container mx-auto px-4 py-6 lg:py-8 relative z-10">
                            <div className="mb-8 animate-fade-in">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                                    <div>
                                        <h1 className="text-3xl lg:text-4xl font-bold mb-2 bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                                            My Recordings
                                        </h1>
                                        <p className="text-muted-foreground">
                                            Browse, watch, and get AI summaries of your class recordings
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
                                            <Loader2 className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                                            Refresh
                                        </Button>
                                        <Button asChild>
                                            <Link to="/meetings">
                                                <Plus className="mr-2 h-4 w-4" />
                                                New Class
                                            </Link>
                                        </Button>
                                    </div>
                                </div>

                                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 overflow-hidden relative">
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full blur-2xl" />
                                        <CardContent className="p-5 relative">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs uppercase text-muted-foreground tracking-wide font-medium">Total Recordings</p>
                                                    <p className="text-3xl font-bold mt-1">{stats.total}</p>
                                                </div>
                                                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                                                    <Video className="w-6 h-6 text-primary" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card className="border-border/60 overflow-hidden relative">
                                        <CardContent className="p-5 relative">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs uppercase text-muted-foreground tracking-wide font-medium">This Week</p>
                                                    <p className="text-3xl font-bold mt-1">{stats.thisWeek}</p>
                                                </div>
                                                <div className="h-12 w-12 rounded-xl bg-secondary/30 flex items-center justify-center">
                                                    <Calendar className="w-6 h-6 text-foreground" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card className="border-border/60 overflow-hidden relative">
                                        <CardContent className="p-5 relative">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs uppercase text-muted-foreground tracking-wide font-medium">This Month</p>
                                                    <p className="text-3xl font-bold mt-1">{stats.thisMonth}</p>
                                                </div>
                                                <div className="h-12 w-12 rounded-xl bg-accent/50 flex items-center justify-center">
                                                    <Sparkles className="w-6 h-6 text-foreground" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>

                            <div className="mb-6 flex flex-col sm:flex-row gap-3 animate-fade-in [animation-delay:100ms]">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search recordings..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 h-11"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant={viewMode === 'grid' ? 'default' : 'outline'}
                                        size="icon"
                                        onClick={() => setViewMode('grid')}
                                        className="h-11 w-11"
                                    >
                                        <Grid3X3 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant={viewMode === 'list' ? 'default' : 'outline'}
                                        size="icon"
                                        onClick={() => setViewMode('list')}
                                        className="h-11 w-11"
                                    >
                                        <List className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {isPriming && (
                                <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-3'} animate-fade-in`}>
                                    {[...Array(8)].map((_, idx) => (
                                        <Card key={idx} className="border-border/60 overflow-hidden">
                                            <CardContent className="p-0">
                                                <Skeleton className="aspect-video w-full" />
                                                <div className="p-4 space-y-2">
                                                    <Skeleton className="h-5 w-3/4" />
                                                    <Skeleton className="h-4 w-1/2" />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}

                            {/* Error State */}
                            {!isPriming && error && (
                                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 animate-fade-in">
                                    <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
                                        <AlertCircle className="w-10 h-10 text-destructive" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-semibold">Failed to load recordings</p>
                                        <p className="text-muted-foreground text-sm mt-1">
                                            {error instanceof Error ? error.message : 'Unknown error occurred'}
                                        </p>
                                    </div>
                                    <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
                                        <Loader2 className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                                        Retry
                                    </Button>
                                </div>
                            )}

                            {!isPriming && !error && recordings.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 animate-fade-in">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                                        <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                                            <Play className="w-12 h-12 text-primary" />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xl font-semibold">No recordings yet</p>
                                        <p className="text-muted-foreground text-sm mt-1 max-w-md">
                                            Start a class and record it to see your recordings here.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Button asChild>
                                            <Link to="/meetings">
                                                <Plus className="mr-2 h-4 w-4" />
                                                Start a Class
                                            </Link>
                                        </Button>
                                        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
                                            Refresh
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {!isPriming && !error && recordings.length > 0 && filteredRecordings.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 animate-fade-in">
                                    <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                                        <Search className="w-10 h-10 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-semibold">No results found</p>
                                        <p className="text-muted-foreground text-sm mt-1">
                                            Try adjusting your search query
                                        </p>
                                    </div>
                                    <Button variant="outline" onClick={() => setSearchQuery('')}>
                                        Clear Search
                                    </Button>
                                </div>
                            )}

                            {!isPriming && !error && filteredRecordings.length > 0 && (
                                <div className="animate-fade-in [animation-delay:150ms]">
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-sm text-muted-foreground">
                                            Showing <span className="font-medium text-foreground">{filteredRecordings.length}</span> recording{filteredRecordings.length !== 1 ? 's' : ''}
                                        </p>
                                    </div>

                                    {viewMode === 'grid' ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                            {filteredRecordings.map((recording, idx) => (
                                                <RecordingCard
                                                    key={recording.id}
                                                    recording={recording}
                                                    onClick={() => handleRecordingClick(recording.id)}
                                                    delay={idx * 50}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {filteredRecordings.map((recording, idx) => (
                                                <RecordingListItem
                                                    key={recording.id}
                                                    recording={recording}
                                                    onClick={() => handleRecordingClick(recording.id)}
                                                    delay={idx * 50}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}

// Recording Card Component (Grid View)
function RecordingCard({ recording, onClick, delay }: { recording: Recording; onClick: () => void; delay: number }) {
    return (
        <Card
            className="border-border/60 overflow-hidden cursor-pointer group hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 animate-fade-in"
            style={{ animationDelay: `${delay}ms` }}
            onClick={onClick}
        >
            <CardContent className="p-0">
                {/* Thumbnail/Video Preview */}
                <div className="relative aspect-video bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/30 transition-all duration-300">
                            <Play className="w-7 h-7 text-primary ml-1" />
                        </div>
                    </div>
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                    {/* Badge */}
                    <Badge className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm text-foreground border-none">
                        <Video className="w-3 h-3 mr-1" />
                        Recording
                    </Badge>
                </div>

                {/* Info */}
                <div className="p-4 space-y-2">
                    <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors duration-200">
                        {recording.title}
                    </h3>
                    {recording.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                            {recording.description}
                        </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                        <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {recording.createdAt.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                            })}
                        </span>
                        {recording.duration !== 'N/A' && (
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {recording.duration}
                            </span>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Recording List Item Component (List View)
function RecordingListItem({ recording, onClick, delay }: { recording: Recording; onClick: () => void; delay: number }) {
    return (
        <Card
            className="border-border/60 overflow-hidden cursor-pointer group hover:border-primary/50 hover:shadow-lg transition-all duration-300 animate-fade-in"
            style={{ animationDelay: `${delay}ms` }}
            onClick={onClick}
        >
            <CardContent className="p-4">
                <div className="flex items-center gap-4">
                    {/* Thumbnail */}
                    <div className="relative h-20 w-32 flex-shrink-0 bg-gradient-to-br from-muted to-muted/50 rounded-lg overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/30 transition-all duration-300">
                                <Play className="w-5 h-5 text-primary ml-0.5" />
                            </div>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors duration-200">
                                {recording.title}
                            </h3>
                            <Badge variant="secondary" className="flex-shrink-0 bg-primary/10 text-primary">
                                <Sparkles className="w-3 h-3 mr-1" />
                                AI Ready
                            </Badge>
                        </div>
                        {recording.description && (
                            <p className="text-sm text-muted-foreground truncate">
                                {recording.description}
                            </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {recording.createdAt.toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                })}
                            </span>
                            {recording.duration !== 'N/A' && (
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {recording.duration}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Action Arrow */}
                    <div className="flex-shrink-0">
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-200" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

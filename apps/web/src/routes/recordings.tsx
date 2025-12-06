import { createFileRoute, Link } from '@tanstack/react-router';
import { RecordingPlayer } from '@/components/RecordingPlayer';
import { useState, useMemo, useEffect } from 'react';
import { Play, Calendar, Clock, Loader2, AlertCircle, Video } from 'lucide-react';
import { useTRPC } from '@/utils/trpc';
import { useQuery } from '@tanstack/react-query';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

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
    component: RecordingsDemoPage,
});

function RecordingsDemoPage() {
    const trpc = useTRPC();
    const { data, isLoading, error, refetch, isFetching } = useQuery(trpc.meeting.getMeetings.queryOptions());

    const recordings = useMemo<Recording[]>(() => {
        if (!data) return [];

        return data.map((meeting) => ({
            id: meeting.id,
            playlistUrl: `${r2Url}/${meeting.id}.m3u8`,
            title: meeting.name,
            description: meeting.description,
            duration: 'N/A', // Duration not available from API
            createdAt: new Date(meeting.createdAt.toString()),
            meetingId: meeting.id,
        }));
    }, [data]);

    const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);

    useEffect(() => {
        if (recordings.length === 0) {
            setSelectedRecording(null);
            return;
        }

        const stillExists = selectedRecording && recordings.some((rec) => rec.id === selectedRecording.id);
        if (!stillExists) {
            setSelectedRecording(recordings[0]);
        }
    }, [recordings, selectedRecording]);

    const isPriming = (!data && (isLoading || isFetching)) || (isLoading && recordings.length === 0);

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="bg-background overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                    <div className="min-h-screen bg-background relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none"></div>
                        <div className="container mx-auto px-4 py-6 lg:py-8 relative z-10">
                            <div className="mb-8 animate-fade-in">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                    <div>
                                        <h1 className="text-3xl lg:text-4xl font-bold mb-2 bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                                            My Recordings
                                        </h1>
                                        <p className="text-muted-foreground">
                                            Stream, review, and revisit your LiveKit recordings with ease.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
                                            <Loader2 className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                                            Refresh
                                        </Button>
                                        <Button asChild>
                                            <Link to="/meetings">Schedule / join meeting</Link>
                                        </Button>
                                        <SidebarTrigger className="lg:hidden" />
                                    </div>
                                </div>
                                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <Card className="bg-primary/5 border-primary/20">
                                        <CardContent className="p-4">
                                            <p className="text-xs uppercase text-muted-foreground tracking-wide">Total recordings</p>
                                            <p className="text-2xl font-semibold">{recordings.length}</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="border-border/60">
                                        <CardContent className="p-4">
                                            <p className="text-xs uppercase text-muted-foreground tracking-wide">Latest update</p>
                                            <p className="text-sm text-foreground">
                                                {new Date().toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                })}
                                            </p>
                                        </CardContent>
                                    </Card>
                                    <Card className="border-border/60">
                                        <CardContent className="p-4">
                                            <p className="text-xs uppercase text-muted-foreground tracking-wide">Playback</p>
                                            <p className="text-sm text-foreground">HLS • Adaptive</p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>

                            {isPriming && (
                                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fade-in">
                                    <div className="space-y-3">
                                        {[...Array(4)].map((_, idx) => (
                                            <Card key={idx} className="border-2 border-border/60">
                                                <CardContent className="p-4">
                                                    <div className="flex items-start gap-3">
                                                        <Skeleton className="h-12 w-12 rounded-lg" />
                                                        <div className="flex-1 space-y-2">
                                                            <Skeleton className="h-4 w-2/3" />
                                                            <Skeleton className="h-3 w-full" />
                                                            <Skeleton className="h-3 w-5/6" />
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                    <div className="xl:col-span-2 space-y-4">
                                        <Skeleton className="h-6 w-40" />
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-[420px] w-full rounded-lg" />
                                    </div>
                                </div>
                            )}


                            {!isPriming && error && (
                                <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                                    <AlertCircle className="w-12 h-12 text-destructive" />
                                    <div>
                                        <p className="text-destructive font-semibold">Failed to load recordings</p>
                                        <p className="text-muted-foreground text-sm">
                                            {error instanceof Error ? error.message : 'Unknown error occurred'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
                                            <Loader2 className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                                            Retry
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {!isPriming && !error && recordings.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                    <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
                                        <Play className="w-10 h-10 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-semibold mb-1">No recordings yet</p>
                                        <p className="text-muted-foreground text-sm max-w-md">
                                            Create a meeting and start recording to see your recordings here.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Button asChild>
                                            <Link to="/meetings">Go to meetings</Link>
                                        </Button>
                                        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
                                            Refresh
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {!isPriming && !error && recordings.length > 0 && (
                                <div className="grid gap-6 xl:grid-cols-[360px,1fr] animate-fade-in [animation-delay:100ms]">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-semibold">Recordings</p>
                                                <p className="text-xs text-muted-foreground">Tap to preview and play</p>
                                            </div>
                                            <Badge variant="secondary" className="bg-primary/10 text-primary">
                                                {recordings.length}
                                            </Badge>
                                        </div>
                                        <div className="space-y-3 lg:max-h-[calc(100vh-18rem)] lg:overflow-y-auto pr-1">
                                            {recordings.map((recording) => (
                                                <Card
                                                    key={recording.id}
                                                    onClick={() => setSelectedRecording(recording)}
                                                    className={`cursor-pointer transition-all duration-200 border ${
                                                        selectedRecording?.id === recording.id
                                                            ? 'border-primary bg-primary/10 shadow-lg shadow-primary/15'
                                                            : 'border-border hover:border-primary/50 hover:bg-accent/40 hover:shadow-md'
                                                    }`}
                                                >
                                                    <CardContent className="p-4">
                                                        <div className="flex items-start gap-3">
                                                            <div
                                                                className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 ${
                                                                    selectedRecording?.id === recording.id
                                                                        ? 'bg-primary/30 scale-105'
                                                                        : 'bg-primary/15'
                                                                }`}
                                                            >
                                                                <Video className="w-6 h-6 text-primary" />
                                                            </div>
                                                            <div className="flex-1 min-w-0 space-y-1">
                                                                <p
                                                                    className={`font-semibold truncate ${
                                                                        selectedRecording?.id === recording.id
                                                                            ? 'text-primary'
                                                                            : 'text-foreground'
                                                                    }`}
                                                                >
                                                                    {recording.title}
                                                                </p>
                                                                {recording.description && (
                                                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                                                        {recording.description}
                                                                    </p>
                                                                )}
                                                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                                    {recording.duration !== 'N/A' && (
                                                                        <span className="flex items-center gap-1">
                                                                            <Clock className="w-3 h-3" />
                                                                            {recording.duration}
                                                                        </span>
                                                                    )}
                                                                    <span className="flex items-center gap-1">
                                                                        <Calendar className="w-3 h-3" />
                                                                        {recording.createdAt.toLocaleDateString('en-US', {
                                                                            month: 'short',
                                                                            day: 'numeric',
                                                                            year: 'numeric',
                                                                        })}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>

                                    {selectedRecording && (
                                        <div className="space-y-4">
                                            <Card className="border-border/60 shadow-lg">
                                                <CardContent className="p-6 space-y-5">
                                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                        <div className="space-y-2">
                                                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Now playing</p>
                                                            <h2 className="text-2xl font-bold leading-tight">{selectedRecording.title}</h2>
                                                            {selectedRecording.description && (
                                                                <p className="text-sm text-muted-foreground">{selectedRecording.description}</p>
                                                            )}
                                                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                                                {selectedRecording.duration !== 'N/A' && (
                                                                    <span className="flex items-center gap-1.5">
                                                                        <Clock className="w-4 h-4" />
                                                                        Duration: {selectedRecording.duration}
                                                                    </span>
                                                                )}
                                                                <span className="flex items-center gap-1.5">
                                                                    <Calendar className="w-4 h-4" />
                                                                    {selectedRecording.createdAt.toLocaleDateString('en-US', {
                                                                        month: 'long',
                                                                        day: 'numeric',
                                                                        year: 'numeric',
                                                                    })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <Badge variant="outline" className="flex items-center gap-1.5 self-start">
                                                            <Play className="w-3 h-3" />
                                                            Playing
                                                        </Badge>
                                                    </div>

                                                    <div className="rounded-lg overflow-hidden bg-black">
                                                        <RecordingPlayer
                                                            playlistUrl={selectedRecording.playlistUrl}
                                                            recordingId={selectedRecording.id}
                                                            className="w-full"
                                                            meetingId={selectedRecording.meetingId}
                                                        />
                                                    </div>
                                                </CardContent>
                                            </Card>
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

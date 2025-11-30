import { createFileRoute } from '@tanstack/react-router';
import { RecordingPlayer } from '@/components/RecordingPlayer';
import { useState, useMemo, useEffect } from 'react';
import { Play, Calendar, Clock, Loader2, AlertCircle, Video } from 'lucide-react';
import { useTRPC } from '@/utils/trpc';
import { useQuery } from '@tanstack/react-query';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Recording {
    id: string;
    playlistUrl: string;
    title: string;
    description: string;
    duration: string;
    createdAt: Date;
    thumbnailUrl?: string;
}

const r2Url = import.meta.env.VITE_R2_URL;

export const Route = createFileRoute('/recordings')({
    component: RecordingsDemoPage,
});

function RecordingsDemoPage() {
    const trpc = useTRPC();
    const { data, isLoading, error } = useQuery(trpc.meeting.getMeetings.queryOptions());

    // Transform API data to Recording format
    const recordings = useMemo<Recording[]>(() => {
        if (!data) return [];

        return data.map((meeting) => ({
            id: meeting.id,
            playlistUrl: `${r2Url}/${meeting.id}.m3u8`,
            title: meeting.name,
            description: meeting.description,
            duration: 'N/A', // Duration not available from API
            createdAt: new Date(meeting.createdAt.toString()),
        }));
    }, [data]);

    const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);

    // Auto-select first recording when data loads
    useEffect(() => {
        if (recordings.length > 0 && !selectedRecording) {
            setSelectedRecording(recordings[0]);
        }
    }, [recordings, selectedRecording]);

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="bg-background overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                    <div className="min-h-screen bg-background relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none"></div>
                        <div className="container mx-auto px-4 py-6 lg:py-8 relative z-10">
                            {/* Header */}
                            <div className="mb-6 lg:mb-8 animate-fade-in">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h1 className="text-3xl lg:text-4xl font-bold mb-2 bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                                            My Recordings
                                        </h1>
                                        <p className="text-muted-foreground">
                                            Stream and download your LiveKit recordings
                                        </p>
                                    </div>
                                    <SidebarTrigger className="lg:hidden" />
                                </div>
                            </div>

                            {/* Loading State */}
                            {isLoading && (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                                    <p className="text-muted-foreground">Loading your recordings...</p>
                                </div>
                            )}

                            {/* Error State */}
                            {error && (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <AlertCircle className="w-12 h-12 text-destructive mb-4" />
                                    <p className="text-destructive font-semibold mb-2">Failed to load recordings</p>
                                    <p className="text-muted-foreground text-sm">
                                        {error instanceof Error ? error.message : 'Unknown error occurred'}
                                    </p>
                                </div>
                            )}

                            {/* Empty State */}
                            {!isLoading && !error && recordings.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <Play className="w-16 h-16 text-muted-foreground/20 mb-4" />
                                    <p className="text-lg font-semibold mb-2">No recordings yet</p>
                                    <p className="text-muted-foreground text-sm text-center max-w-md">
                                        Create a meeting and start recording to see your recordings here
                                    </p>
                                </div>
                            )}

                            {/* Main Content - Side by Side Layout */}
                            {!isLoading && !error && recordings.length > 0 && (
                                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fade-in [animation-delay:100ms]">
                                    {/* Recordings Grid - Left Side */}
                                    <div className="xl:col-span-1">
                                        <div className="sticky top-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <h2 className="text-xl font-semibold">
                                                    Recordings
                                                </h2>
                                                <Badge variant="secondary" className="bg-primary/10 text-primary">
                                                    {recordings.length}
                                                </Badge>
                                            </div>
                                            <div className="space-y-3 max-h-[calc(100vh-12rem)] overflow-y-auto pr-2">
                                                {recordings.map((recording) => (
                                                    <Card
                                                        key={recording.id}
                                                        onClick={() => setSelectedRecording(recording)}
                                                        className={`cursor-pointer transition-all duration-300 border-2 ${
                                                            selectedRecording?.id === recording.id
                                                                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20 scale-[1.02]'
                                                                : 'border-border hover:border-primary/50 hover:bg-accent/50 hover:shadow-md hover:-translate-y-0.5'
                                                        }`}
                                                    >
                                                        <CardContent className="p-4">
                                                            <div className="flex items-start gap-3">
                                                                <div
                                                                    className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-300 ${
                                                                        selectedRecording?.id === recording.id
                                                                            ? 'bg-primary/30 scale-110'
                                                                            : 'bg-primary/20 group-hover:bg-primary/30'
                                                                    }`}
                                                                >
                                                                    <Video className="w-6 h-6 text-primary" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p
                                                                        className={`font-semibold truncate transition-colors duration-300 mb-1 ${
                                                                            selectedRecording?.id === recording.id
                                                                                ? 'text-primary'
                                                                                : 'text-foreground'
                                                                        }`}
                                                                    >
                                                                        {recording.title}
                                                                    </p>
                                                                    {recording.description && (
                                                                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
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
                                    </div>

                                    {/* Player Section - Right Side */}
                                    {selectedRecording && (
                                        <div className="xl:col-span-2">
                                            <Card className="border-border/60 shadow-lg">
                                                <CardContent className="p-6">
                                                    {/* Recording Info */}
                                                    <div className="mb-6">
                                                        <div className="flex items-start justify-between gap-4 mb-4">
                                                            <div className="flex-1">
                                                                <h2 className="text-2xl font-bold mb-2">{selectedRecording.title}</h2>
                                                                {selectedRecording.description && (
                                                                    <p className="text-muted-foreground mb-4">{selectedRecording.description}</p>
                                                                )}
                                                            </div>
                                                            <Badge variant="outline" className="flex items-center gap-1.5 shrink-0">
                                                                <Play className="w-3 h-3" />
                                                                Playing
                                                            </Badge>
                                                        </div>

                                                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
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

                                                    {/* Video Player */}
                                                    <div className="rounded-lg overflow-hidden bg-black">
                                                        <RecordingPlayer
                                                            playlistUrl={selectedRecording.playlistUrl}
                                                            recordingId={selectedRecording.id}
                                                            className="w-full"
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

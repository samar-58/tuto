import { createFileRoute, useParams, useNavigate } from '@tanstack/react-router';
import { RecordingPlayer } from '@/components/RecordingPlayer';
import { useMemo, useState } from 'react';
import {
    ArrowLeft,
    Calendar,
    Clock,
    Video,
    Share2,
    Check,
    AlertCircle
} from 'lucide-react';
import { useTRPC } from '@/utils/trpc';
import { useQuery } from '@tanstack/react-query';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import SummarizeView from '@/components/summarize-view';

const r2Url = import.meta.env.VITE_R2_URL;

export const Route = createFileRoute('/recording/$id')({
    component: RecordingDetailPage,
});

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

function RecordingDetailPage() {
    const { id } = useParams({ from: '/recording/$id' });
    const navigate = useNavigate();
    const trpc = useTRPC();
    const [linkCopied, setLinkCopied] = useState(false);

    const { data, isLoading, error } = useQuery(trpc.meeting.getMeetings.queryOptions());

    const recording = useMemo<Recording | null>(() => {
        if (!data) return null;
        const meeting = data.find((m) => m.id === id);
        if (!meeting) return null;
        return {
            id: meeting.id,
            playlistUrl: `${r2Url}/${meeting.id}.m3u8`,
            title: meeting.name,
            description: meeting.description,
            duration: 'N/A',
            createdAt: new Date(meeting.createdAt.toString()),
            meetingId: meeting.id,
        };
    }, [data, id]);

    const handleShareLink = async () => {
        const recordingUrl = `${window.location.origin}/recording/${id}`;
        try {
            await navigator.clipboard.writeText(recordingUrl);
            setLinkCopied(true);
            toast.success("Recording link copied!", {
                description: "Share this link to let others view this recording."
            });
            setTimeout(() => setLinkCopied(false), 2000);
        } catch {
            toast.error("Failed to copy link");
        }
    };

    if (isLoading) {
        return (
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset className="bg-background overflow-hidden">
                    <div className="flex-1 overflow-y-auto">
                        <div className="min-h-screen bg-background relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
                            <div className="container mx-auto px-4 py-6 lg:py-8 relative z-10">
                                <div className="space-y-6 animate-fade-in">
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-6 w-48" />
                                            <Skeleton className="h-4 w-32" />
                                        </div>
                                    </div>
                                    <Skeleton className="w-full aspect-video rounded-xl" />
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        <Skeleton className="h-40 rounded-xl lg:col-span-2" />
                                        <Skeleton className="h-40 rounded-xl" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        );
    }

    if (error) {
        return (
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset className="bg-background overflow-hidden">
                    <div className="flex-1 overflow-y-auto">
                        <div className="min-h-screen bg-background flex items-center justify-center">
                            <div className="text-center space-y-4">
                                <AlertCircle className="w-16 h-16 text-destructive mx-auto" />
                                <div>
                                    <h2 className="text-xl font-semibold">Failed to load recording</h2>
                                    <p className="text-muted-foreground mt-1">
                                        {error instanceof Error ? error.message : 'Unknown error occurred'}
                                    </p>
                                </div>
                                <Button onClick={() => navigate({ to: '/recordings' })}>
                                    Back to Recordings
                                </Button>
                            </div>
                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        );
    }

    if (!recording) {
        return (
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset className="bg-background overflow-hidden">
                    <div className="flex-1 overflow-y-auto">
                        <div className="min-h-screen bg-background flex items-center justify-center">
                            <div className="text-center space-y-4">
                                <Video className="w-16 h-16 text-muted-foreground mx-auto opacity-50" />
                                <div>
                                    <h2 className="text-xl font-semibold">Recording not found</h2>
                                    <p className="text-muted-foreground mt-1">
                                        This recording may have been deleted or doesn't exist.
                                    </p>
                                </div>
                                <Button onClick={() => navigate({ to: '/recordings' })}>
                                    Back to Recordings
                                </Button>
                            </div>
                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        );
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="bg-background overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                    <div className="min-h-screen bg-background relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />

                        <div className="container mx-auto px-4 py-6 lg:py-8 relative z-10">
                            <div className="mb-6 animate-fade-in">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="flex items-center gap-4">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => navigate({ to: '/recordings' })}
                                            className="h-10 w-10 rounded-full border border-border/60 hover:bg-accent transition-all duration-200"
                                        >
                                            <ArrowLeft className="h-5 w-5" />
                                        </Button>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
                                                    {recording.title}
                                                </h1>
                                                <Badge variant="secondary" className="bg-primary/10 text-primary">
                                                    <Video className="w-3 h-3 mr-1" />
                                                    Recording
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="w-4 h-4" />
                                                    {recording.createdAt.toLocaleDateString('en-US', {
                                                        month: 'long',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                    })}
                                                </span>
                                                {recording.duration !== 'N/A' && (
                                                    <span className="flex items-center gap-1.5">
                                                        <Clock className="w-4 h-4" />
                                                        {recording.duration}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={handleShareLink}
                                            className="transition-all duration-200"
                                        >
                                            {linkCopied ? (
                                                <>
                                                    <Check className="w-4 h-4 mr-2 text-green-500" />
                                                    Copied!
                                                </>
                                            ) : (
                                                <>
                                                    <Share2 className="w-4 h-4 mr-2" />
                                                    Share
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-220px)] lg:h-[calc(100vh-220px)] min-h-[600px] animate-fade-in [animation-delay:100ms]">
                                <div className="flex-1 lg:w-1/2 flex flex-col min-h-0">
                                    <Card className="border-border/60 shadow-lg overflow-hidden flex flex-col h-full">
                                        <CardContent className="p-0 flex flex-col flex-1 min-h-0">
                                            <div className="bg-black rounded-t-lg overflow-hidden flex-1 flex items-center justify-center min-h-0">
                                                <RecordingPlayer
                                                    playlistUrl={recording.playlistUrl}
                                                    recordingId={recording.id}
                                                    className="w-full h-full object-contain"
                                                    meetingId={recording.meetingId}
                                                    hideActions={true}
                                                />
                                            </div>
                                            {recording.description && (
                                                <div className="p-4 border-t border-border/60 flex-shrink-0">
                                                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                                                    <p className="text-sm text-foreground line-clamp-2">{recording.description}</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className="flex-1 lg:w-1/2 flex flex-col min-h-0">
                                    <div className="h-full overflow-y-auto pr-2">
                                        <SummarizeView
                                            meetingId={recording.meetingId}
                                            playlistUrl={recording.playlistUrl}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}

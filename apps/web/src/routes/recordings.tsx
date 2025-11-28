import { createFileRoute } from '@tanstack/react-router';
import { RecordingPlayer } from '@/components/RecordingPlayer';
import { useState, useMemo, useEffect } from 'react';
import { Play, Calendar, Clock, Loader2, AlertCircle } from 'lucide-react';
import { useTRPC } from '@/utils/trpc';
import { useQuery } from '@tanstack/react-query';

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
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2">My Recordings</h1>
                    <p className="text-muted-foreground">
                        Stream and download your LiveKit recordings
                    </p>
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

                {/* Main Content */}
                {!isLoading && !error && recordings.length > 0 && selectedRecording && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Recordings List */}
                        <div className="lg:col-span-1 space-y-3">
                            <h2 className="text-xl font-semibold mb-4">Available Recordings ({recordings.length})</h2>
                            <div className="space-y-3">
                                {recordings.map((recording) => (
                                    <button
                                        key={recording.id}
                                        onClick={() => setSelectedRecording(recording)}
                                        className={`w-full p-4 text-left rounded-lg border-2 transition-all ${selectedRecording.id === recording.id
                                                ? 'border-primary bg-primary/10'
                                                : 'border-border hover:border-primary/50 hover:bg-accent'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                                                <Play className="w-5 h-5 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold truncate">{recording.title}</p>
                                                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                                    {recording.duration !== 'N/A' && (
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {recording.duration}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {recording.createdAt.toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Player Section */}
                        <div className="lg:col-span-2">
                            <div className="rounded-xl border bg-card p-6">
                                {/* Recording Info */}
                                <div className="mb-6">
                                    <h2 className="text-2xl font-bold mb-2">{selectedRecording.title}</h2>
                                    <p className="text-muted-foreground mb-4">{selectedRecording.description}</p>

                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                                <RecordingPlayer
                                    playlistUrl={selectedRecording.playlistUrl}
                                    recordingId={selectedRecording.id}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

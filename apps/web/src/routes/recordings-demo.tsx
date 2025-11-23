import { createFileRoute } from '@tanstack/react-router';
import { RecordingPlayer } from '@/components/RecordingPlayer';
import { useState } from 'react';
import { Play, Calendar, Clock } from 'lucide-react';

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

export const Route = createFileRoute('/recordings-demo')({
    component: RecordingsDemoPage,
});

function RecordingsDemoPage() {
    console.log(r2Url);
    // Sample recordings - Replace these URLs with your actual Cloudflare R2 URLs
    const [recordings] = useState<Recording[]>([
        {
            id: '88a57f95-72bb-4204-a578-0713d0fdfbfb',
            playlistUrl: `${r2Url}/88a57f95-72bb-4204-a578-0713d0fdfbfb.m3u8`,
            title: 'Team Meeting - Q4 Planning',
            description: 'Quarterly planning session with the product team discussing roadmap and priorities.',
            duration: '45:32',
            createdAt: new Date('2025-11-23T13:26:59'),
        },
        {
            id: '8a57f95-72bb-4204-a578-0713d0fdfbfb',
            playlistUrl: `${r2Url}/demo-recording-2.m3u8`,
            title: 'Client Presentation',
            description: 'Product demo and feature walkthrough for potential client.',
            duration: '28:15',
            createdAt: new Date('2025-11-22T10:00:00'),
        },
        {
            id: 'demo-recording-3',
            playlistUrl: `${r2Url}/demo-recording-3.m3u8`,
            title: 'Workshop: React Best Practices',
            description: 'Internal workshop covering React performance optimization and best practices.',
            duration: '1:12:45',
            createdAt: new Date('2025-11-21T14:30:00'),
        },
    ]);

    const [selectedRecording, setSelectedRecording] = useState<Recording>(recordings[0]);

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2">Recording Player Demo</h1>
                    <p className="text-muted-foreground">
                        Stream and download LiveKit recordings stored in Cloudflare R2
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recordings List */}
                    <div className="lg:col-span-1 space-y-3">
                        <h2 className="text-xl font-semibold mb-4">Available Recordings</h2>
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
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {recording.duration}
                                                </span>
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

                        {/* Info Card */}
                        <div className="mt-6 p-4 rounded-lg bg-accent border">
                            <h3 className="font-semibold mb-2">📝 Note</h3>
                            <p className="text-sm text-muted-foreground">
                                Replace the sample URLs in this demo with your actual Cloudflare R2
                                recording URLs to test with real recordings.
                            </p>
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
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="w-4 h-4" />
                                        Duration: {selectedRecording.duration}
                                    </span>
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

                            {/* Features List */}
                            <div className="mt-6 p-4 rounded-lg bg-accent/50">
                                <h3 className="font-semibold mb-3">✨ Features</h3>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary">•</span>
                                        <span><strong>HLS Streaming:</strong> Adaptive streaming for smooth playback</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary">•</span>
                                        <span><strong>Cross-Browser:</strong> Works on Chrome, Safari, Firefox, and more</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary">•</span>
                                        <span><strong>One-Click Download:</strong> Download recordings for offline viewing</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary">•</span>
                                        <span><strong>Error Recovery:</strong> Automatic recovery from network issues</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary">•</span>
                                        <span><strong>Loading States:</strong> Visual feedback during loading</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Usage Instructions */}
                <div className="mt-8 p-6 rounded-xl border bg-card">
                    <h2 className="text-xl font-bold mb-4">🚀 How to Use</h2>
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold mb-2">1. Update Recording URLs</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                                Replace the sample URLs with your actual Cloudflare R2 URLs:
                            </p>
                            <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                                {`playlistUrl: 'https://your-bucket.r2.dev/8a57f95-...-0713d0fdfbfb.m3u8'`}
                            </pre>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">2. Configure CORS (if needed)</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                                Ensure your Cloudflare R2 bucket allows requests from your domain:
                            </p>
                            <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                                {`{
  "AllowedOrigins": ["https://your-domain.com"],
  "AllowedMethods": ["GET", "HEAD"],
  "AllowedHeaders": ["*"]
}`}
                            </pre>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">3. Test Playback</h3>
                            <p className="text-sm text-muted-foreground">
                                Click on a recording from the list to load and play it. Use the download button to save recordings locally.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

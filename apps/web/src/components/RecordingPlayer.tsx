import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Download, Loader2, Music } from 'lucide-react';
import { useTRPC } from '@/utils/trpc';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

interface RecordingPlayerProps {
    playlistUrl: string;
    recordingId?: string;
    className?: string;
}

export function RecordingPlayer({
    playlistUrl,
    recordingId,
    className = ''
}: RecordingPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isExtractingAudio, setIsExtractingAudio] = useState(false);
    
    const trpc = useTRPC();
    const extractAudioMutation = useMutation(trpc.videoToMp3.videoToMp3.mutationOptions());
    const startTranscriptionMutation = useMutation(trpc.videoToMp3.startTranscription.mutationOptions());
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        setIsLoading(true);
        setError(null);

        // Check if HLS is supported
        if (Hls.isSupported()) {
            const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: false,
            });

            hlsRef.current = hls;

            hls.loadSource(playlistUrl);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                setIsLoading(false);
            });

            hls.on(Hls.Events.ERROR, (_event, data) => {
                if (data.fatal) {
                    setError('Failed to load video');
                    setIsLoading(false);

                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            console.error('Network error');
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.error('Media error');
                            hls.recoverMediaError();
                            break;
                        default:
                            hls.destroy();
                            break;
                    }
                }
            });
            return () => {
                hls.destroy();
            };
        }
        // Native HLS support (Safari)
        else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = playlistUrl;
            video.addEventListener('loadedmetadata', () => {
                setIsLoading(false);
            });
            video.addEventListener('error', () => {
                setError('Failed to load video');
                setIsLoading(false);
            });
        } else {
            setError('HLS is not supported in your browser');
            setIsLoading(false);
        }
    }, [playlistUrl]);

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            // Option 1: Download the M3U8 file directly
            // User's browser will handle the download
            const link = document.createElement('a');
            link.href = playlistUrl;
            link.download = recordingId ? `recording-${recordingId}.m3u8` : 'recording.m3u8';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Note: For better UX, you might want to:
            // 1. Convert to MP4 on the server-side using FFmpeg
            // 2. Or zip all .ts segments + .m3u8 file together
            // 3. Then provide that download link
        } catch (err) {
            console.error('Download failed:', err);
            setError('Failed to download recording');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleExtractAudio = async () => {
        setIsExtractingAudio(true);
        try {
            const result = await extractAudioMutation.mutateAsync({
                videoUrl: playlistUrl,
            });
            toast.success('Audio extraction started! The MP3 file will be available shortly.');
            const transcriptionResult = await startTranscriptionMutation.mutateAsync({
                key: result.key,
            });
            console.log('Transcription result:', transcriptionResult);
            toast.success('Transcription started! The transcription will be available shortly.');
        } catch (err) {
            console.error('Audio extraction failed:', err);
            toast.error('Failed to extract audio. Please try again.');
            setError('Failed to extract audio');
        } finally {
            setIsExtractingAudio(false);
        }
    };

    return (
        <div className={`relative ${className}`}>
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                </div>
            )}

            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                    <p className="text-red-500 font-medium">{error}</p>
                </div>
            )}

            <video
                ref={videoRef}
                controls
                className="w-full rounded-lg bg-black"
                playsInline
            />

            <div className="mt-4 flex gap-2">
                <button
                    onClick={handleDownload}
                    disabled={isDownloading || !!error}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isDownloading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Downloading...
                        </>
                    ) : (
                        <>
                            <Download className="w-4 h-4" />
                            Download Recording
                        </>
                    )}
                </button>
                <button
                    onClick={handleExtractAudio}
                    disabled={isExtractingAudio || !!error}
                    className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isExtractingAudio ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Extracting and transcribing...
                        </>
                    ) : (
                        <>
                            <Music className="w-4 h-4" />
                            Extract Audio (MP3) and Transcribe
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

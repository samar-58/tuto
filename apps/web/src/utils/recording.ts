/**
 * Utility functions for handling LiveKit recordings
 */

export interface RecordingSegment {
    filename: string;
    url: string;
    size: number;
    timestamp: number;
}

export interface Recording {
    id: string;
    playlistUrl: string;
    segments: RecordingSegment[];
    createdAt: Date;
}

/**
 * Parse recording ID from segment filename
 * Example: 8a57f95-72bb-4204-a578-0713d0fdfbfb_00000.ts -> 8a57f95-72bb-4204-a578-0713d0fdfbfb
 */
export function parseRecordingId(filename: string): string | null {
    const match = filename.match(/^(.+?)_\d+\.ts$/);
    return match ? match[1] : null;
}

/**
 * Generate playlist URL from recording ID
 */
export function getPlaylistUrl(recordingId: string, bucketBaseUrl: string): string {
    // Assuming the m3u8 file follows the pattern: {recordingId}.m3u8
    // Adjust this based on your actual naming convention
    return `${bucketBaseUrl}/${recordingId}.m3u8`;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format duration from seconds
 */
export function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

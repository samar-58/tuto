import {
    type JobContext,
    WorkerOptions,
    cli,
    defineAgent,
} from '@livekit/agents';
import * as openai from '@livekit/agents-plugin-openai';
import * as deepgram from '@livekit/agents-plugin-deepgram';
import { AudioFrame, TrackKind, AudioStream, RemoteAudioTrack } from '@livekit/rtc-node';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const TUTOR_PARTICIPANT_IDENTITY = process.env.TUTOR_IDENTITY || 'tutor';
const USE_DEEPGRAM = process.env.USE_DEEPGRAM === 'true';

export default defineAgent({
    entry: async (ctx: JobContext) => {
        console.log("Tutor Listener Agent Started");

        await ctx.connect();
        console.log("Connected to room:", ctx.room.name);

        const createSTT = () => {
            if (USE_DEEPGRAM) {
                console.log("Using Deepgram STT");
                return new deepgram.STT({
                    model: "nova-3",
                    language: "hi",
                });
            } else {
                console.log("Using OpenAI Whisper STT");
                return new openai.STT({
                    model: "whisper-1",
                });
            }
        };


        const isTutor = (participant: any): boolean => {
            const isMatch = participant.identity === TUTOR_PARTICIPANT_IDENTITY ||
                participant.name?.toLowerCase().includes('tutor');
            return isMatch;
        };


        const activeStreams = new Map<string, any>();


        ctx.room.on('trackSubscribed', async (track, publication, participant) => {
            console.log(`Track subscribed: ${publication.source} from ${participant.identity}`);


            if (publication.kind !== TrackKind.KIND_AUDIO) {
                console.log("Skipping non-audio track");
                return;
            }


            if (!isTutor(participant)) {
                console.log(`Skipping non-tutor participant: ${participant.identity}`);
                return;
            }

            console.log(`Tutor audio track detected! Starting transcription...`);

            try {
                const stt = createSTT();

                const stream = stt.stream();
                (async () => {
                    try {
                        for await (const event of stream) {
                            if (event.type === 2) {
                                const text = event.alternatives?.[0]?.text || '';
                                console.log(`[${participant.identity}] FINAL: ${text}`);
                            } else if (event.type === 1) {
                                const text = event.alternatives?.[0]?.text || '';
                                console.log(`[${participant.identity}] PARTIAL: ${text}`);
                            }
                        }
                    } catch (error) {
                        console.error(`Transcription error for ${participant.identity}:`, error);
                    }
                })();

                const audioStream = new AudioStream(track as RemoteAudioTrack);
                let streamClosed = false;

                (async () => {
                    try {
                        for await (const frame of audioStream) {
                            if (streamClosed) break;

                            try {
                                stream.pushFrame(frame);
                            } catch (error: any) {
                                if (error?.message?.includes('closed')) {
                                    console.log(`STT stream closed for ${participant.identity}, stopping audio processing`);
                                    streamClosed = true;
                                    break;
                                }
                                console.error(`Error pushing audio frame:`, error);
                            }
                        }
                    } catch (error) {
                        console.error(`AudioStream error for ${participant.identity}:`, error);
                    }
                })();

                activeStreams.set(publication.sid ?? "", { sttStream: stream, audioStream });

            } catch (error) {
                console.error(`Failed to setup STT for ${participant.identity}:`, error);
            }
        });

        ctx.room.on('trackUnsubscribed', (track, publication, participant) => {
            const streams = activeStreams.get(publication?.sid ?? "");
            if (streams) {
                console.log(`Stopping transcription for ${participant.identity}`);
                try {
                    streams.sttStream.close();
                } catch (error) {
                    console.error(`Error closing STT stream:`, error);
                }
                activeStreams.delete(publication?.sid ?? "");
            }
        });

        console.log("Checking for existing participants...");
        for (const [, participant] of ctx.room.remoteParticipants) {
            if (isTutor(participant)) {
                console.log(`Found existing tutor: ${participant.identity}`);

                for (const [, publication] of participant.trackPublications) {
                    if (publication.kind === TrackKind.KIND_AUDIO && publication.track && publication.subscribed) {
                        console.log(`🎵 Processing existing tutor audio track`);

                        const track = publication.track;

                        try {
                            const stt = createSTT();
                            const stream = stt.stream();

                            (async () => {
                                try {
                                    for await (const event of stream) {
                                        if (event.type === 2) {
                                            const text = event.alternatives?.[0]?.text || '';
                                            console.log(`[${participant.identity}] FINAL: ${text}`);
                                        } else if (event.type === 1) {
                                            const text = event.alternatives?.[0]?.text || '';
                                            console.log(`[${participant.identity}] PARTIAL: ${text}`);
                                        }
                                    }
                                } catch (error) {
                                    console.error(`Transcription error:`, error);
                                }
                            })();

                            const audioStream = new AudioStream(track as RemoteAudioTrack);
                            let streamClosed = false;

                            (async () => {
                                try {
                                    for await (const frame of audioStream) {
                                        if (streamClosed) break;

                                        try {
                                            stream.pushFrame(frame);
                                        } catch (error: any) {
                                            if (error?.message?.includes('closed')) {
                                                console.log(`STT stream closed for ${participant.identity}, stopping audio processing`);
                                                streamClosed = true;
                                                break;
                                            }
                                            console.error(`Error pushing audio frame:`, error);
                                        }
                                    }
                                } catch (error) {
                                    console.error(`AudioStream error for ${participant.identity}:`, error);
                                }
                            })();

                            activeStreams.set(publication?.sid ?? "", { sttStream: stream, audioStream });
                        } catch (error) {
                            console.error(`Failed to setup STT:`, error);
                        }
                    }
                }
            }
        }

        ctx.room.on('disconnected', () => {
            console.log("Disconnected from room, cleaning up...");
            for (const [, streams] of activeStreams) {
                try {
                    streams.sttStream.close();
                } catch (error) {
                    console.error(`Error closing STT stream during cleanup:`, error);
                }
            }
            activeStreams.clear();
        });

        console.log("Agent is ready and listening for the tutor…");
    },
});

cli.runApp(new WorkerOptions({
    agent: "./dist/agent.js"
}));
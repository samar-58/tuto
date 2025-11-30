import {
    type JobContext,
    WorkerOptions,
    cli,
    defineAgent,
} from '@livekit/agents';
import * as google from '@livekit/agents-plugin-google';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config({ path: '.env.local' });

// Agent that listens to tutor's audio and answers questions via text
class TutorAssistant {
    private tutorTranscript: string = '';
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor() {
        const apiKey = process.env.GOOGLE_API_KEY || Bun.env.GOOGLE_API_KEY;
        if (!apiKey) {
            console.error('[Agent] WARNING: GOOGLE_API_KEY not set. Agent will not be able to answer questions.');
        }
        this.genAI = new GoogleGenerativeAI(apiKey || '');
        this.model = this.genAI.getGenerativeModel({
            model: "gemini-2.0-flash-exp",
            systemInstruction: `You are an AI teaching assistant. Your role is to:
1. Answer student questions based ONLY on what the tutor has explained in the transcript
2. Help students who joined late by summarizing what was covered
3. Be concise and helpful in your responses
4. If asked about something the tutor hasn't covered, politely say you can only answer based on what has been taught so far`
        });
    }

    addToContext(text: string) {
        this.tutorTranscript += text + ' ';
        console.log('[Agent] Added to context:', text);
    }

    async answerQuestion(question: string): Promise<string> {
        try {
            if (!this.tutorTranscript || this.tutorTranscript.trim().length === 0) {
                return 'I haven\'t heard the tutor explain anything yet. Please wait for the tutor to start teaching.';
            }

            const prompt = `Based on what the tutor has taught so far:

${this.tutorTranscript}

Student question: ${question}

Please provide a helpful answer based only on what the tutor has covered.`;

            const result = await this.model.generateContent(prompt);
            const response = result.response;
            const text = response.text();

            return text || 'I apologize, but I need more context from the tutor to answer that question.';
        } catch (error) {
            console.error('[Agent] Error answering question:', error);
            return 'I encountered an error processing your question. Please try again.';
        }
    }

    getContext(): string {
        return this.tutorTranscript;
    }
}

export default defineAgent({
    entry: async (ctx: JobContext) => {
        console.log('[Agent] Starting Tutor Assistant Agent');

        await ctx.connect();
        console.log('[Agent] Connected to room:', ctx.room.name);

        const assistant = new TutorAssistant();

        // Find the tutor's audio track
        const findTutorTrack = async () => {
            const participants = Array.from(ctx.room.remoteParticipants.values());
            console.log('[Agent] Looking for tutor among', participants.length, 'participants');

            for (const participant of participants) {
                // Check if participant has 'tutor' role in metadata
                const metadata = participant.metadata ? JSON.parse(participant.metadata) as { role?: string } : {};
                console.log('[Agent] Participant:', participant.identity, 'metadata:', metadata);

                if (metadata.role === 'tutor') {
                    console.log('[Agent] Found tutor:', participant.identity);
                    return participant;
                }
            }
            return null;
        };

        // Subscribe to tutor's audio track and set up real-time transcription
        const subscribeToTutor = async (tutor: any) => {
            console.log('[Agent] Subscribing to tutor audio tracks');

            const audioTracks = Array.from(tutor.audioTrackPublications?.values() || []);

            for (const publication of audioTracks as any[]) {
                if (publication?.track) {
                    console.log('[Agent] Found audio track, starting real-time transcription');

                    try {
                        // Create Google STT instance for real-time transcription
                        // Note: Verify the actual API - may need different import or setup
                        const stt = new (google as any).STT({
                            languages: ['en-US'],
                            model: 'latest_long',
                        });

                        const audioSource = publication.track;

                        // Start transcription stream
                        const transcriptionStream = stt.stream();

                        // Handle transcription events
                        transcriptionStream.on('transcript', (event: any) => {
                            const transcript = event.text;
                            const isFinal = event.is_final;

                            if (isFinal && transcript) {
                                console.log('[Agent] Transcribed (final):', transcript);
                                assistant.addToContext(transcript);
                            } else if (transcript) {
                                console.log('[Agent] Transcribed (interim):', transcript);
                            }
                        });

                        transcriptionStream.on('error', (err: any) => {
                            console.error('[Agent] Transcription error:', err);
                        });

                        // 🔥 Attach PCM stream from audio track
                        const pcmStream = audioSource.attach(); // live PCM frames

                        pcmStream.on("data", (pcm: Buffer) => {
                            transcriptionStream.write(pcm);
                        });

                        pcmStream.on("error", (err: any) => {
                            console.error('[Agent] PCM stream error:', err);
                        });

                        console.log('[Agent] Real-time transcription pipeline active');
                    } catch (error) {
                        console.error('[Agent] Error setting up transcription:', error);
                        console.log('[Agent] Continuing without transcription - agent will respond to text questions only');
                    }
                }
            }
        };

        // Listen for new participants (in case tutor joins after agent)
        ctx.room.on('participantConnected', async (participant: any) => {
            console.log('[Agent] Participant connected:', participant.identity);
            const metadata = participant.metadata ? JSON.parse(participant.metadata) as { role?: string } : {};

            if (metadata.role === 'tutor') {
                console.log('[Agent] Tutor joined, subscribing to audio');
                await subscribeToTutor(participant);
            }
        });

        // Listen for data messages (questions from students)
        ctx.room.on('dataReceived', async (payload: Uint8Array, participant?: any) => {
            const message = new TextDecoder().decode(payload);
            console.log('[Agent] Received message:', message, 'from:', participant?.identity);

            // Check if message is a question for the agent
            // Messages starting with @agent or containing keywords trigger response
            if (message.toLowerCase().includes('@agent') ||
                message.toLowerCase().includes('what did') ||
                message.toLowerCase().includes('what has') ||
                message.toLowerCase().includes('can you explain')) {

                console.log('[Agent] Processing question:', message);
                const answer = await assistant.answerQuestion(message);

                // Send response back via data channel
                const encoder = new TextEncoder();
                const data = encoder.encode(`[AI Assistant] ${answer}`);
                await ctx.room.localParticipant?.publishData(data, { reliable: true });
                console.log('[Agent] Sent answer:', answer);
            }
        });

        // Initial check for tutor
        const tutor = await findTutorTrack();
        if (tutor) {
            await subscribeToTutor(tutor);
        } else {
            console.log('[Agent] No tutor found yet, waiting for tutor to join...');
        }

        console.log('[Agent] Agent is now listening and ready to answer questions');
    },
});

cli.runApp(new WorkerOptions({ agent: fileURLToPath(import.meta.url) }));

import { createOpenAI } from "@ai-sdk/openai";
import { experimental_transcribe as transcribe } from 'ai';

const openai =  createOpenAI({
    apiKey: Bun.env.OPENAI_API_KEY,
});

export async function transcribeAudio(audioUrl: string) {
    const transcript = await transcribe({
        model: openai.transcription("gpt-4o-transcribe"),
        audio: new URL(audioUrl),
    });
    const text = transcript.text;
    //console.log(text);
    return text;
}

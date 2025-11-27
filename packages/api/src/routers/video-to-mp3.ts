import z from "zod";
import {  protectedProcedure, router } from "..";
import { convertVideoToMp3 } from "../engress/recording-audio";
import { transcribeAudio } from "../engress/transcribe";

const pubKey = Bun.env.R2_PUBLIC_KEY!;

export const getTranscription = async (key: string) => {
    const finalKey = `${pubKey}/${key}`;
    return await transcribeAudio(finalKey);
}

export const videoToMp3Router = router({
    videoToMp3: protectedProcedure.input(z.object({
        videoUrl: z.string(),
    })).mutation(async ({ input , ctx }) => {
        const userId = ctx.session?.user?.id;

        if(!userId) {
            throw new Error("User not authenticated");
        }
        const { videoUrl } = input;
        const { key } = await convertVideoToMp3(videoUrl);
        return { key };
    }),
    startTranscription: protectedProcedure.input(z.object({
        key: z.string(),
    })).mutation(async ({ input , ctx }) => {
        const userId = ctx.session?.user?.id;

        if(!userId) {
            throw new Error("User not authenticated");
        }
        const { key } = input;
        const transcription = await getTranscription(key);
        return { transcription };
    }),
});
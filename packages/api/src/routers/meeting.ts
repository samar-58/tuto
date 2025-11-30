import z from "zod";
import { protectedProcedure, router } from "..";
import prisma from "@tuto/db";
import { agentManager } from "../agent/agent-manager";


export const meetingRouter = router({
    createMeeting: protectedProcedure.input(z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
    })).mutation(async ({ input, ctx }) => {
        const userId = ctx.session?.user?.id;

        if (!userId) {
            throw new Error("User not authenticated");
        }

        if (!input.id || !input.name || !input.description) {
            throw new Error("Meeting ID, name and description are required");
        }

        try {
            const meeting = await prisma.meeting.create({
                data: {
                    id: input.id,
                    name: input.name,
                    description: input.description,
                    userId: userId,
                },
            });
            return meeting;
        } catch (error) {
            console.error("Failed to create meeting:", error);
            throw new Error(error instanceof Error ? error.message : "Failed to create meeting");
        }
    }),

    getMeetings: protectedProcedure.query(async ({ ctx }) => {
        try {
            const meetings = await prisma.meeting.findMany({
                where: {
                    userId: ctx.session?.user?.id,
                },
            });
            return meetings;
        }
        catch (error) {
            console.error("Failed to get meetings:", error);
            throw new Error(error instanceof Error ? error.message : "Failed to get meetings");
        }
    }),

    enableAgent: protectedProcedure.input(z.object({
        roomName: z.string(),
    })).mutation(async ({ input }) => {
        try {
            const result = await agentManager.spawnAgent(input.roomName);
            return result;
        } catch (error) {
            console.error("Failed to enable agent:", error);
            throw new Error(error instanceof Error ? error.message : "Failed to enable agent");
        }
    }),

    disableAgent: protectedProcedure.input(z.object({
        roomName: z.string(),
    })).mutation(async ({ input }) => {
        try {
            const result = await agentManager.stopAgent(input.roomName);
            return result;
        } catch (error) {
            console.error("Failed to disable agent:", error);
            throw new Error(error instanceof Error ? error.message : "Failed to disable agent");
        }
    }),

    getAgentStatus: protectedProcedure.input(z.object({
        roomName: z.string(),
    })).query(async ({ input }) => {
        try {
            const status = agentManager.getAgentStatus(input.roomName);
            return status;
        } catch (error) {
            console.error("Failed to get agent status:", error);
            throw new Error(error instanceof Error ? error.message : "Failed to get agent status");
        }
    }),
});
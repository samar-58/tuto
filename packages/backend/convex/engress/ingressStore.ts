import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";

export const storeIngressData = internalMutation({
    args: {
        egressId: v.string(),
        roomName: v.string(),
        username: v.string(),
        status: v.string(),
        startedAt: v.number(),
        s3Key: v.string(),
       // userId: v.string(),
    },
    handler: async (ctx, args) => {
        // Internal mutations don't have access to auth context,
        // so userId is passed as a parameter from the calling action
        await ctx.db.insert("engress", {
            egressId: args.egressId,
            roomName: args.roomName,
            username: args.username,
            status: args.status,
            startedAt: args.startedAt,
            s3Key: args.s3Key,
          //  userId: args.userId,
        });
    }
})

export const patchIngressData = internalMutation({
    args: {
        egressId: v.string(),
        status: v.string(),
        result: v.optional(v.any()),
       // id : v.id("engress"),
    },
    handler: async (ctx, args) => {
        // Find the document by egressId using the index
        const doc = await ctx.db
            .query("engress")
            .withIndex("engressId", (q) => q.eq("egressId", args.egressId))
            .first();
        
        if (!doc) {
            throw new Error(`Egress record not found for egressId: ${args.egressId}`);
        }
        
        await ctx.db.patch(doc._id, {
            status: args.status,
            result: args.result,
        });
    }
})
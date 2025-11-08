import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	engress : defineTable({
        egressId: v.string(),
        roomName: v.string(),
        username: v.string(),
        status: v.string(),
        startedAt: v.number(),
        s3Key: v.string(),
        result: v.optional(v.any()), // Egress result details
        videoUrl: v.optional(v.string()),
       // userId: v.string(),
    }).index("engressId", ["egressId"])
});

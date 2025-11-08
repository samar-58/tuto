import { v } from "convex/values";
import { components } from "./_generated/api";
import { httpAction, mutation, query } from "./_generated/server";
import { R2 } from "@convex-dev/r2";


export const r2 = new R2(components.r2);

export const generateUploadUrlWithCustomKey = mutation({
    args: {},
    handler: async (ctx) => {
      // Replace this with whatever function you use to get the current user
      const currentUser = await ctx.auth.getUserIdentity();
      if (!currentUser) {
        throw new Error("User not authenticated");
      }
      const userId = currentUser.subject;
      const key = `${userId}.${crypto.randomUUID()}`;
      return r2.generateUploadUrl(key);
    },
  });


  export const list = query({
    args: {},
    handler: async (ctx) => {
      const engress = await ctx.db.query("engress").collect();

      return Promise.all(
        engress.map(async (engress) => {
          try {
            const videoUrl = await r2.getUrl(
              engress.s3Key,
              {
                expiresIn: 60 * 60 * 24, // 1 day
              }
            );
            return {
              ...engress,
              videoUrl,
            };
          } catch (error) {
            // If URL generation fails, return null for videoUrl
            console.error(`Failed to generate URL for key ${engress.s3Key}:`, error);
            return {
              ...engress,
              videoUrl: null,
            };
          }
        })
      );
    },
  });

  // export const getMetadata = query({
  //   args: {
  //     key: v.string(),
  //   },
  //   handler: async (ctx, args) => {
  //     return await r2.getMetadata(args.key);
  //   },
  // });
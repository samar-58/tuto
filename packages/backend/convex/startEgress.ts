"use node";
import { EgressClient, EncodingOptionsPreset, RoomCompositeEgressRequest, SegmentedFileOutput } from "livekit-server-sdk";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";

const API_KEY = process.env.LIVEKIT_API_KEY!;
const API_SECRET = process.env.LIVEKIT_API_SECRET!;
const LIVEKIT_URL = process.env.LIVEKIT_URL!;
const ACCESSKEY = process.env.R2_ACCESS_KEY_ID!;
const SECRET = process.env.R2_SECRET_ACCESS_KEY!;
const BUCKET = process.env.R2_BUCKET!;
const ENDPOINT = process.env.R2_ENDPOINT!;
const REGION = process.env.S3_REGION!;

export const startEgress = action(async (ctx, { roomName, username }: { roomName: string, username: string }) => {
  if (!roomName) {
    throw new Error("Room name is required");
  }
  
  // userId is passed from the HTTP endpoint since auth context doesn't flow through ctx.runAction
  // if (!userId) {
  //   throw new Error("User ID is required");
  // }
  
  const egressClient = new EgressClient(LIVEKIT_URL, API_KEY, API_SECRET);
  const outputs = {
    segments: new SegmentedFileOutput({
      filenamePrefix: `${roomName}`,
      playlistName: `${roomName}.m3u8`,
      livePlaylistName: `${roomName}-live.m3u8`,
      segmentDuration: 10,
      output: {
        case: 's3',
        value: {
          accessKey: ACCESSKEY,
          secret: SECRET,
          bucket: BUCKET,
          endpoint: ENDPOINT,
          region: REGION,
          forcePathStyle: false,
        },
      },
    }),
  };
  const egressOptions = {
    layout: 'single-speaker',
    encodingOptions: EncodingOptionsPreset.H264_1080P_30,
    audioOnly: false,
  }
  try {
    const egressInfo = await egressClient.startParticipantEgress(roomName, username, outputs, egressOptions);
    const storeIngressData = await ctx.runMutation(internal.engress.ingressStore.storeIngressData, {
      egressId: egressInfo.egressId,
      roomName: roomName,
      username: username,
      status: "recording",
      startedAt: new Date().getTime(),
      s3Key: `${roomName}/${username}`,
      //userId: userId,
    });
    console.log("Store Ingress Data", storeIngressData);
    console.log(`Egress started with ID: ${egressInfo.egressId}`);
    return { egressId: egressInfo.egressId }
  } catch (error) {
    console.error("Failed to start egress:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to start recording");
  }
});



export const getEgressStatus = action(async (ctx, { egressId }: { egressId: string }) => {
  const egressClient = new EgressClient(LIVEKIT_URL, API_KEY, API_SECRET);
  
  try {
    const egressInfo = await egressClient.listEgress({
      egressId: egressId,
    });
    
    console.log("Egress info:", egressInfo);
    
    return {
      egressId: egressInfo[0]?.egressId,
      status: egressInfo[0]?.status,
      startedAt: egressInfo[0]?.startedAt,
      updatedAt: egressInfo[0]?.updatedAt,
      result: egressInfo[0]?.result, // File outputs
    };
  } catch (error) {
    console.error("Failed to get egress status:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to get status");
  }
});

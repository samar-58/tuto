"use node";
import { EgressClient, EncodingOptionsPreset, RoomCompositeEgressRequest, SegmentedFileOutput } from "livekit-server-sdk";
import { action } from "./_generated/server";

const API_KEY = process.env.LIVEKIT_API_KEY!;
const API_SECRET = process.env.LIVEKIT_API_SECRET!;
const LIVEKIT_URL = process.env.LIVEKIT_URL!; 
const ACCESSKEY = process.env.S3_ACCESS_KEY!;
const SECRET = process.env.S3_SECRET_KEY!;
const BUCKET = process.env.S3_BUCKET_NAME!;
const ENDPOINT = process.env.S3_ENDPOINT!;
const REGION = process.env.S3_REGION!;

export const startEgress = action(async (ctx, { roomName,username }: { roomName: string,username:string }) => {
    if (!roomName) {
        throw new Error("Room name is required");
    }
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
        endpoint:ENDPOINT,
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
        const egressInfo = await egressClient.startParticipantEgress(roomName,username,outputs,egressOptions);
        console.log(`Egress started with ID: ${egressInfo.egressId}`);
         return {egressId: egressInfo.egressId}
    } catch (error) {
        console.error("Failed to start egress:", error);
        throw new Error(error instanceof Error ? error.message : "Failed to start recording");
    }
});





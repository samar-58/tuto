"use node";
import { EgressClient, EncodingOptionsPreset, RoomCompositeEgressRequest, SegmentedFileOutput } from "livekit-server-sdk";
import { action } from "./_generated/server";

const API_KEY = process.env.LIVEKIT_API_KEY!;
const API_SECRET = process.env.LIVEKIT_API_SECRET!;
const LIVEKIT_URL = process.env.LIVEKIT_URL!; 

export const startEgress = action(async (ctx, { roomName }: { roomName: string }) => {
    if (!roomName) {
        throw new Error("Room name is required");
    }

    const egressClient = new EgressClient(LIVEKIT_URL, API_KEY, API_SECRET);

 const outputs = {
  segments: new SegmentedFileOutput({
    filenamePrefix: 'my-output',
    playlistName: 'my-output.m3u8',
    livePlaylistName: 'my-output-live.m3u8',
    segmentDuration: 2,
    output: {
      case: 's3',
      value: {
        accessKey: '52a147ef0cae253e4132f9d75cbd2198',
        secret: 'b573088a6c8e3eb7ab5c821e730ce370c0a58612f42828f050baf0abad63aa79',
        bucket: 'tuto',
        region: 'Asia-Pacific',
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
        const egressInfo = await egressClient.startRoomCompositeEgress(roomName,outputs,egressOptions);
        console.log(`Egress started with ID: ${egressInfo.egressId}`);
        return egressInfo;
    } catch (error) {
        console.error("Failed to start egress:", error);
        throw new Error("Failed to start recording");
    }
});





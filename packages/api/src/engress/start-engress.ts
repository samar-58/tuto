import prisma from "@tuto/db";
import { EgressClient, EgressInfo, EncodingOptionsPreset, SegmentedFileOutput } from "livekit-server-sdk";

const API_KEY = Bun.env.LIVEKIT_API_KEY!;
const API_SECRET = Bun.env.LIVEKIT_API_SECRET!;
const LIVEKIT_URL = Bun.env.LIVEKIT_URL!;
const ACCESSKEY = Bun.env.R2_ACCESS_KEY_ID!;
const SECRET = Bun.env.R2_SECRET_ACCESS_KEY!;
const BUCKET = Bun.env.R2_BUCKET!;
const ENDPOINT = Bun.env.R2_ENDPOINT!;
const REGION = Bun.env.S3_REGION!;

export const startEngress = async (roomName: string, userName: string) => {
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
        const egressInfo = await egressClient.startParticipantEgress(roomName, userName, outputs, egressOptions);
        try {
            await prisma.$transaction(async (tx) => {
                await tx.meeting.update({
                    where: {
                        id: roomName
                    },
                    data: {
                        hasEgress: true
                    },
                });
                await tx.egress.create({
                    data: {
                        id: egressInfo.egressId,
                        meetingId: roomName
                    },
                });
            });
        } catch (error) {
            console.error("Failed to create db entries for egress:", error);
            throw new Error(error instanceof Error ? error.message : "Failed to create db entries for egress");
        }
        return { egressId: egressInfo.egressId };
    } catch (error) {
        console.error("Failed to start egress:", error);
        throw new Error(error instanceof Error ? error.message : "Failed to start recording");
    }
};

export const getEgressInfo = async (egressId: string): Promise<EgressInfo | undefined> => {
    const egressClient = new EgressClient(LIVEKIT_URL, API_KEY, API_SECRET);

    try {
        const egressInfo = await egressClient.listEgress({ egressId: egressId });
        return egressInfo[0];
    } catch (error) {
        console.error("Failed to get egress info:", error);
        throw new Error(error instanceof Error ? error.message : "Failed to get status");
    }
}


import prisma from "@tuto/db";
import { EgressClient, EncodingOptionsPreset, SegmentedFileOutput } from "livekit-server-sdk";
import { Effect } from "effect";

const API_KEY = Bun.env.LIVEKIT_API_KEY!;
const API_SECRET = Bun.env.LIVEKIT_API_SECRET!;
const LIVEKIT_URL = Bun.env.LIVEKIT_URL!;
const ACCESSKEY = Bun.env.R2_ACCESS_KEY_ID!;
const SECRET = Bun.env.R2_SECRET_ACCESS_KEY!;
const BUCKET = Bun.env.R2_BUCKET!;
const ENDPOINT = Bun.env.R2_ENDPOINT!;
const REGION = Bun.env.S3_REGION!;


export const startEngress = (roomName: string, userName: string) => Effect.gen(function* () {
    if (!roomName || !userName) {
        yield* Effect.die(new Error("Room name and user name are required"));
    }
    yield* Effect.log(roomName);
    yield* Effect.log(userName);
    const egressClient = yield* Effect.succeed(new EgressClient(LIVEKIT_URL, API_KEY, API_SECRET));
    const outputs = yield* Effect.succeed({
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
        })
    });
    const egressOptions = yield* Effect.succeed({
        layout: 'single-speaker',
        encodingOptions: EncodingOptionsPreset.H264_1080P_30,
        audioOnly: false,
    });
    const egressInfo = yield* Effect.promise(() => egressClient.startParticipantEgress(roomName, userName, outputs, egressOptions));
    yield* Effect.tryPromise({
        try: async (): Promise<void> => {
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
        },
        catch: (error) => {
            return Effect.log(error);
        }
    })
    yield* Effect.log(egressInfo);
    yield* Effect.log(egressInfo.egressId);
    return { egressId: egressInfo.egressId };
});


export const getEgressInfo = (egressId: string) => Effect.gen(function* () {
    if (!egressId) {
        yield* Effect.die(new Error("Egress ID is required"));
    }
    const egressClient = yield* Effect.succeed(new EgressClient(LIVEKIT_URL, API_KEY, API_SECRET));
    const egressInfo = yield* Effect.promise(() => egressClient.listEgress({ egressId: egressId }));
    if (!egressInfo) {
        yield* Effect.die(new Error("Egress info not found"));
    }
    yield* Effect.log(egressInfo[0]);
});


import ffmpeg from "fluent-ffmpeg";
import {
    S3Client,
    CreateMultipartUploadCommand,
    UploadPartCommand,
    CompleteMultipartUploadCommand,
    AbortMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { PassThrough } from "stream";


const r2 = new S3Client({
    region: "auto", 
    endpoint: Bun.env.R2_ENDPOINT!,
    forcePathStyle : true,
    credentials: {
      accessKeyId: Bun.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: Bun.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  const PART_SIZE = 5 * 1024 * 1024;

async function uploadStreamAsMultipart(stream: NodeJS.ReadableStream, key: string) {
    const bucket = Bun.env.R2_BUCKET!;

    const { UploadId } = await r2.send(new CreateMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        ContentType: "audio/mpeg",
    }));

    if (!UploadId) {
        throw new Error("Failed to initiate multipart upload");
    }

    const uploadedParts: { ETag: string; PartNumber: number }[] = [];
    let partNumber = 1;
    let buffer = Buffer.alloc(0);

    const uploadPart = async (data: Buffer) => {
        const response = await r2.send(new UploadPartCommand({
            Bucket: bucket,
            Key: key,
            UploadId,
            PartNumber: partNumber,
            Body: data,
            ContentLength: data.length,
        }));

        if (!response.ETag) {
            throw new Error(`Multipart upload missing ETag for part ${partNumber}`);
        }

        uploadedParts.push({ ETag: response.ETag, PartNumber: partNumber });
        partNumber += 1;
    };

    try {
        for await (const chunk of stream) {
            const chunkBuffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            buffer = Buffer.concat([buffer, chunkBuffer]);

            while (buffer.length >= PART_SIZE) {
                const partBuffer = buffer.subarray(0, PART_SIZE);
                buffer = buffer.subarray(PART_SIZE);
                await uploadPart(partBuffer);
            }
        }

        if (buffer.length > 0) {
            await uploadPart(buffer);
        }

        await r2.send(new CompleteMultipartUploadCommand({
            Bucket: bucket,
            Key: key,
            UploadId,
            MultipartUpload: { Parts: uploadedParts },
        }));
    } catch (error) {
        await r2.send(new AbortMultipartUploadCommand({
            Bucket: bucket,
            Key: key,
            UploadId,
        })).catch(abortError => {
            console.error("Failed to abort multipart upload:", abortError);
        });
        throw error;
    }
}

export async function convertVideoToMp3(videoUrl: string) {
    const fileName = videoUrl.split("/").pop()?.replace(/\.[^/.]+$/, "") || "audio";
    const key = `${fileName}.mp3`;
    const passThrough = new PassThrough();
    const uploadPromise = uploadStreamAsMultipart(passThrough, key);

    ffmpeg(videoUrl)
        .audioCodec("libmp3lame")
        .format("mp3")
        .on("start", cmd => {
            console.log("FFmpeg command:", cmd);
        })
        .on("error", err => {
            console.error("FFmpeg error:", err);
            passThrough.destroy(err);
        })
        .on("end", () => {
            passThrough.end();
            console.log("FFmpeg finished");
        })
        .pipe(passThrough, { end: false });

    try {
        await uploadPromise;
        return { key };
    } catch (error) {
        console.error("Failed to upload MP3 to S3/R2:", error);
        throw error;
    }
}
import sharp from "sharp";
import {
    S3Client,
    ListObjectsV2Command,
    GetObjectCommand,
    PutObjectCommand,
} from "@aws-sdk/client-s3";
import env from "dotenv";
env.config();

// Configure AWS S3 bucket details
const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const bucketAccessKey = process.env.BUCKET_ACCESS_KEY;
const bucketSecretKey = process.env.BUCKET_SECRET_KEY;

// Initialize AWS S3 Client with credentials
const client = new S3Client({
    region: bucketRegion,
    credentials: {
        accessKeyId: bucketAccessKey,
        secretAccessKey: bucketSecretKey,
    },
});

/**
 * Lists images in the S3 bucket and resizes images uploaded in the last 24 hours.
 */
export async function listAndResizeImages() {
    const command = new ListObjectsV2Command({
        Bucket: bucketName,
        // MaxKeys is not specified, so it defaults to 1000 or AWS's default
        // MaxKeys: 10,
    });

    try {
        let isTruncated = true;
        while (isTruncated) {
            const { Contents, IsTruncated, NextContinuationToken } = await client.send(command);

            const currentTime = new Date();

            // Process each image in the bucket
            for (const content of Contents) {
                const lastModified = content.LastModified;
                const timeDifference = currentTime - lastModified;

                // Resize if the image was uploaded in the last 24 hours
                if (timeDifference <= 86400000) { // 24 hours in milliseconds
                    await resizeImage(content.Key);
                }
            }

            isTruncated = IsTruncated;
            command.input.ContinuationToken = NextContinuationToken;
        }
    } catch (err) {
        console.error("Error listing objects:", err);
    }
}

/**
 * Resizes an image from the S3 bucket.
 * 
 * @param {string} imageKey - The key of the image in the S3 bucket to resize.
 */
async function resizeImage(imageKey) {

    const getObjectCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: imageKey,
    });

    try {
        const response = await client.send(getObjectCommand);

        if (!response.Body) {
            throw new Error(`No data found for ${imageKey}`);
        }

        // Create a buffer from the image data
        const chunks = [];
        for await (const chunk of response.Body) {
            chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);

        // Resize the image
        const resizedImage = await sharp(buffer)
            .resize({ fit: sharp.fit.contain })
            .jpeg({ quality: 80 })
            .toBuffer();

        // Overwrite the original image in the bucket
        const putObjectCommand = new PutObjectCommand({
            Bucket: bucketName,
            Key: imageKey,
            Body: resizedImage,
            ContentType: 'image/jpeg'
        });

        await client.send(putObjectCommand);
        console.log(`Resized image overwritten: ${imageKey}`);
    } catch (err) {

        console.error("Error processing file", imageKey, err);
    }
}

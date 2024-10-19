import { serve } from "@hono/node-server";
import { randomUUID } from "node:crypto";
import { Hono } from "hono";
import { S3 } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

const app = new Hono();

const s3 = new S3({
	endpoint: process.env.S3_URL_ENDPOINT,
	credentials: {
		accessKeyId: process.env.S3_ACCESS_KEY,
		secretAccessKey: process.env.S3_SECREAT_ACCESS_KEY,
		
	},
	region: "auto",
});

//TODO: Add progress handler
// TODO: Handle multiple files

app.post("/upload", async (c) => {
	const body = await c.req.formData();

	const file = body.get("file");

	if (!file) {
		return c.json({ message: "No files uploaded" });
	}

	const params = {
		Bucket: process.env.S3_BUCKET_NAME,
		Key: `${randomUUID()}${new Date().getTime()}`,
		Body: (file as File).stream(),
		ContentType: (file as File).type,
	};

	const parallelUploads3 = new Upload({
		client: s3,
		queueSize: 4,
		leavePartsOnError: false,
		params: params,
	});

	await parallelUploads3.done();

	return c.json({ message: "File uploaded successfully" });
});

const port = 3000;
console.log(`Server is running on port ${port}`);

serve({
	fetch: app.fetch,
	port,
});

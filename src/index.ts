import { Buffer } from "node:buffer";
import Cloudflare from 'cloudflare';

interface Env {
	USERNAME: string,
	PASSWORD: string,
	CLOUDFLARE_API_KEY: string,
	CLOUDFLARE_ID: string,
	CLOUDFLARE_EMAIL: string,
}

const encoder = new TextEncoder();

function timingSafeEqual(a: string, b: string): boolean {
	const aBytes = encoder.encode(a);
	const bBytes = encoder.encode(b);

	if (aBytes.byteLength !== bBytes.byteLength) {
	  return false
	}

	return crypto.subtle.timingSafeEqual(aBytes, bBytes);
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		// Check request is of an obfuscated method
		if (request.method !== "PUT") {
			console.log(`received non-PUT request: ${request.method}`);
			return new Response(null, {status: 404});
		}

		// Make sure we are using a secure protocol
		if (new URL(request.url).protocol !== "https:") {
			console.log(`got a request that isn't https: ${new URL(request.url).protocol}`);
			return new Response(null, {status: 404});
		}

		// Check if authorization header is valid
		const authorization = request.headers.get("Authorization");
		if (!authorization) {
			console.log("Authorization header did not exist");
			return new Response(null, {status: 404})
		}

		const [scheme, encoded] = authorization.split(" ");
		if (!encoded || scheme !== "Basic") {
			console.log(`Authorization header existed, but not of basic encoding: ${authorization}`);
			return new Response(null, {status: 404})
		}

		const creds = Buffer.from(encoded, "base64").toString();
		const index = creds.indexOf(":");
		const user = creds.substring(0, index);
		const pass = creds.substring(index + 1);

		// Check environment for correct credentials
		if (env.USERNAME === undefined) {
			console.log("USERNAME environment variable not defined");
			return new Response(null, {status: 500});
		}
		if (env.PASSWORD === undefined) {
			console.log("PASSWORD environment variable not defined");
			return new Response(null, {status: 500});
		}

		// Check authorization credentials against environment
		if (!timingSafeEqual(user, env.USERNAME) || !timingSafeEqual(pass, env.PASSWORD)) {
			console.log(`invalid credentials received: u:${user} p:${pass}`);
			return new Response(null, {status: 401});
		}

		// Update cloudflare DNS
		if (env.CLOUDFLARE_API_KEY === undefined) {
			console.log("CLOUDFLARE_API_KEY environment variable not defined");
			return new Response(null, {status: 500});
		}
		if (env.CLOUDFLARE_EMAIL === undefined) {
			console.log("CLOUDFLARE_EMAIL environment variable not defined");
			return new Response(null, {status: 500});
		}
		if (env.CLOUDFLARE_ID === undefined) {
			console.log("CLOUDFLARE_ID environment variable not defined");
			return new Response(null, {status: 500});
		}

		const cloudflare = new Cloudflare({
			apiKey: env.CLOUDFLARE_API_KEY,
		});

		const zone = await cloudflare.zones.list().catch(async(err) => {
			console.log(err)
		})

		console.log(zone)

		return new Response("nice!", {status: 200});
	},
};

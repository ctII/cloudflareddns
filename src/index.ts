import { Buffer } from "node:buffer";

interface Env {
	CLOUDFLARE_API_KEY: string,
	CLOUDFLARE_ZONE_ID: string,
	CLOUDFLARE_DNS_RECORD_NAME: string,
	CLOUDFLARE_DNS_RECORD_ID: string,
	USERNAME: string,
	PASSWORD: string,
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
		if (request.method !== "GET") {
			console.log(`received non-GET request: ${request.method}`);
			return new Response(null, {status: 404});
		}

		const url = new URL(request.url)

		// Check if it follows dyndns2
		if (url.pathname !== "/nic/update") {
			console.log("received invalid pathname");
			return new Response(null, {status: 404});
		}

		// Make sure we are using a secure protocol
		if (url.protocol !== "https:") {
			console.log(`got a request that isn't https: ${new URL(request.url).protocol}`);
			return new Response(null, {status: 404});
		}

		const { searchParams } = new URL(request.url)

		let user:string;
		let pass:string;

		// Check if the username and password exist in the url, if not use the Authorization header
		let urlUsername = searchParams.get('username')
		let urlPassword = searchParams.get('password')
		if (urlUsername !== null && urlPassword !== null) {
			user = urlUsername
			pass = urlPassword
		} else {
			// Check if authorization header is valid
			const authorization = request.headers.get("Authorization");
			if (!authorization) {
				console.log("Authorization header did not exist");
				return new Response(null, {status: 404});
			}

			if (!authorization.startsWith("Basic ")) {
				console.log("Authorization header sent, but without a \"Basic \" prefix")
				return new Response(null, {status: 404});
			}

			// Split out the username and password from the base64 encoded Basic auth header
			const basic = authorization.slice("Basic ".length);
			const creds = Buffer.from(basic, "base64").toString();
			const index = creds.indexOf(":");
			user = creds.substring(0, index);
			pass = creds.substring(index + 1);
		}

		// Check environment that correct credentials are defined
		if (env.USERNAME === undefined) {
			console.log("USERNAME environment variable not defined");
			return new Response(null, {status: 500});
		}
		if (env.PASSWORD === undefined) {
			console.log("PASSWORD environment variable not defined");
			return new Response(null, {status: 500});
		}

		// Check authorization credentials against environment
		const usernameValid = timingSafeEqual(user, env.USERNAME);
		const passwordValid = timingSafeEqual(pass, env.PASSWORD);

		// Do so after making sure we always constant compare both user and pass
		if (!usernameValid || !passwordValid) {
			console.log(`invalid credentials received: u:${user} p:${pass}`);
			return new Response(null, {status: 401});
		}

		// Get Environment secrets for updating cloudflare DNS
		if (env.CLOUDFLARE_API_KEY === undefined) {
			console.log("CLOUDFLARE_API_KEY environment variable not defined");
			return new Response(null, {status: 500});
		}
		if (env.CLOUDFLARE_DNS_RECORD_ID === undefined) {
			console.log("CLOUDFLARE_DNS_RECORD_ID environment variable not defined");
			return new Response(null, {status: 500});
		}
		if (env.CLOUDFLARE_DNS_RECORD_NAME === undefined) {
			console.log("CLOUDFLARE_DNS_RECORD_NAME environment variable not defined");
			return new Response(null, {status: 500});
		}
		if (env.CLOUDFLARE_ZONE_ID === undefined) {
			console.log("CLOUDFLARE_ZONE_ID environment variable not defined");
			return new Response(null, {status: 500});
		}

		let hostname = searchParams.get('hostname')
		if (hostname === null) {
			console.log("url query didn't include a hostname per dyndns2")
			return new Response(null, {status: 400});
		}

		let ip = searchParams.get('myip')
		if (ip === null) {
			console.log("url query didn't include a field myip per dyndns2");
			return new Response(null, {status:400});
		}

		if (!timingSafeEqual(hostname, env.CLOUDFLARE_DNS_RECORD_NAME)) {
			console.log("invalid hostname specified to update from requestor");
			return new Response(null, {status:403});
		}

		// Update cloudflare DNS
		const dnsUpdateReq = new Request(`https://api.cloudflare.com/client/v4/zones/${env.CLOUDFLARE_ZONE_ID}/dns_records/${env.CLOUDFLARE_DNS_RECORD_ID}`, {
			method: "PATCH",
			headers: new Headers({
				"Content-Type": "application/json",
				"Authorization": `Bearer ${env.CLOUDFLARE_API_KEY}`,
			}),
			body: JSON.stringify({
				content: ip,
				name: env.CLOUDFLARE_DNS_RECORD_NAME,
				type: "A",
				id: env.CLOUDFLARE_DNS_RECORD_ID,
			}),
		});

		const dnsUpdate = await fetch(dnsUpdateReq);
		if (!dnsUpdate.ok) {
			console.log(`cloudflare api error ${dnsUpdate.status}:${dnsUpdate.body}`);
			return new Response("error trying to update DNS record on cloudflare", {status: 500});
		}

		return new Response(null, {status: 200});
	},
};

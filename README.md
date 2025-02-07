# cloudflareddns

cloudflareddns is a simple cloudflare worker that is designed to let a script/program modify a AAAA/A DNS record in cloudflare for a specific domain without
giving that program complete access to the cloudflare api key.

This is a problem with cloudflare free plans that do not allow you to give an apikey that is scoped to edit the DNS on a subdomain to every client/untrusted clients

## Configuration

Each {subdomain} is added to a json array in the environment variable DOMAINS

Every domain should have a secret named {subdomain}_PASS

Environment variables:

* CLOUDFLARE_API_KEY  = apikey scoped to the domain that is to be modified
* CLOUDFLARE_ZONE_ID  = ID of the zone (domain) to be modified
* CLOUDFLARE_USERNAME = username for the HTTP Basic Authorization header, this can be really whatever you want
* CLOUDFLARE_PASSWORD = first level password for HTTP Authorization header (password in HTTP Basic Authorization header is {CLOUDFLARE_PASSWORD}+{subdomain_password})

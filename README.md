# cloudflareddns

cloudflareddns is a simple cloudflare worker that is designed to let a script/program to modify a AAAA/A DNS record in Cloudflare for a specific domain without giving that program complete access to the cloudflare apikey.

This is a problem with cloudflare free plans that do not allow you to give an apikey that is scoped to edit the DNS on a subdomain to every client/untrusted clients

## Dependancies

### Fedora
```sh
sudo dnf install make podman -y
```

## Installing to Cloudflare
```sh
make
```

Then remove the wrangler secrets, npm files, and podman images
```sh
make clean
```

Now you can go and create the dns record in the Cloudflare dashboard:

```[Dashboard] > [Cloudflare Email]] > [Account Home] > [Domain] > [DNS] > [Records]```

Then pull up the audit logs and get the zone_id and id for the dns record (it should be labeled as an "Update" action)

```[Dashboard] > [Cloudflare Email] > [Manage Account] > [Audit Logs]```

Then create an apikey under:

https://dash.cloudflare.com/profile/api-tokens ```> [Create Token] > [Edit zone DNS] > [Use Template] > [Zone Resource] > [Select] > [Domain To Use]```

## Configuration

### Secrets
All these secrets must be defined in the workers secrets

#### ```CLOUDFLARE_API_KEY```
apikey scoped to the domain that is to be modified

#### ```CLOUDFLARE_ZONE_ID```
zone_id (domain) to be modified (can be found in audit logs)

#### ```CLOUDFLARE_DNS_RECORD_ID```
id of the dns record in the CLOUDFLARE_ZONE_ID (can be found in audit logs)

#### ```USERNAME```
username for the HTTP Basic Authorization header

#### ```PASSWORD```
password for the HTTP Basic Authorization header

## Usage

cloudflareddns roughly follows dyndns2 (enough to work with dyndns2 option on opnsense):

Updating the IP on the cloudflare worker requires sending a http GET request to:
```
https://{USERNAME}:{PASSWORD}@[username.workers.dev]/nic/update?hostname={DNS_RECORD_ID_HOSTNAME}&myip={IP}
```

Or if the software doesn't support moving the {username}:{password} at the start automatically into a http ```Authorization: Basic {base64}```, the other option is to put it in the url as parameters:
```
https://[username.workers.dev]/nic/update?hostname={DNS_RECORD_ID_HOSTNAME}&myip={IP}&username={USERNAME}&password={PASSWORD}
```

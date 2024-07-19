all: build-dockerfile npm-install deploy

build-dockerfile:
	podman build -f Dockerfile.wrangler -t localhost/cloudflareddns/wrangler:latest

types: build-dockerfile
	#	--rm to remove container after it exits
	#	./:/data for mounting the git repository to the container /data where the Dockerfiles are set to WORKDIR (cd)
	#	:Z is for relabeling the git repository on SELinux enabled systems to be mountable in the container
	#	--pull=never to prevent podman from trying to pull the container image we should have built from a registry
	podman run -it --rm -v ./:/data:Z --pull=never localhost/cloudflareddns/wrangler:latest types

npm-install:
	#	--rm to remove container after it exits
	#	./:/data for mounting the git repository to the container /data where the Dockerfiles are set to WORKDIR (cd)
	#	:Z is for relabeling the git repository on SELinux enabled systems to be mountable in the container
	#	--pull=never to prevent podman from trying to pull the container image we should have built from a registry
	#	"--entrypoint npm" to switch the main command in the container image from wrangler to npm for "npm install"
	podman run -it --rm -v ./:/data:Z --pull=never --entrypoint npm localhost/cloudflareddns/wrangler:latest install

deploy:
	#	premake the .wrangler/config directory for podman
	mkdir -p .wrangler/config
	#	--rm to remove container after it exits
	#	--network=host because we need "http://localhost:8976/oauth/callback?code={oauth_callback_code}"
	#	./.wrangler/config to container /root/.config/.wrangler to have a place to save the wrangler.toml file with authentication information
	#	--pull=never to prevent podman from trying to pull the container image we should have built from a registry
	test -e .wrangler/config/default.toml || podman run --rm -it --network=host -v ./.wrangler/config/:/root/.config/.wrangler/config/:Z --pull=never localhost/cloudflareddns/wrangler:latest login --browser=false --scopes workers:write workers_scripts:write user:read
	#	--rm to remove container after it exits
	#	./:/data for mounting the git repository to the container /data where the Dockerfiles are set to WORKDIR (cd)
	#	:Z is for relabeling the git repository on SELinux enabled systems to be mountable in the container
	#	--pull=never to prevent podman from trying to pull the container image we should have built from a registry
	podman run -it --rm -v ./.wrangler/config/:/root/.config/.wrangler/config/:Z -v ./:/data:Z --pull=never localhost/cloudflareddns/wrangler:latest deploy
	#	You can now delete "./.wrangler/config/default.toml" or "make clean" if you do not need to deploy or run other wrangler commands again
	#	This will prevent storing the cloudflare oauth secrets in the repository

clean:
	rm -r .wrangler/ .env node_modules/
	podman image rm localhost/cloudflareddns/wrangler:latest

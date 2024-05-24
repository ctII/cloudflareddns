all: build-dockerfiles npm-install deploy

build-dockerfiles:
	cd docker && make

types: build-dockerfiles
	podman run -it -v ./:/data:Z localhost/cloudflareddns/wrangler:latest types

npm-install:
	podman run -it -v ./:/data:Z localhost/cloudflareddns/npm:latest install

deploy:
	#	premake the .wrangler/config directory for podman
	mkdir -p .wrangler/config
	#	--network=host because we need "http://localhost:8976/oauth/callback?code={oauth_callback_code}"
	#	./.wrangler/config to container /root/.config/.wrangler to have a place to save the wrangler.toml file with authentication information
	test -e .wrangler/config/default.toml || podman run -it --network=host -v ./.wrangler/config/:/root/.config/.wrangler/config/:Z localhost/cloudflareddns/wrangler:latest login --browser=false --scopes workers:write workers_scripts:write user:read
	#	./:/data for mounting the git repository to the container /data where the Dockerfiles are set to WORKDIR (cd)
	#	:Z is for relabeling the git repository on SELinux enabled systems to be mountable in the container
	podman run -it -v ./.wrangler/config/:/root/.config/.wrangler/config/:Z -v ./:/data:Z localhost/cloudflareddns/wrangler:latest deploy
	#	You can now delete "./.wrangler/config/default.toml" or "make clean" if you do not need to deploy or run other wrangler commands again
	#	This will prevent storing the cloudflare oauth secrets in the repository

clean:
	rm -r .wrangler/ .env node_modules/

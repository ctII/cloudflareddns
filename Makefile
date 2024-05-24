build-dockerfiles:
	cd docker && make

types: build-dockerfiles
	podman run -it -v ./:/data:Z localhost/cloudflareddns/wrangler:latest types

deploy:
	mkdir -p .wrangler/config
	podman run -it -v ./.wrangler/config/:/root/.config/.wrangler/config/:Z -v ./:/data:Z localhost/cloudflareddns/wrangler:latest deploy

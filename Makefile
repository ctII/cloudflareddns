build-dockerfiles:
	cd docker && make

types: build-dockerfiles
	podman run -it -v ./:/data:Z localhost/cloudflareddns/wrangler:latest types

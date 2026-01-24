.PHONY: local build release

local:
	hugo server --buildDrafts

build:
	hugo build

release:
	hugo build --gc --minify

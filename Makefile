.PHONY: install build build-dev clean

install:
	yarn install

build: install
	yarn generate

build-dev: install
	yarn build:dev

clean:
	rm -rf dist

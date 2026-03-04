BIN := ./node_modules/.bin
TS_FILES := $(shell find src/ -name '*.ts')
TEST_FILES := src/**/*.test.ts

all: dist

## help:		show this help
.PHONY: help
help:
	@sed -n 's/^##//p' Makefile

## run:		run application
.PHONY: run
run: dist
	@node --enable-source-maps dist/app.js

## test:		run tests
.PHONY: test
test: node_modules
	node --test --experimental-test-coverage -r @swc-node/register src/**/*.test.ts src/**/**/*.test.ts

## test-watch:	run tests and watch for changes
.PHONY: test-watch
test-watch : node_modules
	node --test --experimental-test-coverage --watch -r @swc-node/register src/**/*.test.ts src/**/**/*.test.ts

## test-debug:	run tests in debugger (opens chrome)
.PHONY: test-debug
test-debug:
	# MUST pass FILE variable like make test-debug FILE=./test.ts
	open -a 'google chrome' chrome://inspect && \
		node --nolazy --enable-source-maps --inspect-brk \
		./node_modules/.bin/mocha -b -r ts-node/register --timeout 999999 ${FILE}

## clean: 	clean the project
.PHONY: clean
clean:
	rm -rf coverage dist node_modules package-lock.json

dist: node_modules $(TS_FILES) tsconfig.json
	rm -rf dist
	$(BIN)/tsc -p tsconfig-build.json

node_modules: package.json package-lock.json
	npm install || (rm -rf $@; exit 1)
	test -d $@ && touch $@ ||:

package-lock.json:
	npm install

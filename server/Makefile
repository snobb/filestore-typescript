BIN := ./node_modules/.bin
TS_FILES := ${shell find src/ -name '*.ts'}
TEST_FILES := ${shell find src/ -name '*.test.ts'}

all: dist

## help:		show this help
.PHONY: help
help:
	@sed -n 's/^##//p' Makefile

## run:		run the program
run: dist
	node --enable-source-maps ./dist/app.js

## test: 		run unit tests (if FILE env variable specified - run test for that file)
.PHONY: test
ifdef FILE
test: dist
	node --test --experimental-transform-types --experimental-test-coverage ${FILE}
	node --test-reporter=spec
else
test: dist
	node --test --experimental-transform-types --experimental-test-coverage ${TEST_FILES}
endif

.PHONY: clean-dist
clean-dist:
	-rm -rf dist

## clean: 	clean the project
.PHONY: clean
clean: clean-dist
	-rm -rf coverage node_modules package-lock.json


## dist:		build the project
.PHONY: dist
dist: clean-dist node_modules $(TS_FILES) tsconfig.json package.json
	$(BIN)/tsc -p tsconfig-build.json || rm -rf dist

.PHONY: node_modules
node_modules: package-lock.json
	npm install || (rm -rf node_modules; exit 1)
	test -d $@ && touch $@ ||:

package-lock.json:
	npm install

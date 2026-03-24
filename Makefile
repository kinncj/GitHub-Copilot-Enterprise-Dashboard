.PHONY: dev build test test-e2e test-all coverage install clean lint

install:
	npm install
	npx playwright install --with-deps chromium

dev:
	npm run dev

build:
	npm run build

test:
	npm run test

test-e2e:
	npm run test:e2e

test-all:
	npm run test:all

coverage:
	npm run test:coverage

lint:
	npm run lint

clean:
	rm -rf dist node_modules coverage playwright-report test-results

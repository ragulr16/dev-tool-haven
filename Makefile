.PHONY: install dev build serve test clean help

# Default target
help:
	@echo "Developer Tools Hub - Makefile"
	@echo "Available targets:"
	@echo "  install     Install dependencies"
	@echo "  dev         Start development server"
	@echo "  build       Create production build"
	@echo "  serve       Serve production build locally (Netlify)"
	@echo "  prod        Build and serve production version"
	@echo "  test        Run test suite"
	@echo "  clean       Remove node_modules and build artifacts"
	@echo "  help        Show this help message"

install:
	@echo "Installing dependencies..."
	npm install

dev:
	@echo "Starting development server..."
	npm run dev

build:
	@echo "Building production assets..."
	@echo "Building Netlify functions..."
	npm run build:functions
	npm run build

serve:
	@echo "Serving production build via Netlify..."
	netlify dev

prod: build
	@echo "Starting production server..."
	netlify serve

test:
	@echo "Running test suite..."
	npm test

clean:
	@echo "Cleaning project..."
	rm -rf node_modules
	rm -rf .next
	rm -rf out 
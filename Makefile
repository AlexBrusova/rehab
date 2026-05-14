# Full stack: Postgres, Redis, API, frontend, Prometheus, Grafana, Loki, Promtail.
# Requires Docker Compose v2 (`docker compose`).

ROOT := $(patsubst %/,%,$(dir $(abspath $(lastword $(MAKEFILE_LIST)))))
COMPOSE ?= docker compose
RUN := cd "$(ROOT)" && $(COMPOSE)

.DEFAULT_GOAL := up

.PHONY: up build rebuild down clean ps logs e2e help

## up (default): build images if needed and start all services in the background
up:
	$(RUN) up -d --build

## build: build container images only
build:
	$(RUN) build

## rebuild: full image rebuild without cache, then start the stack
rebuild:
	$(RUN) build --no-cache
	$(RUN) up -d

## down: stop containers (volumes kept)
down:
	$(RUN) down

## clean: stop and remove named volumes (DB, Prometheus, Grafana, Loki data)
clean:
	$(RUN) down -v

## ps: show container status
ps:
	$(RUN) ps

## logs: follow recent logs from all services
logs:
	$(RUN) logs -f --tail=100

## e2e: Playwright UI tests (needs API :4000; starts Vite from app/ unless PLAYWRIGHT_SKIP_WEBSERVER=1)
e2e:
	cd "$(ROOT)/app" && npm run test:e2e

help:
	@echo "Rehab Docker stack — run from anywhere: make -f path/to/rehab/Makefile <target>"
	@echo ""
	@echo "  make / make up     build (if needed) and start full stack"
	@echo "  make build         build images only"
	@echo "  make rebuild       docker compose build --no-cache && up -d"
	@echo "  make down          stop stack, keep data"
	@echo "  make clean         stop and remove volumes (destructive)"
	@echo "  make ps            docker compose ps"
	@echo "  make logs          tail -f logs from all services"
	@echo "  make e2e           Playwright E2E (see README, app/playwright.config.ts)"
	@echo ""
	@echo "URLs: http://localhost:8080 (UI), :4000 (API), :3000 (Grafana), :9090 (Prometheus)"

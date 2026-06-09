# ============================================================
# TheGameBit – Makefile
# Convenient shortcuts for Docker Compose workflows
# Usage:  make dev | make prod | make logs | make clean
# ============================================================

COMPOSE_DEV  = docker compose -f docker/docker-compose.yml
COMPOSE_PROD = docker compose -f docker/docker-compose.prod.yml

.PHONY: dev dev-build dev-down prod prod-build prod-down \
        logs logs-web logs-redis shell clean prune

# ── Development ───────────────────────────────────────────
dev:
	$(COMPOSE_DEV) --env-file docker/.env.development up

dev-build:
	$(COMPOSE_DEV) --env-file docker/.env.development up --build

dev-down:
	$(COMPOSE_DEV) down

# ── Production ────────────────────────────────────────────
prod:
	$(COMPOSE_PROD) --env-file docker/.env.production up -d

prod-build:
	$(COMPOSE_PROD) --env-file docker/.env.production up -d --build

prod-down:
	$(COMPOSE_PROD) down

# ── Logs ──────────────────────────────────────────────────
logs:
	$(COMPOSE_DEV) logs -f

logs-web:
	$(COMPOSE_DEV) logs -f web

logs-redis:
	$(COMPOSE_DEV) logs -f redis

# ── Utilities ─────────────────────────────────────────────
shell:
	$(COMPOSE_DEV) exec web sh

redis-cli:
	$(COMPOSE_DEV) exec redis redis-cli

health:
	curl -s http://localhost:3000/api/health | jq

# ── Cleanup ───────────────────────────────────────────────
clean:
	$(COMPOSE_DEV) down -v --remove-orphans
	$(COMPOSE_PROD) down -v --remove-orphans

prune:
	docker system prune -af --volumes

.PHONY: help dev dev-logs dev-down migrate seed test clean
.PHONY: prod-build prod-up prod-down prod-migrate prod-logs
.PHONY: backup restore smoke create-admin

# ──────────────────────────────────────────────────────────────────────────────
# SiteFlow Makefile
# ──────────────────────────────────────────────────────────────────────────────

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ──────────────────────────────────────────────────────────────────────────────
# Development
# ──────────────────────────────────────────────────────────────────────────────

install: ## Install dependencies
	pnpm install

dev: ## Start development environment
	docker-compose -f docker-compose.dev.yml up -d
	@echo "Waiting for services to be ready..."
	@sleep 3
	pnpm run dev

dev-services: ## Start only Docker services (DB, Redis, MinIO)
	docker-compose -f docker-compose.dev.yml up -d

dev-logs: ## View development logs
	docker-compose -f docker-compose.dev.yml logs -f

dev-down: ## Stop development environment
	docker-compose -f docker-compose.dev.yml down

dev-clean: ## Stop and remove volumes
	docker-compose -f docker-compose.dev.yml down -v

migrate: ## Run database migrations (dev)
	pnpm --filter api migrate

seed: ## Seed database with demo data
	pnpm --filter api seed

test: ## Run all tests
	pnpm run test

lint: ## Run ESLint
	pnpm run lint

format: ## Format code with Prettier
	pnpm run format

format-check: ## Check code formatting
	pnpm run format:check

typecheck: ## Run TypeScript type checking
	pnpm run typecheck

clean: ## Clean build artifacts
	pnpm run clean
	rm -rf node_modules
	find . -name 'node_modules' -type d -prune -exec rm -rf '{}' +

# ──────────────────────────────────────────────────────────────────────────────
# Production
# ──────────────────────────────────────────────────────────────────────────────

prod-build: ## Build production Docker images
	docker-compose -f docker-compose.prod.yml build

prod-up: prod-build ## Start production environment
	docker-compose -f docker-compose.prod.yml up -d
	@echo "Production environment started!"
	@echo "Access at: http://localhost (or your configured domain)"

prod-down: ## Stop production environment
	docker-compose -f docker-compose.prod.yml down

prod-logs: ## View production logs
	docker-compose -f docker-compose.prod.yml logs -f

prod-migrate: ## Run migrations in production
	docker-compose -f docker-compose.prod.yml exec api pnpm migrate

prod-restart: ## Restart production services
	docker-compose -f docker-compose.prod.yml restart

# ──────────────────────────────────────────────────────────────────────────────
# Database
# ──────────────────────────────────────────────────────────────────────────────

backup: ## Backup database and files
	@echo "Creating backup..."
	@mkdir -p db/backups
	@./infra/scripts/backup.sh

restore: ## Restore from backup
	@./infra/scripts/restore.sh

db-shell: ## Connect to PostgreSQL shell (dev)
	docker-compose -f docker-compose.dev.yml exec postgres psql -U siteflow -d siteflow

db-reset: ## Reset database (WARNING: destroys all data)
	@echo "WARNING: This will delete ALL data. Press Ctrl+C to cancel..."
	@sleep 5
	docker-compose -f docker-compose.dev.yml down -v
	docker-compose -f docker-compose.dev.yml up -d postgres
	@sleep 3
	make migrate
	make seed

# ──────────────────────────────────────────────────────────────────────────────
# Utilities
# ──────────────────────────────────────────────────────────────────────────────

smoke: ## Run smoke tests
	pnpm --filter api smoke

create-admin: ## Create initial instance admin
	pnpm --filter api create-admin

generate-keys: ## Generate security keys
	@echo "INSTANCE_MASTER_KEY=$$(openssl rand -hex 32)"
	@echo "BOOTSTRAP_ADMIN_TOKEN=$$(openssl rand -base64 32)"
	@echo "JWT_SECRET=$$(openssl rand -base64 32)"

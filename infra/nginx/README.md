# Nginx Configuration

Reverse proxy configuration for production deployment.

## Files

- `siteflow.conf` - Main Nginx config
  - Routes `/` to web frontend
  - Routes `/api` to API backend
  - SSL/TLS configuration
  - Security headers
  - Rate limiting

- `ssl/` - SSL certificates (production)

## Coming in Phase 11

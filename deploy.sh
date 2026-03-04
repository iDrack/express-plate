#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Load Docker image
echo "📦 Loading Docker image..."
docker load -i app-image.tar

# Stop existing containers
echo "⏹️  Stopping existing containers..."
docker compose down || true

# Clean up old resources
echo "🧹 Cleaning up old resources..."
docker system prune -f || true

# Start services
echo "🏃 Starting services..."
docker compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
timeout 300 bash -c '
while ! docker compose ps | grep -E "(healthy|Up)"; do
echo "Waiting for services to become ready..."
sleep 10
done'

# Verify deployment
echo "✅ Verifying deployment..."
docker compose ps

# Test health endpoint (adjust port if needed)
sleep 10
if command -v curl >/dev/null 2>&1; then
curl -f http://localhost:${APP_PORT:-8080}/health || echo "⚠️  Health check failed, but services may still be starting"
fi

echo "🎉 Deployment completed!"
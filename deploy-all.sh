git pull
docker system prune -a -f
docker compose -f docker-compose.production.yml -f docker-compose.override.yml build --no-cache
docker compose -f docker-compose.production.yml -f docker-compose.override.yml stop
docker compose -f docker-compose.production.yml -f docker-compose.override.yml up -d --no-deps
docker compose -f docker-compose.production.yml -f docker-compose.override.yml logs -f
git pull
docker system prune -a -f
docker compose -f docker-compose.production.yml -f docker-compose.override.yml build --no-cache server
docker compose -f docker-compose.production.yml -f docker-compose.override.yml stop server
docker compose -f docker-compose.production.yml -f docker-compose.override.yml up -d --no-deps server
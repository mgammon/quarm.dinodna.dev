## Requirements

- Docker
- Node >=18.15

## How to run for DEV (with hot reloading, no reverse proxy)
```
docker compose up
```

If you haven't run a DB dump / restore before, when API starts up, it'll write out a SQL file to `server/api/db-update.sql`.  Run that in your SQL client to get all your data.  It doesn't execute the SQL automatically because I run prod on a tiny server that can't handle running it all at once.

If you need to re-run it or update to a new DB dump:
 - Change the `QUARM_DATABASE_DUMP_URL` in docker-compose.yml
 - Hit the API endpoint: `GET localhost:3000/api/admin/update-database/{{API_KEY}}`. 
 - Run the newly generated `db-update.sql` file (`SET GLOBAL max_allowed_packet=1073741824;` in mysql if needed)
 - (if running auction logging) Hit the API endpoint: `GET localhost:3000/api/admin/update-auction-prices/{{API_KEY}}`

UI @ localhost:4200
API @ localhost:3000
MySQL @ localhost:3306

## How to run on server (no hot reloading, uses reverse proxy)
Configure ENV vars in a docker-compose.override.yml (mysql connection, apiKey, etc.) or .env
Set up proxy hosts on <ip address>:81
```
git pull
docker system prune -a
docker compose -f docker-compose.production.yml -f docker-compose.override.yml up
```
API @ localhost:3000
UI @ localhost:3000/public


## Server install
```
git pull
docker system prune -a
docker compose -f docker-compose.production.yml -f docker-compose.override.yml build --no-cache server
docker compose -f docker-compose.production.yml -f docker-compose.override.yml stop server
docker compose -f docker-compose.production.yml -f docker-compose.override.yml up -d --no-deps server
```
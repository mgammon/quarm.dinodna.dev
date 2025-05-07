## Requirements

- Docker
- Node >=18.15

## How to run for DEV (with hot reloading, no reverse proxy)
```
docker compose up
```

UI @ localhost:4200
API @ localhost:3000
MySQL @ localhost:3306
Quarm data will auto-update

## How to run on server (no hot reloading, uses reverse proxy)
- Configure ENV vars in a docker-compose.override.yml (mysql connection, apiKey, discord webhooks, etc; see docker-compose.override.EXAMPLE.yml) or .env
- Run `./deploy-all.sh`
- Set up proxy hosts using nginx-proxy-manager on <server ip address>:81.  Be sure to include websocket support.

API @ <server ip address>:3000
UI @ <server ip address>:3000/public
MySQL @ <server ip address>:3306
nginx-proxy-manager @ <server ip address>:81

## Log Reader
Use log-reader/log-reader.exe to read your mule's logs and send messages to the API.  Be sure to read log-reader/README.md.  Requires AutoHotKey if you want to automatically re-log in to your mule if the game freezes, server crashes, or you get disconnected

## Workflow for making changes
Configure the log-reader's config.json to send to both prod and localhost:3000.  Run the server with `docker-compose up`.  Test on localhost:4200 as you make changes.  Commit your changes, SSH to the server and run `./deploy-server.sh`.

## Stack:
- Everything is TypeScript
- UI is Angular
- API is NestJS + TypeORM
- DB is MySQL
- In prod, nginx-proxy-manager handles certs and proxies
- docker compose will run UI, API, MySQL, nginx-proxy-manager
- log-reader is a nodeJS app packaged as an .exe, which also launches an AutoHotKey script to auto log in
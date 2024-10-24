###################
# BUILD FOR LOCAL DEVELOPMENT
###################

FROM node:20.9-alpine As development

WORKDIR /server/api
COPY --chown=node:node ./api/package*.json ./
RUN npm ci
COPY --chown=node:node ./api .

WORKDIR /server/app
COPY --chown=node:node ./app/package*.json ./
RUN npm ci
COPY --chown=node:node ./app .

USER node

###################
# BUILD FOR PRODUCTION
###################

FROM node:20.9-alpine As build

ENV NODE_ENV production

WORKDIR /server/api
COPY --chown=node:node ./api/package*.json ./
COPY --chown=node:node --from=development /server/api/node_modules ./node_modules
COPY --chown=node:node ./api .
RUN npm run build
RUN npm ci --only=production && npm cache clean --force

WORKDIR /server/app
COPY --chown=node:node ./app/package*.json ./
COPY --chown=node:node --from=development /server/app/node_modules ./node_modules
COPY --chown=node:node ./app .
RUN npm run build
RUN npm ci --only=production && npm cache clean --force

USER node

###################
# RUN PRODUCTION
###################

FROM node:20.9-alpine As production

COPY --chown=node:node --from=build /server/api/node_modules ./dist/node_modules
COPY --chown=node:node --from=build /server/api/dist ./dist

COPY --chown=node:node --from=build /server/app/dist ./dist/public

CMD [ "node", "dist/main.js" ]
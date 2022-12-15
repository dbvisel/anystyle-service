FROM node:16.16.0-alpine3.16

ENV CONNECTION_TIMEOUT=60000

RUN apk update && apk add --no-cache gcompat ruby ruby-dev ranger vim bash coreutils unzip dumb-init git make gcc g++ \
	harfbuzz \
	ca-certificates

# this is to install Anystyle

RUN gem install thin
RUN gem install anystyle
RUN gem install anystyle-cli

RUN mkdir -p /home/node/Downloads

WORKDIR /home/node/anystyle

RUN chown -R node:node /home/node/anystyle

USER node

COPY --chown=node:node package.json ./package.json
COPY --chown=node:node yarn.lock ./yarn.lock

RUN yarn

COPY --chown=node:node . .

ENTRYPOINT ["dumb-init", "--"]

CMD ["sh", "./scripts/setupProdServer.sh"]


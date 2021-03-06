FROM node:10.18 as builder

LABEL description="Landingpage for 'what the street'"
LABEL project="lab-whatthestreet"
LABEL maintainer="florian.porada@free-now.com"

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM node:10.18

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/.next /usr/src/app/.next
COPY --from=builder /usr/src/app/node_modules /usr/src/app/node_modules
COPY --from=builder /usr/src/app/server /usr/src/app/server
COPY --from=builder /usr/src/app/static /usr/src/app/static
COPY --from=builder /usr/src/app/config.json /usr/src/app/
COPY --from=builder /usr/src/app/next.config.js /usr/src/app/
COPY --from=builder /usr/src/app/gifgallery.json /usr/src/app/
COPY --from=builder /usr/src/app/package.json /usr/src/app/

# Get documentDB cert
RUN wget https://s3.amazonaws.com/rds-downloads/rds-combined-ca-bundle.pem -P /usr/src/app

# We need to env var only at runtime with whatthestreet
ARG mapbox_token
ENV MAPBOX_ACCESS_TOKEN=$mapbox_token
ARG ga_id
ENV GA_ID=$ga_id
#example: /project/whatthestreet
ARG url_prefix=""
ENV URL_PREFIX=$url_prefix
#example: whatthestreet.moovellab.com
ARG root_url=""
ENV ROOT_URL=$root_url
#example: https://s3-eu-west-1.amazonaws.com/gif.whatthestreet.moovellab.com
ARG s3_gif_bucket="https://lab-whatthestreet-gifgallery.s3.amazonaws.com"
ENV S3_GIF_BUCKET=$s3_gif_bucket

EXPOSE 80

CMD ["npm", "start"]

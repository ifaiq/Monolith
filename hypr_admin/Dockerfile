FROM node:14.17.3-alpine

RUN apk --no-cache --update add make gcc g++ libgcc libstdc++ dumb-init python bash git && \
    rm -rf /var/cache/apk/* /tmp && \
    mkdir /tmp && \
    chmod 777 /tmp

RUN yarn global add typescript
RUN yarn global add nodemon
RUN yarn global add concurrently
RUN yarn global add node-gyp
RUN yarn global add @angular/cli@14.0.4

# Create app directory
WORKDIR /code
ADD ./ /code/

RUN chown -R node:node /code/

# Install app dependencies
USER node
RUN npm rebuild node-sass
RUN npm install

RUN ng build --target production --env=local --aot --build-optimizer --outputHashing=bundles && npm run postbuild
RUN echo "env is local"

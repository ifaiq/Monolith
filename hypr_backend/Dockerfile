FROM node:14

# run apk --no-cache add  \
#   bash g++ gcc libgcc libstdc++ linux-headers make python mysql-client git


# Install nodemon globally so we can run the node server in development mode on docker-compose up
RUN npm install -g nodemon db-migrate 
# Install concurrently globally so we can run tsc and nodemon on docker-compose up
# RUN yarn global add concurrently

# Create app directory
WORKDIR /sails
ADD ./ /sails/

RUN chown -R node:node /sails/

# Install app dependencies
USER node
ARG GL_NPM_TOKEN

# required for private package installation.
ENV GL_NPM_TOKEN=$GL_NPM_TOKEN
RUN npm config set @development-team20:registry=https://gitlab.com/api/v4/packages/npm/
RUN npm config set '//gitlab.com/api/v4/packages/npm/:_authToken=${GL_NPM_TOKEN}'

RUN npm ci

#!/usr/bin/env bash
# runDocker.sh

docker-compose down

GL_NPM_TOKEN=${GL_NPM_TOKEN} docker-compose up --exit-code-from hypr_backend

docker-compose down

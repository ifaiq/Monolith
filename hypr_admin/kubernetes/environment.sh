#!/bin/bash
# ENV=dev
echo "ENV:"${ENV}

sed -i 's/local/'"$ENV"'/g' ./hypr_admin/Dockerfile

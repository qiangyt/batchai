#!/bin/bash

version=20241126A
demo_repo_d=/data/batchai/batchai/demo
tag_suffix=${version} #$(date +"%Y%m%d-%H%M%S")
registry=registry.cn-shanghai.aliyuncs.com/wxcount

# build server
server_tag=${registry}/batchai-demo-server:${tag_suffix}
docker build -t ${server_tag} ${demo_repo_d}/server

# build web
web_tag=${registry}/batchai-demo-web:${tag_suffix}
docker build -t ${web_tag} ${demo_repo_d}/web


echo docker push ${server_tag}
echo docker push ${web_tag}
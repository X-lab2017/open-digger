docker image rm open-digger-clickhouse-base:v2
docker buildx build --push --platform linux/amd64,linux/arm64 --tag open-digger-docker-registry.cn-beijing.cr.aliyuncs.com/open-digger/open-digger-clickhouse-base:v2 .

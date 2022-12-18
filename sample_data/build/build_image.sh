docker image rm open-digger-clickhouse-base:v2
docker buildx build --push --platform linux/amd64,linux/arm64 --tag xlab-registry.cn-shanghai.cr.aliyuncs.com/opendigger/open-digger-clickhouse-base:v2 .

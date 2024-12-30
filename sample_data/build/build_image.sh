docker image rm open-digger-clickhouse-base:v2
docker buildx build --push --platform linux/amd64,linux/arm64 --tag registry.cn-beijing.aliyuncs.com/open-digger/open-digger-clickhouse-base:v2 .

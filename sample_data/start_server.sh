docker run -d --name 2020_full_ch_server -p 8123:8123 -p 9000:9000 --ulimit nofile=262144:262144 --volume=./data/2020_full/:/data/ open-digger-clickhouse-base:v1

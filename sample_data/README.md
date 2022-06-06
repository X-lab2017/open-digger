# ClickHouse sample data

We can use ClickHouse online service with full data access to make ClikcHouse sample dataset and use OpenDigger to explore the data.

## Usage

### Use sample data

To use sample data from OSS service, you need to follow the steps:

- Download data from OSS.
- Extract data from archive file. `tar -zxvf data.tar.gz`
- Use ClickHouse base image with extracted data to initialize the database. The extracted `data` and `table` file should be mounted into `/data/` folder into the container. Refer `start_server.sh` to start the container. The data is ready until message `Insert data done.` logged into container console, stop and restart the same container instance will not import data again.

To use the sample data, at minimum 3 GB memory should be allocated to the container instance.

### Current sample datasets

| Data | Description | SQL | Record counts | Compressed size | Uncompressed size | Imported size(est.) | Import time(est.) |
|:---|:---|:---|:---|:---|:---|:---|:---|
| [2020_full](https://oss.x-lab.info/sample_data/2020_full.tar.gz) | All records from year 2020 | sql_files/2020_full.sql | 855 million | 802 GB | 81 GB | 142 GB | 7 h |
| [2015_2021_top_50_year](https://oss.x-lab.info/sample_data/2015_2021_top50_year.tar.gz) | Top 50 most active repos from year 2015 to 2021 for every year | sql_files/2015_2021_top50_year.sql | 125 million | 88 GB | 6.6 GB | 21 GB | 1 h |

### ClickHouse server image

- x86: `docker pull docker-hub.x-lab.info/opendigger/open-digger-clickhouse-base:v1`
- ARM: `docker pull docker-hub.x-lab.info/opendigger/open-digger-clickhouse-base-arm:v1`

### Use Notebook image

## Create sample data

### Export sample data

The file `export_sample.sh` is used to export sample data from remote ClickHouse server.

You can pass in two parameters, the first one is a file with SQL to export the data you need, the second one is a tag name used as a path param to upload to OSS.

Environment variables need to be set before the shell script run.

Run `CH_SERVER=localhost CH_PORT=8123 CH_USER=amdin CH_PASSWORD=amdin ./export_sample.sh ./sql_files/2020_full.sql 2020_full` to export data from local ClickHouse server, the sample data will save into `data` folder and the data files(data.tar.gz which contains data and table schema) will upload to OSS.

System prerequisite: `clickhouse` CLI tool and `ossutil` CLI tool.

### Make base image

The files under `build` is used to make base images to load the data made by `export_sample.sh`.

`Dockerfile` and `Dockerfile_arm` are used to build the images from ClickHouse official base image.

`initdb.sh` script is used to initialize database from static dataset.

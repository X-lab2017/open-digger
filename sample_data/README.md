# ClickHouse sample data

We can use ClickHouse online service with full data access to make ClikcHouse sample dataset and use OpenDigger to explore the data.

## Usage

### Use sample data

To use sample data from OSS service, you need to follow the steps:

- Download data from OSS.
- Extract data from archive file. `tar -zxvf data.tar.gz`
- Use ClickHouse base image with extracted data to initialize the database. The extracted `data` and `table` file should be mounted into `/data/` folder into the container. Refer `start_server.sh` to start the container. The data is ready until message `Insert data done.` logged into container console, stop and restart the same container instance will not import data again.

To use the sample data, at minimum 8 GB memory should be allocated to the container instance.

### Current sample datasets

| Data | Description | SQL | Record counts | Uncompressed size | Compressed size | Imported size(est.) | Import time(est.) |
|:---|:---|:---|:---|:---|:---|:---|:---|
| [2020_full](https://oss.x-lab.info/sample_data/2020_full.tar.gz) | All records from year 2020 | sql_files/2020_full.sql | 855 million | 802 GB | 81 GB | 121 GB | 7 h |
| [2015_2021_top_50_year](https://oss.x-lab.info/sample_data/2015_2021_top50_year.tar.gz) | Top 50 most active repos from year 2015 to 2021 for every year | sql_files/2015_2021_top50_year.sql | 168 million | 117 GB | 8.4 GB | 13 GB | 50 m |
| [second_sample](https://oss.x-lab.info/sample_data/second_sample.tar.gz) | All events log sample by 1 second in a hour | sql_files/second_sample.sql | 62 million | 57 GB | 10 GB | 14 GB | 25 m |
| [label_2015](https://oss.x-lab.info/sample_data/label_2015.tar.gz) | All events log for labeled repo in OpenDigger in 2015 | sql_files/label_2015.sql | 3.5 million | 2.9 GB | 378 MB | 552 MB | 3 m |

### ClickHouse server image

- x86: `docker pull docker-hub.x-lab.info/opendigger/open-digger-clickhouse-base:v1`
- ARM: `docker pull docker-hub.x-lab.info/opendigger/open-digger-clickhouse-base-arm:v1`

### Use Notebook image

1. Start the Clickhouse server container.

2. Go to the src folder in the open-digger root directory, create a file named 'local_config.ts' with the following contents:

   ```typescript
   export default {
       db: {
           clickhouse: {
                host: '172.17.0.1'
           }
       }
   }
   ```

3. Use `npm run notebook` to use Notebook image if you use Linux/MacOS system, or to use `npm run notebook:win ` if you use Windows system.

4. Open the link in console log like `http://127.0.0.1:8888/lab?token=xxxxx`.

5. If the source code under `src` folder changed, you need to use `npm run build` and restart the notebook kernel to reload the sorce code.

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

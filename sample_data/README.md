# ClickHouse sample data

We can use ClickHouse online service with full data access to make ClikcHouse sample dataset and use OpenDigger to explore the data.

## Usage

### ClickHouse server image

- x86-64/amd64: `docker pull --platform linux/amd64 docker-hub.open-digger.cn/open-digger/open-digger-clickhouse-base:v2`
- ARM64: `docker pull --platform linux/arm64 docker-hub.open-digger.cn/open-digger/open-digger-clickhouse-base:v2`

### Use sample data

To use sample data from OSS service, you need to follow the steps:

1. Download data from OSS. We provide several sample datasets in the table below.

2. Extract data from archive file to a folder: `tar -zxvf data.tar.gz -C ./folder_name`. You will get a `table` and a `data` file.

3. Use ClickHouse base image with extracted data to initialize the database. The extracted `data` and `table` file should be mounted into `/data/` folder into the container, here is an example:

- Linux/MacOS: `docker run -d --name container_name -m 8G -p 8123:8123 -p 9000:9000 --ulimit nofile=262144:262144 --volume=$(pwd)/folder_name/:/data/ docker-hub.open-digger.cn/open-digger/open-digger-clickhouse-base:v2`;
- Windows: `docker run -d --name container_name -m 8G -p 8123:8123 -p 9000:9000 --ulimit nofile=262144:262144 --volume=%cd%/folder_name/:/data/ docker-hub.open-digger.cn/open-digger/open-digger-clickhouse-base:v2`.
   
In the above command lines, `$(pwd)` or `%cd%` makes sure the `host-src` be an absolute path.
> **Notice**: As referred in [Docker's Doc](https://docs.docker.com/engine/reference/run/#volume-shared-filesystems), the `host-src` in `--volume=[host-src:]container-dest[:<options>]` must be an absolute path or a name value.
>
> - If you supply an absolute path for the `host-src`, Docker bind-mounts to the path you specify. 
>
> - If you supply a name, Docker creates a named volume by that name.
>
> **A name value must start with an alphanumeric character, followed by `a-z0-9`, `_` (underscore), `.` (period) or `-` (hyphen). An absolute path starts with a `/` (forward slash).**

4. The data is ready until message `Insert data done.` logged into container console. Now the Clickhouse container is running. Stop and restart the same container instance will not import data again.

To use the sample data, at minimum 8 GB memory should be allocated to the container instance.

### Current sample datasets

| Data | Description | SQL | Record counts | Uncompressed size | Compressed size | Imported size(est.) | Import time(est.) |
|:---|:---|:---|:---|:---|:---|:---|:---|
| [2020_full](https://oss.open-digger.cn/sample_data/2020_full.tar.gz) | All records from year 2020 | sql_files/2020_full.sql | 855 million | 802 GB | 81 GB | 121 GB | 7 h |
| [2015_2021_top_50_year](https://oss.open-digger.cn/sample_data/2015_2021_top50_year.tar.gz) | Top 50 most active repos from year 2015 to 2021 for every year | sql_files/2015_2021_top50_year.sql | 168 million | 117 GB | 8.4 GB | 13 GB | 50 m |
| [second_sample](https://oss.open-digger.cn/sample_data/second_sample.tar.gz) | All events log sample by 1 second in a hour | sql_files/second_sample.sql | 62 million | 57 GB | 10 GB | 14 GB | 25 m |
| [label_2015](https://oss.open-digger.cn/sample_data/label_2015.tar.gz) | All events log for labeled repo in OpenDigger in 2015 | sql_files/label_2015.sql | 3.5 million | 2.9 GB | 378 MB | 552 MB | 3 m |
| [paddle_hackathon_3](https://oss.open-digger.cn/sample_data/paddle_hackathon_3.tar.gz) | Data under PaddlePaddle org for Hackathon | sql_files/paddle_hackathon_3.sql | 1.38 million | 1.4 GB | 184 MB | 222 MB | 1 m |

### Use Notebook image

#### Node.js Version

Start your ClickHouse container, which should be set up in the last step. Now:

1. Clone OpenDigger `git clone https://github.com/X-lab2017/open-digger.git`

2. Enter the repo path `cd open-digger`

3. Install the necessary packages `npm install`

4. Go to the src folder in the open-digger root directory, create a file named 'local_config.ts' with the following contents:

   ```typescript
   export default {
       db: {
           clickhouse: {
                host: '172.17.0.1'
           }
       }
   }
   ```

5. Use `npm run notebook` to use Notebook image if you use Linux/MacOS system, or to use `npm run notebook:win` if you use Windows system.

6. Open the link in console log like `http://127.0.0.1:8888/lab?token=xxxxx`.

7. If the source code under `src` folder changed, you need to use `npm run build` and restart the notebook kernel to reload the sorce code.

8. You can find the notebook folder, where we provide demos in the handbook. You can create a new file, and happy data exploring!

#### Python Version

Start your ClickHouse container, which should be set up in the last step. Now:

1. Clone OpenDigger `git clone https://github.com/X-lab2017/open-digger.git`

2. Enter the repo path `cd open-digger`

3. Go to the `src` folder in the open-digger root directory, create a file named 'local_config.py' for Python Kernel with the following contents:

   ```python
   local_config = {
     'db': {
       'clickhouse': {
         'host':'172.17.0.1', 
         'user':'default'
       },
       'neo4j':{
         'port': '7687',
       }
     }
   }
   ```
   the `host` above is the host of the ClickHouse server. We can find it using `docker inspect containert_name`, and copy the `Gateway` like this:

   ```shell
   $ docker inspect container_name | grep Gateway
              "Gateway": "172.17.0.1",
              "IPv6Gateway": "",
              "Gateway": "172.17.0.1",
              "IPv6Gateway": "",
   ```

4. Use `docker build -t opendigger-jupyter-python:1.0 $(pwd)` to make a docker image, this image is based on `miniconda`. You can check the `Dockerfile` in root directory.

   > If you are using **Windows CMD**, all the `$(pwd)` here should be replaced by `%cd%`. And if you are using **Windows Powershell**,  all the `$(pwd)` here should be replaced by `${pwd}`.
   >
   > **Notice:** Pathnames of directories like "pwd" may use `\` to join the directory in some versions of Windows. We recommend using absolute paths.

5. Then we can use `docker run -it --name python_notebook_name --rm -p 8888:8888 -v $(pwd):/python_kernel/notebook opendigger-jupyter-python:1.0` to create and run the container.

6. Open the link in console log like `http://127.0.0.1:8888/lab?token=xxxxx`.

7. If the source code under `src` folder changed, you need to stop the notebook docker using `docker stop python_notebook_name` and restart the notebook kernel using `docker run -it --name python_notebook_name --rm -p 8888:8888 -v $(pwd):/python_kernel/notebook opendigger-jupyter-python:1.0` to reload the sorce code.

8. You can find the notebook folder, where we provide demos in the handbook. You can create a new file, and happy data exploring!

## Create sample data

### Export sample data

The file `export_sample.sh` is used to export sample data from remote ClickHouse server.

You can pass in two parameters, the first one is a file with SQL to export the data you need, the second one is a tag name used as a path param to upload to OSS.

Environment variables need to be set before the shell script run.

Run `CH_SERVER=localhost CH_PORT=8123 CH_USER=amdin CH_PASSWORD=amdin ./export_sample.sh ./sql_files/2020_full.sql 2020_full` to export data from local ClickHouse server, the sample data will save into `data` folder and the data files(data.tar.gz which contains data and table schema) will upload to OSS.

System prerequisite: `clickhouse` CLI tool and `ossutil` CLI tool.

### Make base image

The files under `build` is used to make base images to load the data made by `export_sample.sh`.

`Dockerfile` is used to build the images from ClickHouse official base image for `amd64` and `arm64` platform. Please make sure that `buildx` and `buildkit` is properly setup in your environment.

`initdb.sh` script is used to initialize database from static dataset.

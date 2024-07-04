# Getting Start

## If you want to do some data analysis work:
Start your ClickHouse container, which should be set up in [Clickhouse-sample-data](../sample_data/README.md)

1. Clone OpenDigger `git clone https://github.com/X-lab2017/open-digger.git`

2. Enter the repo path `cd open-digger`

    Install the necessary packages `npm install`.

3. Go to the `src` folder(pycjs does not implement any bottom layer details) in the open-digger root directory, create a file named 'local_config.py'(this file has already added into `.gitignore` file.) for Python Kernel with the following contents:

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
   the `host` above is the host of the ClickHouse server. We can find it using `docker inspect container_name`(the container_name is set by command docker run --name xxx), and copy the `Gateway` like this:

   ```shell
   $ docker inspect container_name | grep Gateway
               "Gateway": "172.17.0.1",
               "IPv6Gateway": "",
                       "Gateway": "172.17.0.1",
                       "IPv6Gateway": "",
   ```
    If you use your own data, you can also change `host` field to your own host IP

   Return the repo path `cd open-digger`. 

   Build ts `npm run build`. Since the npm run build command is important to active every settings change, the kernel pycjs supports `npm run notebook-pycjs`  to execute the *npm run build, docker build and docker run* command automatically, instead of manually executing them step by step as below.

4. Use `docker build --build-arg KER_REL_PATH='./pycjs' --build-arg BASE_IMAGE='registry.cn-beijing.aliyuncs.com/open-digger/open-digger-js-notebook:1.0' -t opendigger-jupyter-python:1.0 $(pwd)` to make a docker image, this image is based on `miniconda`. You can check the `Dockerfile` in root directory.

   > If you are using **Windows CMD**, all the `$(pwd)` here should be replaced by `%cd%`. And if you are using **Windows Powershell**,  all the `$(pwd)` here should be replaced by `${pwd}`.
   >
   > **Notice:** Pathnames of directories like "pwd" may use `\` to join the directory in some versions of Windows. We recommend using absolute paths.

5. Then we can use `docker run -i -t --name python_notebook_name --rm -p 8888:8888 -v "$(pwd):/python_kernel/notebook" opendigger-jupyter-python:1.0` to create and run the container.

6. Open the link in console log like `http://127.0.0.1:8888/lab?token=xxxxx`.

7. If the source code under `python` folder changed, you need to stop the notebook docker using `docker stop python_notebook_name` and restart the notebook kernel using `docker run -i -t --name python_notebook_name --rm -p 8888:8888 -v "$(pwd):/python_kernel/notebook" opendigger-jupyter-python:1.0` to reload the sorce code.

8. You can find the notebook folder, where we provide demos in the handbook. You can create a new file, and happy data exploring!
    Attention: you need to do this work in `notebook` or other parallel folder. If you run in root directory, it can't work because of python import rules.

## If you are a developer:

You can also make `workspace.py` in `python` folder. and run it.

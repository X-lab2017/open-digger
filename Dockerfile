FROM continuumio/miniconda3

LABEL maintainer="Yike Cheng<cyk_cd@163.com>"

RUN mkdir python_kernel \
&& mkdir python_kernel/notebook \
&& pip install -i https://pypi.tuna.tsinghua.edu.cn/simple/ easydict==1.9 \
&& pip install -i https://pypi.tuna.tsinghua.edu.cn/simple/ py2neo==2021.2.3 \
&& pip install -i https://pypi.tuna.tsinghua.edu.cn/simple/ plotly==5.9.0 \
&& pip install -i https://pypi.tuna.tsinghua.edu.cn/simple/ clickhouse-driver==0.2.3 \
&& pip install -i https://pypi.tuna.tsinghua.edu.cn/simple/ numpy==1.23.2 \
&& pip install -i https://pypi.tuna.tsinghua.edu.cn/simple/ jupyterlab==3.4.5 \
&& pip install -i https://pypi.tuna.tsinghua.edu.cn/simple/ matplotlib==3.5.3 \
&& pip install -i https://pypi.tuna.tsinghua.edu.cn/simple/ pandas==1.4.3 \
&& pip install -i https://pypi.tuna.tsinghua.edu.cn/simple/ pyyaml==6.0 

WORKDIR /python_kernel/notebook

EXPOSE 8888

CMD jupyter lab --notebook-dir=/python_kernel/notebook --ip='*' --port=8888 --allow-root --no-browser

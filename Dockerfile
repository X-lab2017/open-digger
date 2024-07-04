ARG BASE_IMAGE

FROM ${BASE_IMAGE}
# FROM registry.cn-beijing.aliyuncs.com/open-digger/open-digger-js-notebook:1.0
# FROM continuumio/miniconda3  # LABEL maintainer="Yike Cheng<cyk_cd@163.com>"

USER root

RUN mkdir -p /python_kernel/notebook

WORKDIR /python_kernel/notebook

ARG KER_REL_PATH  # Kernel Relative Path e.g. './pycjs'

COPY ${KER_REL_PATH}/requirements.txt ${KER_REL_PATH}/requirements.txt

RUN pip install -r ${KER_REL_PATH}/requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple/ 

EXPOSE 8888

CMD jupyter lab --notebook-dir=${WORKDIR} --ip='*' --port=8888 --allow-root --no-browser

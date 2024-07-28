import sys
import os
import subprocess
import argparse
from datetime import datetime

parser = argparse.ArgumentParser()
parser.add_argument('--requirements_file', '-r', help='requirements.txt的文件路径', dest='requirements_file')
parser.add_argument('--url_list', '-u', help='用户提供的镜像源，以|分隔', dest='url_list')
args = parser.parse_args()

# 记录安装日志，创建输出文件的完整路径
output_log_file_path = os.path.join('/root', 'mirrors_managers.log')

# 如果用户提供了-u参数
if args.url_list:
    user_urls = str(args.url_list).split('|')
else:
    user_urls = []

# 内置一些常用的国内源
mirror_urls = [
    'https://pypi.tuna.tsinghua.edu.cn/simple/',
    'https://mirrors.aliyun.com/pypi/simple/',
    'http://mirrors.cloud.tencent.com/pypi/simple',
    'http://pypi.douban.com/simple'
]

if user_urls:
    mirror_urls = user_urls + mirror_urls

# 去重
unique_urls_list = []
for url in mirror_urls:
    if url not in unique_urls_list:
        unique_urls_list.append(url)
mirror_urls = unique_urls_list


def detect_install_completeness(requirements_file, mirror_url):
    """
    判断某个源是否能完成requirements文件的安装
    """

    # 删除已经安装的包
    # 列出所有已安装的包
    process1 = subprocess.Popen([sys.executable, "-m", 'pip','freeze'], stdout=subprocess.PIPE)

    # 使用xargs卸载所有列出的包
    process2 = subprocess.Popen(['xargs', sys.executable, "-m", 'pip', 'uninstall', '-y'], stdin=process1.stdout)

    # 等待两个进程完成
    process1.stdout.close()
    process2.communicate()

    # 解析url的域名
    hostname = mirror_url.split('//')[1].split('/')[0]

    # 使用pip安装包，并捕获输出
    process = subprocess.Popen(
        [sys.executable, "-m", 'pip', 'install', '-r', requirements_file, '-i', mirror_url, '--trusted-host', hostname],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

    # 获取输出和错误信息
    stdout, stderr = process.communicate()

    # 打印日志
    with open(output_log_file_path, 'a', encoding='utf-8') as file:
        file.write(f'[MIRROR_MANAGER INFO][{datetime.now().strftime(r"%Y-%m-%d %H:%M:%S")}][URL->{mirror_url}]:\n')
        file.write(stdout)
        if stderr:
            file.write(f'[MIRROR_MANAGER ERROR][{datetime.now().strftime(r"%Y-%m-%d %H:%M:%S")}][URL->{mirror_url}]:\n')
            file.write(stderr)
    
    # 输出日志到标准输出流
    print(f'[MIRROR_MANAGER INFO][{datetime.now().strftime(r"%Y-%m-%d %H:%M:%S")}][URL->{mirror_url}]:\n')
    print(stdout)
    if stderr and 'ERROR' in stderr:
        print(f'[MIRROR_MANAGER ERROR][{datetime.now().strftime(r"%Y-%m-%d %H:%M:%S")}][URL->{mirror_url}]:\n')
        print(stderr)
    
    # 判断是否安装成功
    if stderr and 'ERROR' in stderr:
        # 如果有报错信息，则认为是安装包失败
        return False
    else:
        return True


def install_dependencies(requirements_file):
    """
    定义安装依赖项，若安装失败则自动切换源
    """

    install_successfuly = False
    for url in mirror_urls:
        install_successfuly = detect_install_completeness(requirements_file, url)
        if install_successfuly:
            with open(output_log_file_path, 'a', encoding='utf-8') as file:
                file.write(f'[MIRROR_MANAGER Installed Successfuly][{datetime.now().strftime(r"%Y-%m-%d %H:%M:%S")}][URL->{url}]:\n')
            print(f'[MIRROR_MANAGER Installed Successfuly][{datetime.now().strftime(r"%Y-%m-%d %H:%M:%S")}][URL->{url}]:\n')
            break
    
    # 如果所有的镜像源都安装失败，则使用默认的国外源
    if not install_successfuly:
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", requirements_file])
            with open(output_log_file_path, 'a', encoding='utf-8') as file:
                file.write(f'[MIRROR_MANAGER Installed Successfuly][{datetime.now().strftime(r"%Y-%m-%d %H:%M:%S")}][URL->default-url]:\n')
            print(f'[MIRROR_MANAGER Installed Successfuly][{datetime.now().strftime(r"%Y-%m-%d %H:%M:%S")}][URL->default-url]:\n')
        except subprocess.CalledProcessError as e:
            with open(output_log_file_path, 'a', encoding='utf-8') as file:
                file.write(f'[MIRROR_MANAGER ERROR][{datetime.now().strftime(r"%Y-%m-%d %H:%M:%S")}]: Installation is failure, because all urls cant install the requirements.txt.{e}\n')
                print(f'[MIRROR_MANAGER ERROR][{datetime.now().strftime(r"%Y-%m-%d %H:%M:%S")}]: Installation is failure, because all urls cant install the requirements.txt.{e}\n')
                # 如果默认镜像也安装失败，则整个安装失败，可能需要检查网络，或者再添加一些国内源地址
                sys.exit(1)


# 入口函数
install_dependencies(str(args.requirements_file))

# final_opendigger

## 1.获取数据

使用的是paddle数据集，根据open_digger的教程加载了数据，并且配置好环境之后，在**data/get_data.ipynb**文件中进行使用，通过clickhouse连接数据库并且将所需要的数据保存在csv文件中，选取了在paddle数据集中数量最多的10个仓库进行分析并且以dashboard的形式展现。

## 2.dashboard实现

**index.html**是dashboard的前端页面，**scripts.js**是实现方法，图表显示使用的是**echarts**的结构，并且还实现了点击图表之后能在中间最大部分展示的功能。展示了7个图表，分别是**仓库贡献者的比例、每年各个仓库贡献者的数量、record的数量、star的数量、fork的数量、star+fork的数量和活跃用户的数量。**

最终的dashboard页面可以访问[最后实现的dashboard页面](http://113.31.125.113)

[代码仓库](https://github.com/pry666/final_opendigger)
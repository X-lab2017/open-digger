# 定义技术领域及其对应的英文关键词，增加关键词数量
import pandas as pd
import re

# 重新加载原始数据（避免之前的中间处理影响）
df = pd.read_csv('output_with_domain_v2.csv')
domains = {
    '人工智能': {
        'positive': [
            'AI', 'ML', 'machine learning', 'machine-learning', 'DL', 'deep-learning', 'deep learning',
            'neural network',
            'computer vision', 'CV', 'NLP', 'natural language processing', 'large language model',
            'artificial intelligence', 'LLVM',
            'transformer', 'BERT', 'GPT', 'reinforcement learning',
            'speech recognition', 'image recognition', 'pattern recognition',
            'cognitive computing', 'robotics', 'autonomous vehicles',
            'expert systems', 'intelligent systems', 'chatbot', 'stable diffusion', 'llm', 'transformer', 'inference',
            'fine-tuning', 'peft', 'multimodal', 'gpt', 'bert',
            'qwen', 'llama', 'internlm', 'grpo', 'sft', 'lora', 'embedding', 'deepseek', 'cpt',
            'aaai', 'GAN', 'generative adversarial network', 'vision transformer', 'self-supervised learning',
            'graph neural network', 'GNN', 'semantic segmentation', 'object detection',
            'machine translation', 'text-to-speech', 'speech-to-text', 'prompt engineering',
            'foundation model', 'AI agent', 'multi-agent system', 'multi-agent', 'multi agent', 'autonomous system',
            'RLHF'
        ],
        'negative': []
    },
    '云基础设施': {
        'positive': [
            'cloudnative', 'container', 'docker', 'kubernetes', 'k8s',
            'terraform', 'cloud storage', 'PaaS', 'IaaS', 'SaaS',
            'hybrid cloud', 'public cloud', 'private cloud',
            'microservices', 'service mesh', 'cloud-native storage',
            'container orchestration', 'server orchestration'
        ],
        'negative': []
    },
    '大数据与数据工程': {
        'positive': [
            'big data', 'data engineering', 'data processing', 'data analysis', 'data mining',
            'ETL', 'data warehousing', 'data lake', 'data pipeline', 'data governance',
            'data analytics', 'business intelligence', 'Spark', 'Hadoop', 'Flink',
            'Kafka', 'Hive', 'dashboards', 'predictive analytics', 'data visualization', 'data ingestion',
            'stream processing', 'batch processing', 'data cleaning', 'data wrangling',
            'OLAP', 'OLTP', 'presto', 'airflow', 'dbt', 'data catalog', 'data lineage', 'data quality'
        ],
        'negative': []
    },
    '数据库': {
        'positive': [
            'database', 'DB', 'relational', 'non-relational', 'key-value store',
            'document database', 'graph database', 'columnar database', 'in-memory database',
            'distributed database',
            'TimescaleDB', 'DB replication'
        ],
        'negative': ['tool', 'platform', 'druid']
    },
    '操作系统': {
        'positive': [
            'operating system', 'OS', 'Unix', 'real-time OS', 'RTOS', 'embedded OS', 'mobile OS', 'kernel',
            'system software',
            'kernel module', 'device driver', 'system call', 'file system', 'process scheduling',
            'memory management', 'multithreading', 'concurrency', 'virtual memory', 'docker OS'
        ],
        'negative': []
    },
    '编程语言与开发': {
        'positive': [
            'programming language', 'compiler', 'interpreter', 'JVM', 'CLR',
            'parser', 'AST', 'type system', 'object-oriented', 'functional programming',
            'IDE', 'development environment', 'debugging', 'unit testing', 'static analysis',
            'version control', 'Git', 'Mercurial', 'CI/CD', 'continuous integration', 'continuous delivery',
            'software architecture', 'design pattern', 'API development', 'build tool', 'package manager',
            'dependency management', 'DevOps', 'editor'
        ],
        'negative': []
    },
    '前端': {
        'positive': [
            'CSS', 'React', 'Vue', 'JS', 'HTML', 'Javascript',
            'Angular', 'Bootstrap', 'Tailwind', 'jQuery',
            'Next.js', 'Nuxt.js', 'React Native', 'Flutter', 'TailwindCSS',
            'Ant Design',
            'WebGL', 'Three.js', 'D3.js'
        ],
        'negative': ['npm', 'node', 'nodejs', 'website', 'ts', 'typescript', 'engine', 'server', 'documentation']
    },
    '区块链与 Web3': {
        'positive': [
            'blockchain', 'Web3', 'crypto', 'cryptocurrency', 'Bitcoin', 'Ethereum', 'Solana',
            'Polkadot', 'smart contract', 'Solidity', 'DeFi', 'NFT', 'non-fungible token',
            'distributed ledger', 'consensus', 'crypto wallet', 'digital asset', 'Web3 development', 'Layer1', 'Layer2',
            'Solidity smart contract', 'smart contract auditing', 'DeFi protocol',
            'tokenomics', 'staking', 'DAO', 'governance token', 'crypto exchange', 'crypto bridge',
            'wallet integration', 'Metamask', 'truffle', 'hardhat'
        ],
        'negative': []
    },
    '物联网与边缘计算': {
        'positive': [
            'IoT', 'internet of things', 'edge computing', 'sensor', 'actuator', 'smart devices',
            'connected devices', 'home automation', 'industrial IoT', 'IIoT', 'wireless sensor network',
            'MQTT', 'ZigBee', 'Z-Wave', 'LoRaWAN', 'NB-IoT', 'fog computing', 'edge device', 'IoT platform',
            'IoT gateway',
            'IoT protocol', 'sensor network', 'actuator network',
            'wearable device', 'industrial automation', 'smart city', 'smart factory', 'predictive maintenance',
            'IoT security', 'edge AI', 'fog node', 'real-time analytics'
        ],
        'negative': []
    },
    'RISC-V 与硬件': {
        'positive': [
            'RISC-V', 'hardware', 'chip', 'processor', 'microcontroller', 'FPGA', 'ASIC',
            'integrated circuit', 'IC', 'semiconductor', 'hardware design', 'SoC',
            'system on chip', 'PCB', 'computer architecture', 'embedded system', 'CPU architecture', 'GPU', 'DSP',
            'SoC verification', 'hardware acceleration', 'ASIC design',
            'FPGA programming', 'hardware simulation', 'Vivado', 'Quartus', 'chip fabrication', 'EDA tools'

        ],
        'negative': []
    },
    '应用与解决方案': {
        'positive': [
            'application', 'solution', 'software tool', 'mobile app', 'desktop application',
            'web application', 'enterprise solution', 'security solution',
            'cloud application', 'business application', 'healthcare app', 'educational app',
            'frontend-app', 'wordpress', 'wordpress-plugin',
            'gutenberg', 'raycast', 'zen-browser', 'firefox', 'ERP solution',
            'project management software',
            'productivity app', 'office suite', 'plugin development', 'extension development'

        ],
        'negative': []
    },
    '工业软件': {
        'positive': [
            'industrial software', 'CAD', 'CAM', 'CAE', 'PLM', 'ERP', 'MES', 'SCADA',
            'product lifecycle management', 'enterprise resource planning',
            'manufacturing execution system', 'supervisory control', 'computer-aided design',
            'computer-aided manufacturing', 'computer-aided engineering', 'industrial automation', 'robot programming',
            'PLC', 'SCADA system', 'industrial IoT software',
            'digital twin', 'simulation software', 'factory management software', 'process optimization',
            'industrial analytics', 'MES software', 'industrial control system', 'CAD/CAM software suite'

        ],
        'negative': []
    }
}


# 定义一个函数来判断项目所属的技术领域
def get_domains(row):
    if pd.isnull(row['description']) and pd.isnull(row['topics']):
        return '其他'

    words = set()

    if pd.notnull(row['description']):
        # 只去掉 . 和 ,
        clean_text = row['description'].replace('.', '').replace(',', '')
        words.update(word.lower() for word in clean_text.split())

    # topics 按逗号分词
    if pd.notnull(row['topics']):
        words.update(t.strip().lower() for t in row['topics'].split(','))

    # 最终 words 是去重后的集合
    project_domains = []
    for domain, keywords in domains.items():
        positives = keywords.get('positive', [])
        negatives = keywords.get('negative', [])
        # 先检查负向关键词
        for nk in negatives:
            if nk.lower() in words:
                # 命中负向关键词 → 直接跳过该领域
                break
        else:
            for k in positives:
                # 正则边界匹配 or 精确词匹配
                if k.lower() in words:
                    project_domains.append(domain)
                    break  # 命中一个关键词就够了，避免重复计入

    if not project_domains:
        return '其他'
    return ','.join(project_domains)


# 为每个项目标注所属的技术领域
df['domain'] = df.apply(get_domains, axis=1)

# 将结果保存为新的 CSV 文件
csv_path = 'output.csv'
df.to_csv(csv_path, index=False)

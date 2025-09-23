from openai import OpenAI
import json

client = OpenAI(
    base_url='https://xiaoai.plus/v1',
    # sk-xxx替换为自己的key
    api_key='sk-iLwJrfFspiWoNHRESsMNsu1YeYBFuGMsREs9GKj2yEZ8mCx1'
)

prompt = f"""

请直接推荐zephyrproject-rtos/zephyr的topic,不超过20个,直接输出值就行

    """

completion = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": prompt}
    ]
)
print(completion.choices[0].message)

# 关闭连接（ClickHouse 使用 HTTP 连接，不需要手动关闭）

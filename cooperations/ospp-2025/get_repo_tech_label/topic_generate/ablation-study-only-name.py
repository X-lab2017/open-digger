from openai import OpenAI
import json

client = OpenAI(
    base_url='',
    # sk-xxx替换为自己的key
    api_key=''
)

prompt = f"""


    """

completion = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": prompt}
    ]
)
print(completion.choices[0].message)



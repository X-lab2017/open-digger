export const globalConfig = {
  general: {
    owner: 'X-lab2017',
    repo: 'OpenDigger',
    baseUrl: 'http://open-digger.opensource-service.cn/',
  },
  db: {
    githubEventLog: {
      type: 'clickhouse',
      url: process.env.GITHUB_LOG_URL,
      host: process.env.GITHUB_LOG_HOST,
      port: process.env.GITHUB_LOG_PORT,
      user: process.env.GITHUB_LOG_USER,
      password: process.env.GITHUB_LOG_PASSWORD,
    },
  },
};

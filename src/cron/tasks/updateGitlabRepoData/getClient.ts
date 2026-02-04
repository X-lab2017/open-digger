import getConfig from '../../../config';
import { request } from 'https';
import { URL } from 'url';

/**
 * GitLab GraphQL client type
 */
export type GraphqlClient = (query: string, variables?: any) => Promise<any>;

/**
 * Get GitLab GraphQL client with token
 * GitLab GraphQL API endpoint is typically: ${apiUrl}/api/graphql
 */
export const getGraphqlClient = async (token: string): Promise<GraphqlClient> => {
  const config = await getConfig();
  const graphqlUrl = config.gitlab.graphqlApiUrl;

  if (!token || !graphqlUrl || token === '' || graphqlUrl === '') {
    throw new Error('GitLab token or API URL is not set');
  }

  return async (query: string, variables?: any) => {
    return new Promise((resolve, reject) => {
      const url = new URL(graphqlUrl);
      const postData = JSON.stringify({
        query,
        variables,
      });

      const path = url.pathname + (url.search || '');

      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Length': Buffer.byteLength(postData),
          'User-Agent': 'opendigger-bot',
        },
      };

      const req = request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            if (res.statusCode !== 200) {
              reject(new Error(`GitLab GraphQL API error: ${res.statusCode} ${res.statusMessage} - ${data}`));
              return;
            }
            const result = JSON.parse(data);
            if (result.errors) {
              reject(new Error(`GitLab GraphQL errors: ${JSON.stringify(result.errors)}`));
              return;
            }
            resolve(result.data);
          } catch (e: any) {
            reject(new Error(`Error parsing GitLab GraphQL response: ${e.message} - ${data}`));
          }
        });
      });

      req.on('error', (e) => {
        reject(new Error(`GitLab GraphQL API request error: ${e.message}`));
      });

      req.write(postData);
      req.end();
    });
  };
};

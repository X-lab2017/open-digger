import { App } from '@octokit/app';
import { graphql } from "@octokit/graphql";
import getConfig from '../../../config';

let githubApp: App | null = null;

export const getGraphqlClient = async (installationId: number, repositoryId: number): Promise<Function> => {
  if (!githubApp) {
    const config = await getConfig();
    githubApp = new App({
      id: config.task.configs.updateGithubAppRepoList.appId,
      privateKey: config.task.configs.updateGithubAppRepoList.appPrivateKey,
    });
  }
  const token = await githubApp.getInstallationAccessToken({ installationId, repositoryIds: [repositoryId] });
  return graphql.defaults({ headers: { authorization: `Bearer ${token}` } });
};

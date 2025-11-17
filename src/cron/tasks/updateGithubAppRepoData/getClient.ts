import { App } from '@octokit/app';
import { graphql } from "@octokit/graphql";
import getConfig from '../../../config';

export const getGraphqlClient = async (installationId: number, repositoryId: number): Promise<Function> => {
  const config = await getConfig();
  const githubApp = new App({
    id: config.task.configs.updateGithubAppRepoList.appId,
    privateKey: config.task.configs.updateGithubAppRepoList.appPrivateKey,
  });

  const token = await githubApp.getInstallationAccessToken({ installationId, repositoryIds: [repositoryId] });
  return graphql.defaults({ headers: { authorization: `Bearer ${token}` } });
};

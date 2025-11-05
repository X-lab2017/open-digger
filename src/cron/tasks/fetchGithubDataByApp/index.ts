import { Task } from '../../index';
import getConfig from '../../../config';
import { query } from '../../../db/clickhouse';
import { Readable } from 'stream';
import { createClient } from '@clickhouse/client';
import { getLogger } from '../../../utils';
import { Octokit } from '@octokit/rest';

/**
 * This task is used to fetch github data by open-share-data-app
 */

const task: Task = {
  cron: '* */1 * * *',
  singleInstance: false,
  callback: async () => {
  },
};

export default task;

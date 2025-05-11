import { Task } from '..';
import getConfig from '../../config';
import { query } from '../../db/clickhouse';
import { Readable } from 'stream';
import { createClient } from '@clickhouse/client';
import { Octokit } from '@octokit/rest';
import { getLogger } from '../../utils';

/**
 * This task collects SBOM data from top-level OpenRank projects using GitHub's API
 */
const task: Task = {
  cron: '0 2 * * *', // Run daily at 2 AM
  callback: async () => {
    const logger = getLogger('SBOMCollectionTask');
    const config = await getConfig();
    const tokens = config.github.tokens;
    const token = tokens[0];
    const octokit = new Octokit({ auth: token });
    
    // Create SBOM data table if it doesn't exist
    const createTableQuery = `
    CREATE TABLE IF NOT EXISTS gh_repo_sbom
    (
      \`id\` UInt64,
      \`repo_name\` String,
      \`updated_at\` DateTime,
      \`sbom_data\` String,
      \`dependencies_count\` UInt32,
      \`package_manager\` Array(LowCardinality(String)),
      \`direct_dependencies\` Array(String)
    )
    ENGINE = ReplacingMergeTree
    ORDER BY (id, updated_at)
    SETTINGS index_granularity = 8192`;
    
    await query(createTableQuery);
    
    // Get top OpenRank repositories
    // Collect top 500 repositories by OpenRank for this initial implementation
    const getTopReposList = async (): Promise<any[]> => {
      const q = `
        SELECT e.id, e.repo_name 
        FROM export_repo e
        JOIN repo_openrank r ON e.id = r.repo_id
        WHERE e.platform = 'GitHub' AND r.event_month = toYYYYMM(now() - INTERVAL 1 MONTH)
        ORDER BY r.openrank DESC
        LIMIT 500`;
      return await query(q);
    };
    
    const reposList = await getTopReposList();
    if (reposList.length === 0) {
      logger.info('No repositories found to process');
      return;
    }
    
    logger.info(`Found ${reposList.length} top repositories to process for SBOM data`);
    
    // Set up stream for bulk insertion
    const now = new Date();
    const date = now.toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');
    const stream = new Readable({
      objectMode: true,
      read: () => { },
    });
    
    const client = createClient(config.db.clickhouse);
    let processedCount = 0;
    
    // Process each repository to fetch SBOM data
    for (const [id, repoName] of reposList) {
      try {
        const [owner, repo] = repoName.split('/');
        
        // Fetch SBOM data from GitHub API
        const response = await octokit.request('GET /repos/{owner}/{repo}/dependency-graph/sbom', {
          owner,
          repo,
          headers: {
            'X-GitHub-Api-Version': '2022-11-28'
          }
        });
        
        if (response.status === 200 && response.data) {
          const sbomData = response.data;
          const parsedSbom = typeof sbomData === 'string' ? JSON.parse(sbomData) : sbomData;
          
          // Extract useful information from SBOM
          const packageManagers = new Set();
          const directDependencies = [];
          let dependenciesCount = 0;
          
          if (parsedSbom.packages) {
            dependenciesCount = parsedSbom.packages.length;
            
            // Extract package managers and direct dependencies
            for (const pkg of parsedSbom.packages) {
              if (pkg.packageManager) {
                packageManagers.add(pkg.packageManager);
              }
              
              // Collect direct dependencies (those referenced by the root project)
              if (pkg.relationship && pkg.relationship.some(rel => rel.indexOf('DIRECT') >= 0)) {
                directDependencies.push(`${pkg.name}@${pkg.version || 'latest'}`);
              }
            }
          }
          
          // Create record
          const sbomRecord = {
            id: parseInt(id),
            repo_name: repoName,
            updated_at: date,
            sbom_data: JSON.stringify(sbomData),
            dependencies_count: dependenciesCount,
            package_manager: Array.from(packageManagers),
            direct_dependencies: directDependencies
          };
          
          stream.push(sbomRecord);
        } else {
          logger.warn(`Failed to get SBOM data for ${repoName}: ${response.status}`);
        }
      } catch (error) {
        logger.error(`Error processing ${repoName}: ${error.message}`);
      }
      
      processedCount++;
      if (processedCount % 50 === 0) {
        logger.info(`${processedCount} repositories processed for SBOM data`);
      }
    }
    
    stream.push(null);
    
    // Insert data into ClickHouse
    await client.insert({
      table: 'gh_repo_sbom',
      values: stream,
      format: 'JSONEachRow',
    });
    
    await client.close();
    logger.info(`SBOM collection complete. Processed ${processedCount} repositories.`);
  }
};

module.exports = task; 
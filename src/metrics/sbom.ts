import { MetricManager, MetricQuery } from './metrics';
import { getLogger } from '../utils';

const logger = getLogger('SBOMMetrics');

/**
 * Metrics for analyzing Software Bill of Materials (SBOM) data
 */
export class SBOMMetrics extends MetricManager {
  /**
   * Get the list of dependent packages for a repository
   */
  public async repoDependencies(repo: string, month?: string): Promise<any> {
    const query: MetricQuery = {
      metric: 'repo_dependencies',
      params: {
        repo,
        month
      }
    };
    return await this.execQuery(query);
  }

  /**
   * Get the count of dependencies by package manager for a repository
   */
  public async repoDependenciesByPackageManager(repo: string, month?: string): Promise<any> {
    const query: MetricQuery = {
      metric: 'repo_dependencies_by_package_manager',
      params: {
        repo,
        month
      }
    };
    return await this.execQuery(query);
  }

  /**
   * Get the most common dependencies across top OpenRank repositories
   */
  public async commonDependencies(limit: number = 50, month?: string): Promise<any> {
    const query: MetricQuery = {
      metric: 'common_dependencies',
      params: {
        limit,
        month
      }
    };
    return await this.execQuery(query);
  }

  /**
   * Get repositories that depend on a specific package
   */
  public async packageDependents(packageName: string, limit: number = 50, month?: string): Promise<any> {
    const query: MetricQuery = {
      metric: 'package_dependents',
      params: {
        packageName,
        limit,
        month
      }
    };
    return await this.execQuery(query);
  }

  /**
   * Build a dependency graph for visualization
   */
  public async dependencyGraph(repo: string, depth: number = 1, month?: string): Promise<any> {
    const query: MetricQuery = {
      metric: 'dependency_graph',
      params: {
        repo,
        depth,
        month
      }
    };
    return await this.execQuery(query);
  }

  protected override async resolveQuery(query: MetricQuery): Promise<string> {
    const { metric, params } = query;
    const { repo, packageName, limit, month, depth } = params;
    
    const monthCondition = month 
      ? `AND updated_at >= toDate('${month}-01') AND updated_at < addMonths(toDate('${month}-01'), 1)`
      : '';
    
    switch (metric) {
      case 'repo_dependencies': {
        if (!repo) throw new Error('repo parameter is required');
        return `
          SELECT 
            id,
            repo_name,
            dependencies_count,
            package_manager,
            direct_dependencies
          FROM gh_repo_sbom
          WHERE repo_name = '${repo}'
          ${monthCondition}
          ORDER BY updated_at DESC
          LIMIT 1
        `;
      }

      case 'repo_dependencies_by_package_manager': {
        if (!repo) throw new Error('repo parameter is required');
        return `
          SELECT 
            repo_name,
            package_manager,
            count() as dependency_count
          FROM gh_repo_sbom
          ARRAY JOIN package_manager
          WHERE repo_name = '${repo}'
          ${monthCondition}
          GROUP BY repo_name, package_manager
          ORDER BY dependency_count DESC
        `;
      }

      case 'common_dependencies': {
        const limitNum = limit || 50;
        return `
          WITH 
            extracted_dependencies AS (
              SELECT 
                repo_name,
                dependency
              FROM gh_repo_sbom
              ARRAY JOIN direct_dependencies AS dependency
              WHERE 1=1 ${monthCondition}
            )
          SELECT 
            dependency,
            count(DISTINCT repo_name) as used_by_count,
            groupArray(10)(repo_name) as example_repos
          FROM extracted_dependencies
          GROUP BY dependency
          ORDER BY used_by_count DESC
          LIMIT ${limitNum}
        `;
      }

      case 'package_dependents': {
        if (!packageName) throw new Error('packageName parameter is required');
        const limitNum = limit || 50;
        
        // Since dependencies may be stored with versions, we do a pattern match
        const packagePattern = packageName.includes('@') 
          ? `'${packageName}'` 
          : `'${packageName}@%'`;
        
        return `
          SELECT 
            repo_name,
            arrayFirst(x -> x LIKE ${packagePattern}, direct_dependencies) as exact_dependency,
            toFloat64(repo_openrank.openrank) as openrank
          FROM gh_repo_sbom
          JOIN repo_openrank ON gh_repo_sbom.id = repo_openrank.repo_id
          WHERE hasLike(direct_dependencies, ${packagePattern})
          ${monthCondition}
          AND repo_openrank.event_month = toYYYYMM(now() - INTERVAL 1 MONTH)
          ORDER BY openrank DESC
          LIMIT ${limitNum}
        `;
      }

      case 'dependency_graph': {
        if (!repo) throw new Error('repo parameter is required');
        const depthNum = depth || 1;
        
        // This is a simplified version for direct dependencies only
        // A more complex implementation would recursively build the graph to the specified depth
        return `
          SELECT 
            repo_name as source,
            dependency as target
          FROM gh_repo_sbom
          ARRAY JOIN direct_dependencies AS dependency
          WHERE repo_name = '${repo}'
          ${monthCondition}
          
          UNION ALL
          
          -- For depth > 1, we would add additional subqueries here
          -- to find dependencies of dependencies
          
          ORDER BY source, target
        `;
      }

      default:
        throw new Error(`Unknown metric: ${metric}`);
    }
  }
}

export default new SBOMMetrics(); 
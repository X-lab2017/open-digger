-- Copyright 2019 - present Xlab
--
-- Licensed under the Apache License, Version 2.0 (the "License");
-- you may not use this file except in compliance with the License.
-- You may obtain a copy of the License at
--
--     http://www.apache.org/licenses/LICENSE-2.0
--
-- Unless required by applicable law or agreed to in writing, software
-- distributed under the License is distributed on an "AS IS" BASIS,
-- WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
-- See the License for the specific language governing permissions and
-- limitations under the License.

-- Auto update report scheduler

sched(compConfig.schedName, compConfig.sched, function ()
  wrap(function ()
    log('Gonna update report')
    -- Read all sqls from remote repo
    local sqlDir = getDirectoryContent(compConfig.sqlsDir)
    if (sqlDir == nil) then
      log('No sql found under'..compConfig.sqlsDir)
      return
    end
    log('Find '..#sqlDir..' SQLs dir')

    -- Read sql details and request result
    local sqlRenderParams = {}
    for i=1, #sqlDir do
      local sqlMeta = sqlDir[i]
      if (sqlMeta.type == 'dir') then
        local sqlRaw = getFileContent(sqlMeta.path..compConfig.sqlFile).content
        local manifest = string2table(getFileContent(sqlMeta.path..compConfig.sqlManifestFile).content)
        local postProcessor = getFileContent(sqlMeta.path..compConfig.sqlPostProcessorFile).content
        -- render sql
        local sql = rendStr(sqlRaw, manifest.config, compConfig.defaultRenderParams)
        -- request run sql
        local requestRes = requestUrl({
          ['url'] = compConfig.sqlRequestUrl,
          ['method'] = 'POST',
          ['form'] = {
            ['query'] = sql
          }
        })
        local renderText = runJsCode(postProcessor, string2table(requestRes).data)
        log('Sql run result for '..sqlMeta.name..' is '..requestRes..', render text is '..renderText)
        sqlRenderParams[sqlMeta.name] = {
          ['sql'] = sqlRaw,
          ['text'] = renderText,
          ['config'] = manifest.config
        }
      end
    end

    -- render report
    local originReport = getFileContent(compConfig.reportFile)
    local reportTemplate = getFileContent(compConfig.reportTemplateFile)

    local newReport = rendStr(reportTemplate.content, compConfig.defaultRenderParams, {
      ['sqls'] = sqlRenderParams
    })
    log('Rendered report is '..newReport)

    -- update report by pull
    if (newReport ~= originReport.content) then
      log('Gonna update report by pull')
      local branchName = rendStr(compConfig.newBranchName, {
        ['timestamp'] = getNowTime()
      })
      newBranch(branchName, compConfig.defaultBranch)
      createOrUpdateFile(compConfig.reportFile, newReport, rendStr(compConfig.commitMessage, { ['branchName'] = branchName }), branchName)
      newPullRequest({
        ['title'] = rendStr(compConfig.pullTitle, { ['branchName'] = branchName }),
        ['body'] = rendStr(compConfig.pullBody, { ['branchName'] = branchName }),
        ['head'] = branchName,
        ['base'] = compConfig.defaultBranch,
        ['allowModify'] = true,
      })
    end
  end)
end)

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

-- Auto update case study report scheduler

sched(compConfig.schedName, compConfig.sched, function ()
  wrap(function ()
    log('Gonna update case study report')
    -- Read all sqls from remote repo
    local sqlDir = getDirectoryContent(compConfig.sqlsDir)
    if (sqlDir == nil) then
      log('No sql found under'..compConfig.sqlsDir)
      return
    end
    log('Find '..#sqlDir..' SQLs dir')

    local reportDir = getDirectoryContent(compConfig.reportDir)
    log('Find '..#reportDir..' case study dir')

    -- Read sql details and request result
    local reports = {}
    for r=1, #reportDir do
      local caseStudyMeta = reportDir[r]
      if (caseStudyMeta.type == 'dir' and caseStudyMeta.name ~= 'sqls') then
        -- form case study repo id list
        local selfManifestFile = getFileContent(caseStudyMeta.path..compConfig.sqlManifestFile)
        if (selfManifestFile ~= nil) then
          local selfManifest = string2table(selfManifestFile.content)
          local idList = ''
          for k=1, #selfManifest.repos do
            idList = idList..selfManifest.repos[k].id..','
          end
          local repoIdList = {
            ['repoIdList'] = string.sub(idList, 1, string.len(idList) - 1)
          }
          local sqlRenderParams = {}
          for i=1, #sqlDir do
            local sqlMeta = sqlDir[i]
            if (sqlMeta.type == 'dir') then
              local sqlRaw = getFileContent(sqlMeta.path..compConfig.sqlFile).content
              local manifest = string2table(getFileContent(sqlMeta.path..compConfig.sqlManifestFile).content)
              local postProcessor = getFileContent(sqlMeta.path..compConfig.sqlPostProcessorFile).content
              -- render sql
              local sql = rendStr(sqlRaw, manifest.config, compConfig.defaultRenderParams, repoIdList)
              log('Sql is '..sql);
              -- request run sql
              local requestRes = requestUrl({
                ['url'] = compConfig.sqlRequestUrl,
                ['method'] = 'POST',
                ['form'] = {
                  ['query'] = sql
                }
              })
              local renderText = runJsCode(postProcessor, string2table(requestRes).data, compConfig.defaultRenderParams, manifest.config)
              log('Sql run result for '..sqlMeta.name..' is '..requestRes..', render text is '..renderText)
              sqlRenderParams[sqlMeta.name] = {
                ['sql'] = sqlRaw,
                ['text'] = renderText,
                ['config'] = manifest.config
              }
            end

            -- render report
            local originReport = getFileContent(compConfig.reportDir..'/'..caseStudyMeta.name..'/'..compConfig.reportFile)
            local reportTemplate = getFileContent(compConfig.reportDir..'/'..caseStudyMeta.name..'/'..compConfig.reportTemplateFile)

            local newReport = rendStr(reportTemplate.content, compConfig.defaultRenderParams, {
              ['sqls'] = sqlRenderParams
            })
            log('Rendered report is '..newReport)

            -- update report
            if (originReport == nil or newReport ~= originReport.content) then
              log('Gonna update report for '..caseStudyMeta.name)
              reports[compConfig.reportDir..'/'..caseStudyMeta.name..'/'..compConfig.reportFile] = newReport
            end
          end
        end
      end
    end

    -- update report by pull
    if (tablelength(reports) ~= 0) then
      local branchName = rendStr(compConfig.newBranchName, {
        ['timestamp'] = getNowTime()
      })
      newBranch(branchName, compConfig.defaultBranch)
      for filePath, fileContent in pairs(reports) do
        createOrUpdateFile(filePath, fileContent, rendStr(compConfig.commitMessage, { ['branchName'] = branchName }), branchName)
      end
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

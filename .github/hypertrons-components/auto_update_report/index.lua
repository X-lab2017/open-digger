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

-- Auto update study report scheduler

sched('Auto update study report', '0 0 3 * * 4', function ()
  wrap(function ()
    ::startRunPreProcess::
    -- Run regular task like generating cache tables
    -- Not implement yet.

    ::startUpdateGlobalStudy::
    log('Gonna update global study')
    local sqlDir = getDirectoryContent('global-study')
    if (sqlDir == nil) then
      log('No sql found under global-study')
      goto startUpdateCaseStudy
    end
    log('Find '..#sqlDir..' SQLs dir')

    local sqlRenderParams = {
      ['html'] = '',
      ['css'] = '',
      ['js'] = ''
    }
    for i=1, #sqlDir do
      local sqlMeta = sqlDir[i]
      if (sqlMeta.type == 'dir') then
        goto globalStudycontinue
      end
      local configFile = getFileContent(sqlMeta.path..'/config.json')
      local preProcessorFile = getFileContent(sqlMeta.path..'/pre-processor.js')
      local postProcessorFile = getFileContent(sqlMeta.path..'/post-processor.js')

      if (preProcessorFile == nil or postProcessorFile == nil) then
        goto globalStudycontinue
      end

      local config = {}
      if (configFile ~= nil) then
        config = string2table(configFile.content)
      end
      local preProcessorResult = runJsCode(preProcessorFile.content, config, compConfig.defaultRenderParams)

      local sqls = preProcessorResult.sqls;
      local requestData = {}
      for j=1, #sqls do
        local sql = sqls[j]
        if (compConfig['db'][sql.type] == nil) then
          goto globalSqlRequestContinue
        end
        local requestRes = requestUrl({
          ['url'] = compConfig['db'][sql.type]['url'],
          ['method'] = 'POST',
          ['form'] = {
            ['query'] = sql.sql
          }
        })
        requestData[j] = string2table(requestRes).data
        ::globalSqlRequestContinue::
      end
      local postProcessResult = runJsCode(postProcessor.content, requestData, config, compConfig.defaultRenderParams)
      sqlRenderParams['html'] = sqlRenderParams['html']..'\n'..postProcessResult.html
      sqlRenderParams['js'] = sqlRenderParams['js']..'\n'..postProcessResult.html
      sqlRenderParams['css'] = sqlRenderParams['css']..'\n'..postProcessResult.html
      ::globalStudycontinue::
    end

    local originStudy = getFileContent('global-study/REPORT.html')
    local reportTemplate = getFileContent('global-study/REPORT_TEMPLATE.html')

    local newStudy = rendStr(reportTemplate.content, sqlRenderParams, config, compConfig.defaultRenderParams)
    log('Rendered study report is '..newStudy)

    if (newStudy ~= originStudy.content) then
      log('Gonna update global study by pull')
      local branchName = rendStr('auto-update-global-study-{{timestamp}}', {
        ['timestamp'] = getNowTime()
      })
      newBranch(branchName, 'master')
      createOrUpdateFile('global-study/REPORT.html', newStudy, 'docs: '..branchName, branchName)
      newPullRequest({
        ['title'] = '[Docs] Update global study '..branchName,
        ['body'] = 'Update global study automatically by robot from '..branchName,
        ['head'] = branchName,
        ['base'] = 'master',
        ['allowModify'] = true,
      })
    end

    ::startUpdateCaseStudy::
    log('Gonna update case study')
    local caseSqlDir = getDirectoryContent('case-study/sqls')
    if (caseSqlDir == nil) then
      log('No sql found under case-study/sqls')
      return
    end
    log('Find '..#caseSqlDir..' SQLs in case study dir')

    local caseDir = getDirectoryContent('case-study/cases')
    log('Find '..#caseDir..' case study dir')

    local reports = {}
    for r=1, #caseDir do
      local caseStudyMeta = caseDir[r]
      if (caseStudyMeta.type ~= 'dir') then
        goto caseStudyContinue
      end
      local caseConfigFile = getFileContent(caseStudyMeta.path..'/config.json')
      if (selfManifestFile == nil) then
        goto caseStudyContinue
      end
      local caseConfig = string2table(caseConfigFile.content)
      local sqlRenderParams = {
        ['html'] = '',
        ['css'] = '',
        ['js'] = ''
      }
      for i=1, #caseSqlDir do
        local sqlMeta = caseSqlDir[i]
        if (sqlMeta.type ~= 'dir') then
          goto caseStudySqlContinue
        end

        if (arrayContains(caseConfig.sqls, function (s)
          return s == sqlMeta.name
        end)) then
          goto caseStudySqlContinue
        end

        local configFile = getFileContent(sqlMeta.path..'/config.json')
        local preProcessorFile = getFileContent(sqlMeta.path..'/pre-processor.js')
        local postProcessorFile = getFileContent(sqlMeta.path..'/post-processor.js')
        if (preProcessorFile == nil or postProcessorFile == nil) then
          goto caseStudySqlContinue
        end
        local config = {}
        if (configFile ~= nil) then
          config = string2table(configFile.content)
        end

        local preProcessorResult = runJsCode(preProcessorFile.content, caseConfig, config, compConfig.defaultRenderParams)
        
        local sqls = preProcessorResult.sqls;
        local requestData = {}
        for j=1, #sqls do
          local sql = sqls[j]
          if (compConfig['db'][sql.type] == nil) then
            goto globalSqlRequestContinue
          end
          local requestRes = requestUrl({
            ['url'] = compConfig['db'][sql.type]['url'],
            ['method'] = 'POST',
            ['form'] = {
              ['query'] = sql.sql
            }
          })
          requestData[j] = string2table(requestRes).data
          ::globalSqlRequestContinue::
        end

        local postProcessResult = runJsCode(postProcessor.content, requestData, caseConfig, config, compConfig.defaultRenderParams)
        sqlRenderParams['html'] = sqlRenderParams['html']..'\n'..postProcessResult.html
        sqlRenderParams['js'] = sqlRenderParams['js']..'\n'..postProcessResult.html
        sqlRenderParams['css'] = sqlRenderParams['css']..'\n'..postProcessResult.html
        ::caseStudySqlContinue::
      end
      local caseStudyOriginReport = getFileContent(caseStudyMeta.path..'/REPORT.html')
      local caseStudyReportTemplate = getFileContent(caseStudyMeta.path..'/REPORT_TEMPLATE.html')

      local newReport = rendStr(caseStudyReportTemplate.content, compConfig.defaultRenderParams, sqlRenderParams)
      log('Rendered report is '..newReport)

      if (originReport == nil or newReport ~= originReport.content) then
        log('Gonna update report for '..caseStudyMeta.name)
        reports[caseStudyMeta.path..'/REPORT.html'] = newReport
      end
      ::caseStudyContinue::
    end

    if (tablelength(reports) ~= 0) then
      local branchName = rendStr('auto-update-case-study-{{timestamp}}', {
        ['timestamp'] = getNowTime()
      })
      newBranch(branchName, 'master')
      for filePath, fileContent in pairs(reports) do
        createOrUpdateFile(filePath, fileContent, 'docs: '..branchName, branchName)
      end
      newPullRequest({
        ['title'] = '[Docs] Update case study '..branchName,
        ['body'] = 'Update case study automatically by robot from '..branchName,
        ['head'] = branchName,
        ['base'] = 'master',
        ['allowModify'] = true,
      })
    end
  end)
end)

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

-- run sql for pull

on('CommandEvent', function (e)
  wrap(function()
    if (e.command == compConfig.command) then
      local prNumer = e.number;
      local files = listPullRequestFiles(e.number)
      log('Gonna run sql for '..e.number..', find '..#files..' files in PR')
      if (#files == 0) then
        return
      end
      local sqls = {}
      for i=1, #files do
        local filename = files[i].filename
        local contentsUrl = files[i].contents_url

        local setField = function(regex, key)
          local sqlName = string.match(filename, regex)
          if (sqlName ~= nil) then
            log('match '..key)
            local ref = string.match(contentsUrl, '.*?ref=(%w+)')
            if (ref ~= nil) then
              if (sqls[sqlName] == nil) then
                sqls[sqlName] = {}
              end
              sqls[sqlName][key] = getFileContent(filename, ref).content
            end
          end
        end
        
        setField(compConfig.sqlFileRegex, 'sql')
        setField(compConfig.manifestFileRegex, 'manifest')
        setField(compConfig.postProcessFileRegex, 'postProcessor')
      end
      -- if no sqls in PR, just return
      if (tablelength(sqls) == 0) then
        log('No sql file found in this PR')
        return
      end
      -- if only part component changed, read the origin files to complete the component
      for k, v in pairs(sqls) do
        if (v.sql == nil) then
          v.sql = getFileContent('sqls/'..k..'/sql').content
        end
        if (v.manifest == nil) then
          v.manifest = getFileContent('sqls/'..k..'/manifest.json').content
        end
        if (v.postProcessor == nil) then
          v.postProcessor = getFileContent('sqls/'..k..'/post-processor.js').content
        end
      end

      -- Render comment and add comment
      local comment = '';
      for k, v in pairs(sqls) do
        local sql = rendStr(v.sql, string2table(v.manifest).config, compConfig.defaultRenderParams)
        local requestRes = requestUrl({
          ['url'] = compConfig.sqlRequestUrl,
          ['method'] = 'POST',
          ['form'] = {
            ['query'] = sql
          }
        })
        local text = runJsCode(v.postProcessor, string2table(requestRes).data)
        log('Sql run done for '..k)
        comment = comment..rendStr(compConfig.commentItemTemplate, {
          ['text'] = text,
          ['sqlName'] = k,
          ['data'] = requestRes
        })
      end

      addIssueComment(e.number, comment)
      addLabels(e.number, { compConfig.label })
    end
  end)
end)

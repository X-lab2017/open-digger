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

-- Pull label sql
on('PullRequestEvent', function (e)
  wrap(function()
    if (e.action == 'opened' or e.action == 'synchronize') then
      local prNumer = e.number;
      local files = listPullRequestFiles(e.number)
      log('Gonna check sql for '..e.number..', find '..#files..' files in PR')
      if (#files == 0) then
        return
      end
      local sqls = {}
      for i=1, #files do
        local filename = files[i].filename
        local contentsUrl = files[i].contents_url
        for j=1, #compConfig.sqlFilesRegex do
          local sqlName = string.match(filename, compConfig.sqlFilesRegex[j])
          if (sqlName ~= nil) then
            addLabels(e.number, { compConfig.label })
            return
          end
        end
      end
    end
  end)
end)

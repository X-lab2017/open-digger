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

-- auto update contribution
sched(compConfig.schedName, compConfig.sched, function ()
  wrap(function()
    local data = getData()
    if (data == nil) then -- data not ready yet
      return
    end

    -- record contribution
    local contribution = {}
    local addContribution = function(login, score)
      if (contribution[login] == nil) then
        contribution[login] = 0
      end
      contribution[login] = contribution[login] + score
    end

    -- parse roles
    local configRoles = config.role.roles
    local roles = {}
    for i=1, #configRoles do
      local configRole = configRoles[i]
      if (configRole.users ~= nil and #configRole.users ~= 0) then
        roles[configRole.name] = configRole.users
      end
    end

    -- parse data
    -- contributors
    roles['contributor'] = {}
    for i=1, #data.contributors do
      table.insert(roles['contributor'], data.contributors[i].login)
    end

    -- participants
    roles['participant'] = {}
    for i=1, #data.issues do
      local issue = data.issues[i]
      table.insert(roles['participant'], issue.author)
      addContribution(issue.author, 2)
      for j=1, #issue.comments do
        table.insert(roles['participant'], issue.comments[j].login)
        addContribution(issue.comments[j].login, 1)
      end
    end

    for i=1, #data.pulls do
      local pull = data.pulls[i]
      table.insert(roles['participant'], pull.author)
      addContribution(pull.author, 3)
      if (pull.mergedAt ~= nil) then
        addContribution(pull.author, 5)
      end
      for j=1, #pull.comments do
        table.insert(roles['participant'], pull.comments[j].login)
        addContribution(pull.comments[j].login, 1)
      end
      for j=1, #pull.reviewComments do
        table.insert(roles['participant'], pull.reviewComments[j].login)
        addContribution(pull.reviewComments[j].login, 4)
      end
    end
    roles['participant'] = tableUnique(roles['participant'], true)

    -- followers
    roles['follower'] = {}
    for i=1, #data.stars do
      table.insert(roles['follower'], data.stars[i].login)
      addContribution(data.stars[i].login, 1)
    end
    for i=1, #data.forks do
      table.insert(roles['follower'], data.forks[i].login)
      addContribution(data.forks[i].login, 2)
    end
    roles['follower'] = tableUnique(roles['follower'], true)

    local roleContribution = {}
    for i=1, #compConfig.roles do
      local roleName = compConfig.roles[i]
      if (roles[roleName]) then
        roleContribution[roleName] = {}
        for j=1, #roles[roleName] do
          local login = roles[roleName][j]
          -- if found in prior roles, skip
          local found = false
          for k=1, i - 1 do
            if (arrayContains(roles[compConfig.roles[k]], function(item)
              return item == login
            end)) then
              found = true
            end
          end
          if (found == false) then
            table.insert(roleContribution[roleName], {
              ['login'] = login,
              ['score'] = contribution[login] ~= nil and contribution[login] or 0
            })
          end
        end
        table.sort(roleContribution[roleName], function(a, b)
          return a.score > b.score
        end)
      else
        log('Role name not found '..roleName)
      end
    end

    local content = ''
    for i=1, #compConfig.roles do
      local roleName = compConfig.roles[i]
      local t = roleContribution[roleName]
      content = content..roleName..':\n'
      for j=1, #t do
        content = content..t[j]['login']..' '..t[j]['score']..'\n'
      end
      content = content..'\n'
    end
    
    local originFile = getFileContent(compConfig.filePath)
    if (originFile == nil or content ~= originFile.content) then
      log('Gonna update contributors by pull')
        local branchName = rendStr(compConfig.newBranchName, {
          ['timestamp'] = getNowTime()
        })
        newBranch(branchName, compConfig.defaultBranch)
        createOrUpdateFile(compConfig.filePath, content, rendStr(compConfig.commitMessage, { ['branchName'] = branchName }), branchName)
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

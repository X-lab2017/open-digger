# import { readdirSync, statSync } from 'fs'
import os
import yaml
from typing import List
# import { readFileAsObj } from './utils'
labelInputDir = '../labeled_data'
labelInputPath = os.path.join(os.path.dirname(os.path.abspath(__file__)), labelInputDir)

supportedTypes = set(['Region', 'Company', 'Community', 'Project', 'Foundation'])

supportedKey = set(['label', 'github_repo', 'github_org', 'github_user'])
GitHubData = {
  'githubRepos': [],
  'githubOrgs': [],
  'githubUsers': [],
}

emptyData = {
  'githubRepos': [],
  'githubOrgs': [],
  'githubUsers': [],
}

LabelItem = {
  'identifier': '',
  'content': {
    'name': '',
    'type': '',
    'data': '',
  },
  'parsed': True
}
LabelItem.update(GitHubData)

ParsedLabelItem = {
  'identifier': '',
  'type': '',
  'name': ''
}
ParsedLabelItem.update(GitHubData)

def getLabelData():
    if not os.path.isdir(labelInputPath):
        print('{} input path is not a directory.'.format(labelInputPath))
        return []
    labelMap = {} #<string, LabelItem>()
    indexFileName = '{}index.yml'.format(os.path.sep)
    labelFileSuffix = '.yml'
    def getfileProcessor(f):
        if not f.endswith('.yml'): return
        # convert windows favor path to linux favor path
        
        identifier = processLabelIdentifier(':{}'.format(f[0:f.find(indexFileName)] if f.endswith(indexFileName) else f[0:f.find(labelFileSuffix)]))
        content = open(os.path.join(labelInputPath, f),encoding='utf-8').read()
        content = yaml.load(content,Loader=yaml.FullLoader)
        labelMap[identifier] = {
          'identifier':identifier,
          'content':content,
          'parsed': False,
          'githubOrgs': [],
          'githubRepos': [],
          'githubUsers': [],
        }

    readPath(labelInputPath, '', getfileProcessor)
    data = processLabelItems(labelMap)
    return data

def readPath(p, base, fileProcessor):
    """_summary_

    Args:
        p (string): _description_
        base (string): _description_
        fileProcessor(f:string)->void.
    """
    if not os.path.isdir(p):
        fileProcessor(base)
    else:
        for f in os.listdir(p):
            readPath(os.path.join(p, f), os.path.join(base, f), fileProcessor)

def processLabelItems(map_item)->List:
  """_summary_

  Args:
      map_item (Map<string, LabelItem>): _description_
      LabelItem (_type_): _description_

  Returns:
      ParsedLabelItem[]: _description_
  """
  for item in map_item.values():
      parseItem(item, map_item)
  return list(map(lambda item: {'identifier': item.get('identifier'),
                                  'type': item.get('content').get('type'),
                                  'name': item.get('content').get('name'),
                                  'githubRepos': list(set(item.get('githubRepos'))),
                                  'githubOrgs': list(set(item.get('githubOrgs'))),
                                  'githubUsers': list(set(item.get('githubUsers'))),
                                  }, list(map_item.values())))

def parseItem(item, map_item):
    """_summary_

    Args:
        item (LabelItem): _description_
        map_item (Map<string, LabelItem>): _description_
    """
    if item.get('parsed'): return
    if item.get('content').get('type') and not item.get('content').get('type') in supportedTypes:
        raise Exception('Not supported type {}'.format(item.get('content').get('type')))
    for key in item.get('content').get('data'): #data里是什么数据类型？字典还是列表？
        if not key in supportedKey:
            raise Exception('Not supported element={}, identifier={}').format(key, item.get('identifier'))
        if key == 'github_repo':
            item.get('githubRepos').extend(x for x in item.get('content').get('data')[key])
        elif key == 'github_org':
            item.get('githubOrgs').extend(x for x in item.get('content').get('data')[key])
        elif key == 'github_user':
            item.get('githubUsers').extend(x for x in item.get('content').get('data')[key])
        elif key == 'label':
            labels = item.get('content').get('data')[key]
            for label in labels:
                identifier = label if label.startswith(':') else processLabelIdentifier(os.path.join(item.get('identifier'), label))
                innerItem = map_item.get(identifier)
                if innerItem == None:
                    raise Exception('Can not find nest identifier {} for {}'.format(identifier, item.get('identifier')))
                if not innerItem.get('parsed'):
                    parseItem(innerItem, map_item)
                item.get('githubOrgs').extend(x for x in innerItem.get('githubOrgs'))
                item.get('githubRepos').extend(x for x in innerItem.get('githubRepos'))
                item.get('githubUsers').extend(x for x in innerItem.get('githubUsers'))
    item['parsed'] = True

def processLabelIdentifier(identifier: str)-> str:
    return os.path.altsep.join(identifier.split(os.path.sep))

def labelDataToGitHubData(data)->GitHubData:
    """_summary_

    Args:
        data (list of ParsedLabelItem): _description_

    Returns:
        GitHubData: _description_
    """
    repoSet = set([])
    orgSet = set([])
    userSet = set([])
    for item in data:
        for r in item.get('githubRepos'): repoSet.add(r)
        for o in item.get('githubOrgs'): orgSet.add(o)
        for u in item.get('githubUsers'): userSet.add(u)
    return {
      "githubRepos": list(repoSet),
      "githubOrgs": list(orgSet),
      "githubUsers": list(userSet),
    }

def getGitHubData(typeOrIds: List)-> GitHubData:
    """_summary_

    Args:
        typeOrIds (List<str>): _description_

    Returns:
        GitHubData: _description_
    """
    if len(typeOrIds) == 0: return emptyData
    data = getLabelData()
    if data == None: return emptyData
    arr = list(filter(lambda i: i.get('type') in typeOrIds or i.get('identifier') in typeOrIds, data))
    return labelDataToGitHubData(arr)

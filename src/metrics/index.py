import sys
import os
import chaoss
from activity_openrank import get_RepoActivityOrOpenrank, get_RepoActivityWithDetail, get_UserActivityOrOpenrank, get_UserActivityWithDetail 
from attention import get_Attention
from related_users import get_RelatedUsers 

def getRepoActivity(config):
    return get_RepoActivityOrOpenrank(config, 'activity')
def getUserActivity(config):
    return get_UserActivityOrOpenrank(config, 'activity')
def getRepoActivityWithDetail(config):
    return get_RepoActivityWithDetail(config)
def getUserActivityWithDetail(config):
    return get_UserActivityWithDetail(config)
def getRepoOpenrank(config):
    get_RepoActivityOrOpenrank(config, 'open_rank')
def getUserOpenrank(config):
    return get_UserActivityOrOpenrank(config, 'open_rank')
def getRelatedUsers(config):
    return get_RelatedUsers(config)
def getAttention(config):
    return get_Attention(config)

# chaoss metrics
def chaossCodeChangeCommits(config): 
    return chaoss.chaossCodeChangeCommits(config)
def chaossIssuesNew(config): 
    return chaoss.chaossIssuesNew(config)
def chaossIssuesClosed(config):
    return chaoss.chaossIssuesClosed(config)
def chaossBusFactor(config):
    return chaoss.chaossBusFactor(config)
def chaossChangeRequestsAccepted(config):
    return chaoss.chaossChangeRequestsAccepted(config)
def chaossChangeRequestsDeclined(config):
    return chaoss.chaossChangeRequestsDeclined(config)
def chaossIssueResolutionDuration(config):
    return chaoss.chaossIssueResolutionDuration(config)

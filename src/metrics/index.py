import sys
import os
import chaoss
import activity_openrank
import attention
import related_users 

def getRepoActivity(config):
    return activity_openrank.getRepoActivityOrOpenrank(config, 'activity')
def getUserActivity(config):
    return activity_openrank.getUserActivityOrOpenrank(config, 'activity')
def getRepoActivityWithDetail(config):
    return activity_openrank.getRepoActivityWithDetail(config)
def getUserActivityWithDetail(config):
    return activity_openrank.getUserActivityWithDetail(config)
def getRepoOpenrank(config):
    return activity_openrank.getRepoActivityOrOpenrank(config, 'open_rank')
def getUserOpenrank(config):
    return activity_openrank.getUserActivityOrOpenrank(config, 'open_rank')
def getRelatedUsers(config):
    return related_users.getRelatedUsers(config)
def getAttention(config):
    return attention.getAttention(config)

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

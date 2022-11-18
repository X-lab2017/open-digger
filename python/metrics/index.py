import chaoss
import activity_openrank
import attention
import related_users 

def getRepoActivity(config):
    return activity_openrank.getRepoActivity(config)
def getUserActivity(config):
    return activity_openrank.getUserActivity(config)
def getRepoOpenrank(config):
    return activity_openrank.getRepoOpenrank(config)
def getUserOpenrank(config):
    return activity_openrank.getUserOpenrank(config)
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

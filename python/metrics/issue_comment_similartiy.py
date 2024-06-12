import string
from tqdm import tqdm
import pandas as pd
import db.clickhouse as clickhouse
import numpy as np
from nltk.corpus import stopwords
from sklearn.feature_extraction.text import CountVectorizer
from scipy.linalg import norm
from sklearn.feature_extraction.text import TfidfVectorizer

def getSelectedActors(config):
    """
    TODO: get Selected Acotrs
    """
    sql = 'SELECT DISTINCT(actor_id) FROM opensource.gh_events')
    ids = clickhouse.query(sql)
    return ids

def get_jaccard_similarity(clean_list):
    total = 0.0
    num = 0.0
    for i in clean_list:
        for j in clean_list:
            if i != j:
                num += 1
                total += jaccard_similarity(i, j)
    if num == 0:
        return 0
    return total/num


def get_tfidf_similarity(clean_list):
    total = 0.0
    num = 0.0
    for i in clean_list:
        for j in clean_list:
            if i != j:
                num += 1
                total += tfidf_similarity(i, j)
    if num == 0:
        return 0
    return total/num


def tfidf_similarity(s1, s2):
    def add_space(s):
        return ' '.join(s)

    s1, s2 = add_space(s1), add_space(s2)
    cv = TfidfVectorizer(tokenizer=lambda s: s.split())
    corpus = [s1, s2]
    vectors = cv.fit_transform(corpus).toarray()
    return np.dot(vectors[0], vectors[1]) / (norm(vectors[0]) * norm(vectors[1]))

def jaccard_similarity(s1, s2):
    def add_space(s):
        return ' '.join(s)

    s1, s2 = add_space(s1), add_space(s2)
    cv = CountVectorizer(tokenizer=lambda s: s.split())
    corpus = [s1, s2]
    vectors = cv.fit_transform(corpus).toarray()
    numerator = np.sum(np.min(vectors, axis=0))
    denominator = np.sum(np.max(vectors, axis=0))
    return 1.0 * numerator / denominator

# turn a doc into clean tokens
def clean_doc(doc):
    # split into tokens by white space
    tokens = doc.split()
    # remove punctuation from each token
    table = str.maketrans('', '', string.punctuation)
    tokens = [w.translate(table) for w in tokens]
    # remove remaining tokens that are not alphabetic
    tokens = [word for word in tokens if word.isalpha()]
    # filter out stop words
    stop_words = set(stopwords.words('english'))
    tokens = [w for w in tokens if not w in stop_words]
    # filter out short tokens
    tokens = [word for word in tokens if len(word) > 2]
    return tokens

def getRecentComments(config, actors, comments_amount = 100):
    """
    Get recent comments per actor. default amount is 100.
    """
    logs = pd.DataFrame()
    for i, actor in actors:
        sql = '''
            SELECT * FROM opensource.gh_events a WHERE a.actor_id = {ACTOR_ID} and a.type = 'IssueCommentEvent' order by created_at desc limit {NUM}
        '''.format(ACTOR_ID = actor, NUM = comments_amount)
        logs = logs.append(clickhouse.query(sql))
    return logs

def getIssueCommentJaccardSimilarity(config):
    actors = getSelectedActors(config)
    logs = getRecentComments(config, actors)
    result = []
    grouped = logs.groupby('actor_id')
    for actor_id,group in grouped:
        string_list = []
        for index in group['issue_comment_body']:
            if isinstance(index, str):
                string_list.append(index)
        clean_list = []
        for index in string_list:
            clean_list.append(clean_doc(index))

        if len(clean_list) < 2:
            result.append({'actor_id': actor_id, 'jaccard_similarity': 0})
            continue
        jaccard = get_jaccard_similarity(clean_list)

        res_dic = {'actor_id':actor_id, 'jaccard_similarity': jaccard}
        result.append(res_dic)
    
    return result
    
def getIssueCommentTFIDFSimilarity(config):
    actors = getSelectedActors(config)
    logs = getRecent100Comments(config, actors)
    result = []
    grouped = logs.groupby('actor_id')
    for actor_id,group in grouped:
        string_list = []
        for index in group['issue_comment_body']:
            if isinstance(index, str):
                string_list.append(index)
        clean_list = []
        for index in string_list:
            clean_list.append(clean_doc(index))

        if len(clean_list) < 2:
            result.append({'actor_id': actor_id, 'tfidf_similarity': 0})
            continue
        tfidf = get_tfidf_similarity(clean_list)

        res_dic = {'actor_id':actor_id, 'tfidf_similarity': tfidf}
        result.append(res_dic)
    
    return result

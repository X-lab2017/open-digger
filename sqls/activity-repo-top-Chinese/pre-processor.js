module.exports = async function(config) {
    let actor_ids = new Array();
    for (let i in config.actors) {
        actor_ids.push(config.actors[i].id);
    }
    let org_ids = new Array();
    for (let i in config.orgs) {
        org_ids.push(config.orgs[i].id);
    }
    let repo_ids = new Array();
    for (let i in config.repos) {
        repo_ids.push(config.repos[i].id);
    }
    let ids={
        "actor_ids":actor_ids.join(','),
        "org_ids":org_ids.join(','),
        "repo_ids":repo_ids.join(',')
    }
    return ids;
}
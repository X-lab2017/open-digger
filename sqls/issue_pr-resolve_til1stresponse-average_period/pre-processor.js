module.exports = async function(config) {
    let repo_ids = new Array();
    for (let i in config.repos) {
        repo_ids.push(config.repos[i].id);
    }
	let banned_actor_ids = new Array();
    for (let i in config.banned_actors) {
        banned_actor_ids.push(config.banned_actors[i].id);
    }
    let ids={
        "repo_ids":actor_ids.join(','),
        "banned_actor_ids":org_ids.join(',')
    }
    return ids;
}
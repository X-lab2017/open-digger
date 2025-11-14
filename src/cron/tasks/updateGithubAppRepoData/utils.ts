export const processActor = (actor: any) => {
  return {
    actor_id: actor.databaseId,
    actor_login: actor.__typename === 'User' ? actor.login : actor.login + '[bot]',
  };
};

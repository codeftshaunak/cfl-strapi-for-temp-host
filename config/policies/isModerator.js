module.exports = async (ctx, next) => {
  if (
    ctx.state.user &&
    ctx.state.user.profile &&
    ctx.state.user.profile.cflTeam === true
  ) {
    // Go to next policy or will reach the controller's action.
    return await next();
  }

  ctx.unauthorized(`You're not allowed!`);
};

"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async pollVote(ctx) {
    try {
      const user = ctx.state.user;
      const { voted } = ctx.request.body;

      const { id } = ctx.params;

      const entity = await strapi
        .query("poll-option")
        .findOne({ _id: id })
        .lean();

      if (voted) {
        entity.votes.push(user.id);
      } else {
        const { votes } = entity;

        const index = votes.findIndex(
          (userId) => userId.toString() === user.id
        );

        if (index > -1) {
          entity.votes.splice(index, 1);
        }
      }

      await strapi.query("poll-option").update({ id }, { votes: entity.votes });

      return entity.votes;
    } catch (err) {
      console.log("err", err);
      return err;
    }
  },
};

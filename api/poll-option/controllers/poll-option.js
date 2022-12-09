"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async pollVote(ctx) {
    try {
      const user = ctx.state.user;

      const { id } = ctx.params;
      const { pollId } = ctx.query;

      const entity = await strapi.query("poll-option").findOne({ _id: id });

      const { votes } = entity;

      if (
        !votes.find((vote) => vote?._id.toString() === user?._id.toString())
      ) {
        const saved = await strapi.query("poll-option").update(
          { id },
          {
            votes: [
              ...votes,
              !votes.includes(user?._id) && user?._id.toString(),
            ],
          }
        );
        const poll = await strapi.query("polls").findOne({ _id: pollId });

        const count = poll?.poll_options.reduce(
          (acc, item) => acc + item.votes.length,
          0
        );

        return { poll: poll, count };
      } else {
        const newVotes = votes.filter(
          (vote) => vote?._id.toString() !== user._id.toString()
        );
        const saved = await strapi.query("poll-option").update(
          { id },
          {
            votes: newVotes,
          }
        );

        const poll = await strapi.query("polls").findOne({ _id: pollId });

        const count = poll?.poll_options.reduce(
          (acc, item) => acc + item.votes.length,
          0
        );
        return { poll: poll, count };
      }
    } catch (err) {
      console.log("err", err);
      return err;
    }
  },
};

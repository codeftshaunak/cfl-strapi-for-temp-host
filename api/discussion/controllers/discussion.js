"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const { parseMultipartData, sanitizeEntity } = require("strapi-utils");
const sanitizeHtml = require("sanitize-html");

module.exports = {
  async findTopic(ctx) {
    let entities;
    const { slug } = ctx.params;
    const topic = await strapi.services["discussion-topic"].findOne({ slug });
    if (!topic) {
      return ctx.badRequest("topic not found");
    }
    entities = await strapi.services.discussion.find({
      ...ctx.query,
      topics: topic.id,
    });

    return entities.map((entity) =>
      sanitizeEntity(entity, { model: strapi.models.discussion })
    );
  },

  async findOne(ctx) {
    const { slug } = ctx.params;
    const entity = await strapi.services.discussion.findOne({ slug });

    return sanitizeEntity(entity, { model: strapi.models.discussion });
  },

  async create(ctx) {
    let entity;
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized("You must be logged in to create a post.");
    }
    if (!user.profile) {
      return ctx.unauthorized("You don't have a profile created.");
    }

    // spam filters
    if (
      strapi.services["spam-filters"]
        .match("url")
        .test(ctx.request.body.title) ||
      strapi.services["spam-filters"].match("url").test(ctx.request.body.body)
    ) {
      return ctx.badRequest("Please remove any URLs from your message.");
    }
    if (
      strapi.services["spam-filters"]
        .match("email")
        .test(ctx.request.body.title) ||
      strapi.services["spam-filters"].match("email").test(ctx.request.body.body)
    ) {
      return ctx.badRequest(
        "Please remove any email addresses from your message."
      );
    }
    if (
      strapi.services["spam-filters"]
        .match("phone")
        .test(ctx.request.body.title) ||
      strapi.services["spam-filters"].match("phone").test(ctx.request.body.body)
    ) {
      return ctx.badRequest(
        "Please remove any phone numbers from your message."
      );
    }

    if (ctx.is("multipart")) {
      const { data, files } = parseMultipartData(ctx);
      data["body"] = sanitizeHtml(ctx.request.body.body);
      entity = await strapi.services.discussion.create(
        { ...data, profile: user.profile.id },
        { files }
      );
    } else {
      const data = {
        ...ctx.request.body,
        body: sanitizeHtml(ctx.request.body.body),
      };
      entity = await strapi.services.discussion.create({
        ...data,
        profile: user.profile.id,
      });
    }

    // updating post count if less than 10
    await strapi.services.discussion.offer(user);

    return sanitizeEntity(entity, { model: strapi.models.discussion });
  },

  async vote(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized("You must be logged in to vote.");
    }
    if (!user.profile) {
      return ctx.unauthorized("You don't have a profile created.");
    }
    console.log("score", ctx.request.body.score);
    const updateObj =
      ctx.request.body.score > 0
        ? {
            $addToSet: { upvotes: user.profile.id },
            $pull: { downvotes: user.profile.id },
          }
        : {
            $addToSet: { downvotes: user.profile.id },
            $pull: { upvotes: user.profile.id },
          };
    const entity = await strapi.services.discussion.update({ id }, updateObj);

    return sanitizeEntity(entity, { model: strapi.models.discussion });
  },
};

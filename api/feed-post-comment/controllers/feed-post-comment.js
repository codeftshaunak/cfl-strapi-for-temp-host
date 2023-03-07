"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */
const { sanitizeEntity } = require("strapi-utils");

module.exports = {
  async findCommentsByPostId(ctx) {
    console.log(ctx.params);
    const { id } = ctx.params;
    const entities = await strapi
      .query("feed-post-comment")
      .model.find({
        feed_post: id,
      })
      .populate({
        path: "user",
        populate: {
          path: "profile",
        },
      })
      .sort([["createdAt", "desc"]]);

    return entities;
  },

  async create(ctx) {
    const { body } = ctx.request;

    const { user: userSender, feed_post } = body;

    let entity;

    entity = await strapi.services["feed-post-comment"].create(body);

    // creating notification
    let post = await strapi.services["feed-post"].findById(feed_post);
    const { user: userReceiver } = post;

    let commentAuthor = ctx.state.user;
    let postAuthor = await strapi.services["profile"].findById(post.user.profile);
    delete postAuthor.connections;
    delete postAuthor.discussions;
    delete postAuthor.discussion_replies;

    if(!post.user.blocked){
      try{
        strapi.plugins["email-designer"].services["email"].sendTemplatedEmail(
          {to:post.user.email},
          {
            templateId: 7,
            sourceCodeToTemplateId: 7,
          },
          {
            toProfile: postAuthor,
            fromProfile: commentAuthor.profile,
          }
        );
      }catch(e){
        console.log("error while sending connection email ",e.message);
      }
    }

    strapi.services.notification.create({
      action: "commented",
      userSender,
      userReceiver,
      references: {
        postId: feed_post,
        commentId: entity._id,
      },
    });

    return sanitizeEntity(entity, {
      model: strapi.models["feed-post-comment"],
    });
  },
};

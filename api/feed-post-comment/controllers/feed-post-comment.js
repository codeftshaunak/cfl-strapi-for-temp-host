"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */
const { sanitizeEntity } = require("strapi-utils");

module.exports = {
  async findCommentsByPostId(ctx) {
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

  async getReplies(ctx){
    const ids = JSON.parse(ctx.request.body?.ids);
    //const replies = await strapi.services["feed-post-comment"].find({id: {$in:ids}});
    let params = {};
    params["_id"] = { $in: ids };
    const replies = await strapi
      .query("feed-post-comment")
      .model.find(params)
      .populate({
        path: "user",
        populate: {
          path: "profile",
        },
      })
      .sort([["createdAt", "asc"]]);
    return replies;
  },

  async reply(ctx) {
    const {id} = ctx.params;
    const {commentId} = ctx.request.body;
    const reply = await strapi.services["feed-post-comment"].create(ctx?.request?.body);
    const comment = await strapi.services["feed-post-comment"].findOne({id:commentId});
    let replies = comment.replies || [];
    replies.push(reply.id);
    // console.log(comment);
    const toProfile = await strapi.services["profile"].getProfile(comment.user?.profile);

    // send email only if the user is not the comment author
    if(comment.user.id!==ctx.state.user.id){
      try{
        await strapi.plugins["email-designer"].services["email"].sendTemplatedEmail(
          {to:comment.user.email},
          {
            templateId: 10,
            sourceCodeToTemplateId: 10,
          },
          {
            toProfile,
            fromProfile: ctx.state.user.profile,
          }
        );
      }catch(e){
        console.log("error while sending message email ",e.message);
      }
    }

    //adding replies ids to the comment data
    await strapi.services["feed-post-comment"].update({id: commentId},{replies});

    return sanitizeEntity(reply, {model: strapi.models["feed-post-comment"]});
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
    let postAuthor = await strapi.services["profile"].getProfile(post.user.profile);

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

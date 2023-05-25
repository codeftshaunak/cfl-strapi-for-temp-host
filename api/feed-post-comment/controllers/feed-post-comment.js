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
    const userSender = ctx.state.user;
    const userReceiver = comment.user;
    let replies = comment.replies || [];
    replies.push(reply.id);
    // console.log(comment);
    const toProfile = await strapi.services["profile"].getProfile(comment.user?.profile);

    //adding replies ids to the comment data
    await strapi.services["feed-post-comment"].update({id: commentId},{replies});
    
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
        strapi.services.notification.create({
          action: "replied",
          userSender,
          userReceiver,
          references: {
            postId: comment.feed_post,
            commentId: reply._id,
          },
        });
      }catch(e){
        console.log("error while sending message email ",e.message);
      }
    }

    return sanitizeEntity(reply, {model: strapi.models["feed-post-comment"]});
  },

  async deleteReply(ctx) {
    const {id,replyID} = ctx.request.body;
    const comment = await strapi.services["feed-post-comment"].findOne({id});
    const index = comment.replies.indexOf(replyID);
    let replies = comment.replies;
    if (index > -1) { // only splice array when item is found
      replies.splice(index, 1); // 2nd parameter means remove one item only
      await strapi.query("feed-post-comment").model.updateOne({_id:id},{$set:{"replies":replies}});
    }
    await strapi.services["feed-post-comment"].delete({id:replyID});
    return {status:"success",data:{id,replyID}};
  },

  async notifyTaggedUsers(ctx){
    const params = ctx.request.body;
    const sender = ctx.state.user;
    if(!sender){
      return ctx.badRequest("User not found");
    }
    if(!sender?.profile){
      return ctx.badRequest("Sender profile not found");
    }
    if(!params?.postId){
      return ctx.badRequest("PostId is missing");
    }

    const tags = JSON.parse(params?.tags);
    if(tags==null || tags=='null'){return "ok";} // handling error for foreach of null
    tags.forEach(async (tag) => {
      let slug = tag.replace('@','');
      const profile = await strapi.services.profile.findOne({slug});

      if(!profile?.user?.blocked){
        try{
          strapi.plugins["email-designer"].services["email"].sendTemplatedEmail(
            {to:profile.user.email},
            {
              templateId: 12,
              sourceCodeToTemplateId: 12,
            },
            {
              toProfile: profile,
              fromProfile: sender.profile,
              url : `https://cofounderslab.com/feed/${params?.postId}?cmntiId=${params?.commentId}`
            }
          );
        }catch(e){
          console.log("error while sending notification email ",e.message);
        }
      }

      await strapi.services.notification.create({
        action: "taggedReply",
        userSender: sender.id,
        userReceiver: profile.user.id,
        references: {
          postId: params?.postId,
          commentId:params?.commentId
        },
      });

    });
    return "ok";
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

    // if user is commenting on his own post then should not be notified
    if(post.user.id!==commentAuthor.id){
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
    }

    return sanitizeEntity(entity, {
      model: strapi.models["feed-post-comment"],
    });
  },
};

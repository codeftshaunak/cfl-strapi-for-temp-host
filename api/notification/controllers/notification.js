"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const { sanitizeEntity } = require("strapi-utils");

module.exports = {
  async findByUser(ctx) {
    const user = ctx.state.user;

    return strapi
      .query("notification")
      .model.find({ userReceiver: user })
      .populate({
        path: "userSender",
        populate: {
          path: "profile",
        },
      })
      .sort({ createdAt: "desc" })
      .lean();
  },

  async unSeenNotificationCount(ctx) {
    const { user } = ctx.state;

    return strapi.query("notification").model.count({
      $or: [{ isSeen: { $exists: false } }, { isSeen: false }],
      userReceiver: user._id,
    });
  },

  async updateNotificationSeen(ctx) {
    const { id } = ctx.params;

    let updatedEntity;
    if (id) {
      const entity = await strapi.services.notification.findOne({ id });

      if (entity) {
        updatedEntity = await strapi.services.notification.update(
          { id },
          { isSeen: true }
        );
      }
    }

    return sanitizeEntity(updatedEntity, {
      model: strapi.models.notification,
    });
  },
};

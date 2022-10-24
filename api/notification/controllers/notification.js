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
};

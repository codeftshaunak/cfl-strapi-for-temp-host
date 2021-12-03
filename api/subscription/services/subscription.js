"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY, {
  // https://github.com/stripe/stripe-node#configuration
  apiVersion: "2020-08-27",
});

module.exports = {
  async handleSubscriptionStatusChange(subscriptionId, customerId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["default_payment_method"],
    });
    await this.update(
      { customerId },
      {
        subscriptionId: subscription.id,
        status: subscription.status,
      }
    );
    const customer = await this.findOne({ customerId });
    const user = await strapi.query("user", "users-permissions").findOne({
      id: customer.user,
    });
    if (["active", "trialing"].includes(subscription.status)) {
      await strapi.services.profile.update(
        { id: user.profile },
        { premium: true }
      );
      await strapi
        .query("user", "users-permissions")
        .update({ id: user.id }, { role: "6172fdb46fd9888cab5c47b8" });
    } else {
      await strapi.services.profile.update(
        { id: user.profile },
        { premium: false }
      );
      await strapi
        .query("user", "users-permissions")
        .update({ id: user.id }, { role: "616dc08eddd40a6af489ec09" });
    }
  },
};

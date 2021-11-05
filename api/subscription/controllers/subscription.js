"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY, {
  // https://github.com/stripe/stripe-node#configuration
  apiVersion: "2020-08-27",
});
const { sanitizeEntity } = require("strapi-utils");

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

const relevantEvents = new Set([
  "product.created",
  "product.updated",
  "price.created",
  "price.updated",
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

module.exports = {
  async createOrGetCustomer(ctx) {
    let entity;
    //get authanticated user details
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized("No authorization header was found.");
    }
    if (!user.profile) {
      return ctx.unauthorized("No profile created.");
    }

    entity = await strapi.services.subscription.findOne({ user: user.id });

    if (!entity) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });
      entity = await strapi.services.subscription.create({
        status: "create",
        user: user.id,
        customerId: customer.id,
      });
    }

    return sanitizeEntity(entity, { model: strapi.models.subscription });
  },

  async webhook(ctx) {
    const buf = await buffer(ctx.request);
    const sig = ctx.request.headers["stripe-signature"];
    const webhookSecret =
      process.env.STRIPE_WEBHOOK_SECRET_LIVE ??
      process.env.STRIPE_WEBHOOK_SECRET;
    let event;

    try {
      event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    } catch (err) {
      console.log(`❌ Error message: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (relevantEvents.has(event.type)) {
      try {
        switch (event.type) {
          case "product.created":
          case "product.updated":
            break;
          case "price.created":
          case "price.updated":
            break;
          case "customer.subscription.created":
          case "customer.subscription.updated":
          case "customer.subscription.deleted":
            await manageSubscriptionStatusChange(
              event.data.object.id,
              event.data.object.customer,
              event.type === "customer.subscription.created"
            );
            break;
          case "checkout.session.completed":
            const checkoutSession = event.data.object;
            if (checkoutSession.mode === "subscription") {
              const subscriptionId = checkoutSession.subscription;
              await manageSubscriptionStatusChange(
                subscriptionId,
                checkoutSession.customer,
                true
              );
            }
            break;
          default:
            throw new Error("Unhandled relevant event!");
        }
      } catch (error) {
        console.log(error);
        return res
          .status(400)
          .send('Webhook error: "Webhook handler failed. View logs."');
      }
    }

    ctx.send({
      received: true,
    });
  },
};

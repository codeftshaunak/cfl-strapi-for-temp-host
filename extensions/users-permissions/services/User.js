"use strict";

const { env } = require("strapi-utils");
const smsClient = require("twilio")(env("TWILIO_ID"), env("TWILIO_TOKEN"));

module.exports = {
  fetchAuthenticatedUser(id) {
    return strapi
      .query("user", "users-permissions")
      .findOne({ id }, ["role", "profile"]);
  },

  async sendEmailToken(user) {
    const emailToken = Math.floor(Math.random() * 90000) + 10000;

    await this.edit({ id: user.id }, { emailToken });

    await strapi.plugins["email-designer"].services.email.sendTemplatedEmail(
      {
        to: user.email,
      },
      {
        templateId: 1,
        sourceCodeToTemplateId: 1,
        subject: `${emailToken} is your passcode for CoFoundersLab`,
      },
      {
        token: emailToken,
      }
    );
  },

  async sendSmsToken(user) {
    const phoneToken = Math.floor(Math.random() * 90000) + 10000;

    await this.edit({ id: user.id }, { phoneToken });

    await smsClient.messages.create({
      to: user.phone,
      from: env("TWILIO_PHONE"),
      body: `Your verification code is ${phoneToken}`,
    });
  },
};

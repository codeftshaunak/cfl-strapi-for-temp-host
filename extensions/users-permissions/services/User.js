"use strict";

const { env } = require("strapi-utils");
const plivo = require("plivo");
const smsClient = new plivo.Client(env("PLIVO_ID"), env("PLIVO_TOKEN"));

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
        subject: `${emailToken} is your CoFoundersLab email verification code`,
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
      src: env("PLIVO_PHONE"),
      dst: user.phone,
      text: `${phoneToken} is your CoFoundersLab phone verification code`,
    });
  },
};

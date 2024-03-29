"use strict";

const { env } = require("strapi-utils");
const plivo = require("plivo");
const smsClient = new plivo.Client(env("PLIVO_ID"), env("PLIVO_TOKEN"));
const axios = require("axios").default;
const moment = require("moment");

module.exports = {
  fetchAuthenticatedUser(id) {
    return strapi
      .query("user", "users-permissions")
      .findOne({ id }, ["role", "profile", "advisor_profile"]);
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

  async calculateMessages(profileId){
    // try {
    //   const connections = await strapi.query("connection").find({
    //     profiles: profileId,
    //     status: { $in: ["accepted", "pending", "message"]},
    //     _limit: -1,
    //   });

    //   const connectionsIds = connections.map((connection) => connection.id);

    //   const count = await strapi.query("message").count({
    //     connection_in: connectionsIds,
    //     authorProfile_ne: profileId,
    //     read: false,
    //   });

    //   await strapi
    //     .query("user", "users-permissions")
    //     .model.updateOne(
    //       { profile: profileId },
    //       { $set: { "badges.unreadMessages": count } }
    //     );

    // } catch (e) {
    //   console.log("failed updating unread message count ----------------", e.message);
    // }
  },

  async calculateConnections(profileId){
    // try{
    //   const count = await strapi.query("connection").count({
    //     profiles: profileId,
    //     authorProfile_ne: profileId,
    //     status: "pending",
    //     _limit: -1,
    //   });
    //   await strapi
    //     .query("user", "users-permissions")
    //     .model.updateOne(
    //       { profile: profileId },
    //       { $set: { "badges.pendingConnections": count } }
    //   );
    // }catch(e){
    //   console.log('calculating connections error---------------------------',e.message);
    // }
  },

  async updateCRM(user, profile) {
    if (!user.email) return;
    if (!profile) {
      try {
        profile = await strapi.query("profile").findOne({ user: user.id }, []);
      } catch (e){
        console.log('error in update CRM', e);
      }
    }

    try{
      if(user?.email && user.createdAt.toISOString() >= new Date('2023-03-05 00:00:00').toISOString() && profile?.firstName){
        const auto = await strapi.services.autoemail.findOne({email:user?.email});
        if(auto){
          await strapi.services.autoemail.update({email:user?.email},{email:user?.email,name:profile?.firstName});
        }else{
          await strapi.services.autoemail.create({email:user?.email,name:profile?.firstName});
        }
      }
    }catch(e){
      console.log(e);
    }

    const userinfo = {
      attributes: {
        TYPE:
          user?.role && user?.role == "6172fdb46fd9888cab5c47b8"
            ? "premium"
            : "free",
        ROLE: profile?.role,
        LOOKINGFOR: profile?.lookingFor,
        COUNTRY: profile?.countryCode,
        ONBOARDED: user?.onboarded,
        CONFIRMED: user?.confirmed,
        LASTLOGIN: moment(user?.lastLogin).format("YYYY-MM-DD"),
        ONBOARDEDAT: moment(user?.onboardedAt).format("YYYY-MM-DD"),
        CREATEDAT: moment(user?.createdAt).format("YYYY-MM-DD"),
        FIRSTNAME: `${profile?.firstName}`,
        LASTNAME: `${profile?.lastName}`,
        PRONOUNS: profile?.pronouns,
        SMS: user?.phone,
      },
      listIds: (() => {
        switch (profile?.pronouns) {
          case "She/Her":
            return [11, 4, 5];
          case "He/Him":
            return [11, 4, 7];
          case "They/Them":
            return [11, 4, 6];
          default:
            return [11, 4];
        }
      })(),
      updateEnabled: true,
      email: user.email,
      smsBlacklisted: false,
      emailBlacklisted: false,
    };
    console.log("userinfo", userinfo);

    axios({
      method: "post",
      url: "https://api.sendinblue.com/v3/contacts",
      headers: {
        "api-key": `${process.env.SIB_KEY}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      data: JSON.stringify(userinfo),
    });
  },
};

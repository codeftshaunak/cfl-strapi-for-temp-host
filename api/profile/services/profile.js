"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

const _ = require("lodash");
const {} = require("strapi-utils");

module.exports = {
  okForOnboarding(profile) {
    if (
      !profile.firstName ||
      !profile.lastName ||
      !profile.pronouns ||
      !profile.city ||
      !profile.tagline
    ) {
      return false;
    }

    if (!profile.profilePicture) {
      return false;
    }

    if (!profile.role) {
      return false;
    }

    if (!profile.lookingFor) {
      return false;
    }

    if (!profile.startupStage) {
      return false;
    }

    if (!profile.skills) {
      return false;
    }
    return true;
  },

  buildSearchParams(user, query) {
    // city: "56cc14c588b042411c0bd010"
    // premium: false
    // role: (2) ['Advisor', 'Intern']
    // skills: []
    // startupStage: []
    let params = {
      public: true,
    };

    if (user) {
      params["user"] = { $ne: user.id };
    }
    if (query.country) {
      params["countryCode"] = query.country;
    }
    if (query.city) {
      // const city = await strapi.services.city.findOne({ id: query.city });
      // const cities = await strapi.query("city").model.find({
      //   coordinates: {
      //     $near: {
      //       $geometry: city.coordinates,
      //       $maxDistance: 100,
      //     },
      //   },
      // });
      // const countCity = strapi.services.profile.countSearch({city: query.city});
      // if(countCity > 0){
      //   params["city"] = query.city;
      // }
      params["city"] = query.city;
    }
    if (query.skills && query.skills.length > 0) {
      params["skills"] = { $in: query.skills };
    }
    if (query.startupStage && query.startupStage.length > 0) {
      params["startupStage"] = { $in: query.startupStage };
    }
    if (user.role?.type === "premium") {
      if (query.premium?.includes("premium")) {
        params["premium"] = true;
      }
      if (query.role && query.role.length > 0) {
        params["role"] = { $in: query.role };
      }
    }
    if (query.q) {
      // params["_or"] = {
      //   firstName_contains: query.q,
      //   lastName_contains: query.q,
      // };
      // params["lastName_contains"] = query.q;
      params = {
        ...params,
        ...{
          $text: { $search: query.q },
        },
      };
    }

    return params;
  },

  findById(profileId) {
    return strapi.query("profile").findOne({ _id: profileId });
  },

  buildReccomendSearchParams(user, query, connectedUsersId) {
    let params = {
      public: true,
    };
    let optionalParams = [];

    if (user) {
      connectedUsersId = [
        ...connectedUsersId,
        user.id
      ]
    }

    if (connectedUsersId && connectedUsersId.length > 0) {
      params["user"] = { $nin: connectedUsersId };
    }

    if (query.country) {
      optionalParams = [
        ...optionalParams,
        { countryCode: { $in: query.country } },
      ]
    }
    if (query.role && query.role.length > 0) {
      optionalParams = [
        ...optionalParams,
        { role: { $in: query.role } },
      ]
    }
    if (query.skills && query.skills.length > 0) {
      optionalParams = [
        ...optionalParams,
        { skills: { $in: query.skills } },
      ]
    }
    if (query.interests && query.interests.length > 0) {
      optionalParams = [
        ...optionalParams,
        { interests: { $in: query.interests } },
      ]
    }

    if (optionalParams.length > 0) {
      params["$or"] = optionalParams;
    }

    return params;
  },
};

"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

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
};

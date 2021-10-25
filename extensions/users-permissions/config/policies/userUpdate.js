module.exports = async (ctx, next) => {
  // If the user is an administrator we allow them to perform this action unrestricted
  if (ctx.state.user.role.name === "Administrator") {
    return next();
  }

  const { id: currentUserId } = ctx.state.user;

  // If you are using MongoDB do not parse the id to an int!
  const userToUpdate = ctx.params.id;

  if (currentUserId !== userToUpdate) {
    return ctx.unauthorized("Unable to edit this user ID");
  }

  // Extract the fields regular users should be able to edit
  const {
    firstName,
    lastName,
    pronouns,
    city,
    profileRole,
    lookingFor,
    businessStage,
    skills,
    interests,
  } = ctx.request.body;

  // Provide custom validation policy here
  //   if (firstName && firstName.trim() === "") {
  //     return ctx.badRequest("First name is required");
  //   }

  // Setup the update object
  const updateData = {
    firstName,
    lastName,
    pronouns,
    city,
    profileRole,
    lookingFor,
    businessStage,
    skills,
    interests,
  };

  if (interests) {
    updateData["onboarded"] = true;
    updateData["onboardedAt"] = new Date();
  }

  // remove properties from the update object that are undefined (not submitted by the user in the PUT request)
  Object.keys(updateData).forEach(
    (key) => updateData[key] === undefined && delete updateData[key]
  );
  if (Object.keys(updateData).length === 0) {
    return ctx.badRequest("No data submitted");
  }

  ctx.request.body = updateData;
  return next();
};

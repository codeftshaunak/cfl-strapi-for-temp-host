"use strict";

/* eslint-disable no-useless-escape */
const _ = require("lodash");
const { sanitizeEntity } = require("strapi-utils");
const crypto = require("crypto");

const emailRegExp =
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const phoneRegExp =
  /^\+((?:9[679]|8[035789]|6[789]|5[90]|42|3[578]|2[1-689])|9[0-58]|8[1246]|6[0-6]|5[1-8]|4[013-9]|3[0-469]|2[70]|7|1)(?:\W*\d){0,13}\d$/;
const formatError = (error) => [
  { messages: [{ id: error.id, message: error.message, field: error.field }] },
];

module.exports = {
  // TODO: last login done, rest: implement login conditions
  async callback(ctx) {
    const provider = ctx.params.provider || "local";
    const params = ctx.request.body;

    const store = await strapi.store({
      environment: "",
      type: "plugin",
      name: "users-permissions",
    });

    if (provider === "local") {
      if (!_.get(await store.get({ key: "grant" }), "email.enabled")) {
        return ctx.badRequest(null, "This provider is disabled.");
      }

      // The identifier is required.
      if (!params.identifier) {
        return ctx.badRequest(
          null,
          formatError({
            id: "Auth.form.error.email.provide",
            message: "Please provide your username or your e-mail.",
          })
        );
      }

      // The password is required.
      if (!params.password) {
        return ctx.badRequest(
          null,
          formatError({
            id: "Auth.form.error.password.provide",
            message: "Please provide your password.",
          })
        );
      }

      const query = { provider };

      // Check if the provided identifier is an email or not.
      const isEmail = emailRegExp.test(params.identifier);

      // Set the identifier to the appropriate query field.
      if (isEmail) {
        query.email = params.identifier.toLowerCase();
      } else {
        query.username = params.identifier;
      }

      // Check if the user exists.
      const user = await strapi
        .query("user", "users-permissions")
        .findOne(query);

      if (!user) {
        return ctx.badRequest(
          null,
          formatError({
            id: "Auth.form.error.invalid",
            message: "Identifier or password invalid.",
          })
        );
      }

      if (
        _.get(await store.get({ key: "advanced" }), "email_confirmation") &&
        user.confirmed !== true
      ) {
        return ctx.badRequest(
          null,
          formatError({
            id: "Auth.form.error.confirmed",
            message: "Your account email is not confirmed",
          })
        );
      }

      if (user.blocked === true) {
        return ctx.badRequest(
          null,
          formatError({
            id: "Auth.form.error.blocked",
            message: "Your account has been blocked by an administrator",
          })
        );
      }

      // The user never authenticated with the `local` provider.
      if (!user.password) {
        return ctx.badRequest(
          null,
          formatError({
            id: "Auth.form.error.password.local",
            message:
              "Looks like your account needs a security upgrade, please reset your password to continue.",
          })
        );
      }

      const validPassword = await strapi.plugins[
        "users-permissions"
      ].services.user.validatePassword(params.password, user.password);

      if (!validPassword) {
        return ctx.badRequest(
          null,
          formatError({
            id: "Auth.form.error.invalid",
            message: "Identifier or password invalid.",
          })
        );
      } else {
        try {
          strapi.query("user", "users-permissions").update(
            { id: user.id },
            {
              lastLogin: new Date(),
            }
          );
          strapi.query("profile").update(
            { user: user.id },
            {
              lastLogin: new Date(),
            }
          );
          strapi.plugins["users-permissions"].services.user.updateCRM({
            ...user,
            lastLogin: new Date(),
          });
        } catch {}

        ctx.send({
          jwt: strapi.plugins["users-permissions"].services.jwt.issue({
            id: user.id,
          }),
          user: sanitizeEntity(user.toJSON ? user.toJSON() : user, {
            model: strapi.query("user", "users-permissions").model,
          }),
        });
      }
    } else {
      if (!_.get(await store.get({ key: "grant" }), [provider, "enabled"])) {
        return ctx.badRequest(
          null,
          formatError({
            id: "provider.disabled",
            message: "This provider is disabled.",
          })
        );
      }

      // Connect the user with the third-party provider.
      let user;
      let error;
      try {
        [user, error] = await strapi.plugins[
          "users-permissions"
        ].services.providers.connect(provider, ctx.query);
      } catch ([user, error]) {
        return ctx.badRequest(null, error === "array" ? error[0] : error);
      }

      if (!user) {
        return ctx.badRequest(null, error === "array" ? error[0] : error);
      }

      try {
        strapi.query("user", "users-permissions").update(
          { id: user.id },
          {
            lastLogin: new Date(),
          }
        );
        strapi.query("profile").update(
          { user: user.id },
          {
            lastLogin: new Date(),
          }
        );
        strapi.plugins["users-permissions"].services.user.updateCRM({
          ...user,
          lastLogin: new Date(),
        });
      } catch {}

      ctx.send({
        jwt: strapi.plugins["users-permissions"].services.jwt.issue({
          id: user.id,
        }),
        user: sanitizeEntity(user.toJSON ? user.toJSON() : user, {
          model: strapi.query("user", "users-permissions").model,
        }),
      });
    }
  },

  async register(ctx) {
    const pluginStore = await strapi.store({
      environment: "",
      type: "plugin",
      name: "users-permissions",
    });

    const settings = await pluginStore.get({
      key: "advanced",
    });

    if (!settings.allow_register) {
      return ctx.badRequest(
        null,
        formatError({
          id: "Auth.advanced.allow_register",
          message: "Register action is currently disabled.",
        })
      );
    }

    const params = {
      ..._.omit(ctx.request.body, [
        "confirmed",
        "confirmationToken",
        "resetPasswordToken",
      ]),
      provider: "local",
      ip: ctx.request.ip,
    };

    // Password is required.
    if (!params.password) {
      return ctx.badRequest(
        null,
        formatError({
          id: "Auth.form.error.password.provide",
          message: "Please provide your password.",
        })
      );
    }

    // Email is required.
    if (!params.email) {
      return ctx.badRequest(
        null,
        formatError({
          id: "Auth.form.error.email.provide",
          message: "Please provide your email.",
        })
      );
    }

    // Set email as username if not provided.
    if (!params.username) {
      params.username = params.email;
    }

    // Throw an error if the password selected by the user
    // contains more than three times the symbol '$'.
    if (
      strapi.plugins["users-permissions"].services.user.isHashed(
        params.password
      )
    ) {
      return ctx.badRequest(
        null,
        formatError({
          id: "Auth.form.error.password.format",
          message:
            "Your password cannot contain more than three times the symbol `$`.",
        })
      );
    }

    const role = await strapi
      .query("role", "users-permissions")
      .findOne({ type: settings.default_role }, []);

    if (!role) {
      return ctx.badRequest(
        null,
        formatError({
          id: "Auth.form.error.role.notFound",
          message: "Impossible to find the default role.",
        })
      );
    }

    // Check if the provided email is valid or not.
    const isEmail = emailRegExp.test(params.email);

    if (isEmail && !params.email.includes("norwegischlernen")) {
      params.email = params.email.toLowerCase();
    } else {
      return ctx.badRequest(
        null,
        formatError({
          id: "Auth.form.error.email.format",
          message: "Please provide valid email address.",
        })
      );
    }

    params.role = role.id;
    params.password = await strapi.plugins[
      "users-permissions"
    ].services.user.hashPassword(params);

    const user = await strapi.query("user", "users-permissions").findOne({
      email: params.email,
    });

    if (user && user.provider === params.provider) {
      return ctx.badRequest(
        null,
        formatError({
          id: "Auth.form.error.email.taken",
          message: "Email is already taken.",
        })
      );
    }

    if (user && user.provider !== params.provider && settings.unique_email) {
      return ctx.badRequest(
        null,
        formatError({
          id: "Auth.form.error.email.taken",
          message: "Email is already taken.",
        })
      );
    }

    try {
      const user = await strapi
        .query("user", "users-permissions")
        .create(params);

      const sanitizedUser = sanitizeEntity(user, {
        model: strapi.query("user", "users-permissions").model,
      });

      try {
        await strapi.plugins["users-permissions"].services.user.sendEmailToken(
          user
        );
      } catch (err) {
        return ctx.badRequest(
          null,
          formatError({
            id: "Auth.form.error.email.failedtoken",
            message: "Could not send email token. Please contact support.",
          })
        );
      }

      strapi.plugins["users-permissions"].services.user.updateCRM(user);

      return ctx.send({ user: sanitizedUser });
    } catch (err) {
      const adminError = _.includes(err.message, "username")
        ? {
            id: "Auth.form.error.username.taken",
            message: "Username already taken",
          }
        : { id: "Auth.form.error.email.taken", message: "Email already taken" };

      ctx.badRequest(null, formatError(adminError));
    }
  },

  async registerConfirmation(ctx, next, returnUser) {
    const { identifier, emailToken } = _.assign(ctx.request.body);

    const { user: userService, jwt: jwtService } =
      strapi.plugins["users-permissions"].services;

    if (_.isEmpty(emailToken)) {
      return ctx.badRequest("token.is.empty");
    }

    const user = await strapi.query("user", "users-permissions").model.findOne({
      email: identifier,
      emailToken,
    });

    if (!user) {
      return ctx.badRequest("token.invalid");
    }

    await userService.edit(
      { id: user.id },
      { confirmed: true, emailToken: null }
    );

    ctx.send({
      jwt: jwtService.issue({ id: user.id }),
      user: sanitizeEntity(user, {
        model: strapi.query("user", "users-permissions").model,
      }),
    });
  },

  async forgotPassword(ctx) {
    let { email } = ctx.request.body;

    // Check if the provided email is valid or not.
    const isEmail = emailRegExp.test(email);

    if (isEmail) {
      email = email.toLowerCase();
    } else {
      return ctx.badRequest(
        null,
        formatError({
          id: "Auth.form.error.email.format",
          message: "Please provide a valid email address.",
        })
      );
    }

    const pluginStore = await strapi.store({
      environment: "",
      type: "plugin",
      name: "users-permissions",
    });

    // Find the user by email.
    const user = await strapi
      .query("user", "users-permissions")
      .findOne({ email: email.toLowerCase() });

    // User not found.
    if (!user) {
      return ctx.badRequest(
        null,
        formatError({
          id: "Auth.form.error.user.not-exist",
          message: "This email does not exist.",
        })
      );
    }

    // User blocked
    if (user.blocked) {
      return ctx.badRequest(
        null,
        formatError({
          id: "Auth.form.error.user.blocked",
          message: "This user is disabled.",
        })
      );
    }

    // Generate random token.
    const resetPasswordToken = crypto.randomBytes(64).toString("hex");

    try {
      await strapi.plugins["email-designer"].services.email.sendTemplatedEmail(
        {
          to: user.email,
        },
        {
          templateId: user.password ? 2 : 3,
          sourceCodeToTemplateId: user.password ? 2 : 3,
        },
        {
          token: resetPasswordToken,
          url: `${process.env.FE_URL}/reset?code=${resetPasswordToken}`,
        }
      );
    } catch (err) {
      return ctx.badRequest(
        null,
        formatError({
          id: "failed.reset.email",
          message: err.message,
        })
      );
    }

    // Update the user.
    await strapi
      .query("user", "users-permissions")
      .update({ id: user.id }, { resetPasswordToken });

    ctx.send({ ok: true });
  },

  async sendEmailToken(ctx) {
    const params = _.assign(ctx.request.body);

    if (!params.email) {
      return ctx.badRequest("missing.email");
    }

    const isEmail = emailRegExp.test(params.email);

    if (isEmail) {
      params.email = params.email.toLowerCase();
    } else {
      return ctx.badRequest("wrong.email");
    }

    const user = await strapi.query("user", "users-permissions").findOne({
      email: params.email,
    });

    if (user.confirmed) {
      return ctx.badRequest("already.confirmed");
    }

    if (user.blocked) {
      return ctx.badRequest("blocked.user");
    }

    try {
      await strapi.plugins["users-permissions"].services.user.sendEmailToken(
        user
      );
      ctx.send({
        email: user.email,
        sent: true,
      });
    } catch (err) {
      return ctx.badRequest(
        null,
        formatError({
          id: "Auth.form.error.email.failedtoken",
          message: "Could not send email token. Please contact support.",
        })
      );
    }
  },

  async sendSmsToken(ctx) {
    const params = _.assign(ctx.request.body);

    if (!params.phone) {
      return ctx.badRequest("missing.phone");
    }

    const isPhone = phoneRegExp.test(params.phone);

    if (isPhone) {
      params.phone = params.phone.toLowerCase();
    } else {
      return ctx.badRequest("wrong.phone");
    }

    const user = await strapi.query("user", "users-permissions").findOne({
      phone: params.phone,
    });

    if (user.confirmed) {
      return ctx.badRequest("already.confirmed");
    }

    if (user.blocked) {
      return ctx.badRequest("blocked.user");
    }

    try {
      await strapi.plugins["users-permissions"].services.user.sendSmsToken(
        user
      );
      ctx.send({
        phone: user.phone,
        sent: true,
      });
    } catch (err) {
      return ctx.badRequest(
        null,
        formatError({
          id: "Auth.form.error.sms.failedtoken",
          message: "Could not send SMS token. Please contact support.",
        })
      );
    }
  },
};

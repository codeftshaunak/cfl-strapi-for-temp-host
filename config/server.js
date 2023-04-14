module.exports = ({ env }) => ({
  host: env("HOST", "0.0.0.0"),
  port: env.int("PORT", 1337),
  url: env("SERVER_URL", "http://localhost:1337"),
  admin: {
    auth: {
      secret: env("ADMIN_JWT_SECRET", "4e22e8a33ca6b65a99e1e9530ae0815e"),
    }
  },
  cron: {
    enabled: true,
  },
  admin_profile_id: "63c5dd6ee207a60016350015"
});

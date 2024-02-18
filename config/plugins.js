module.exports = ({ env }) => ({
  sentry: {
    dsn: env("SENTRY_DSN"),
  },
  upload: {
    provider: "aws-s3",
    providerOptions: {
      accessKeyId: env("AWS_ACCESS_KEY_ID"),
      secretAccessKey: env("AWS_ACCESS_SECRET"),
      region: env("AWS_REGION"),
      params: {
        Bucket: env("AWS_BUCKET"),
      },
    },
  },
email: {
    config: {
      provider: 'strapi-provider-email-brevo',
      providerOptions: {
        apiKey: env('BREVO_API_KEY'),
      },
      settings: {
        defaultFrom: 'noreply@cofounderslab.com',
        defaultReplyTo: 'noreply@cofounderslab.com',
      },
    },
  }
});

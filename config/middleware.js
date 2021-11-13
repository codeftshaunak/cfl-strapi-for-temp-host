module.exports = {
  settings: {
    cors: {
      enabled: true,
      origin: [
        "http://localhost",
        "https://cofounderslab.com",
        "https://staging.cofounderslab.com",
        "https://cfl-next-prod.vercel.app",
        "https://cfl-next.vercel.app",
      ],
    },
    parser: {
      enabled: true,
      multipart: true,
      includeUnparsed: true,
    },
  },
};

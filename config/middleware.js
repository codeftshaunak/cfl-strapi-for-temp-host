module.exports = {
  settings: {
    cors: {
      enabled: true,
      origin: [
        "http://127.0.0.1:3000",
        "http://localhost:1337",
        "http://localhost:3000",
        "https://cofounderslab.com",
        "https://staging.cofounderslab.com",
        "https://api.cofounderslab.com",
        "https://api-cfl-staging.herokuapp.com",
        "https://cfl-next-v2-dev.vercel.app",
      ],
    },
    parser: {
      enabled: true,
      multipart: true,
      includeUnparsed: true,
    },
  },
};

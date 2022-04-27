module.exports = {
  settings: {
    cors: {
      enabled: true,
      origin: [
        "http://localhost:1337",
        "http://localhost:3000",
        "https://cofounderslab.com",
        "https://staging.cofounderslab.com",
        "https://api.cofounderslab.com",
        "https://api-cfl-staging.herokuapp.com",
      ],
    },
    parser: {
      enabled: true,
      multipart: true,
      includeUnparsed: true,
    },
  },
};

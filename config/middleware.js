module.exports = {
  settings: {
    cors: {
      enabled: true,
      origin: [
        "http://localhost:3000",
        "https://cofounderslab.com",
        "https://staging.cofounderslab.com",
      ],
    },
    parser: {
      enabled: true,
      multipart: true,
      includeUnparsed: true,
    },
  },
};

module.exports = {
  apps: [
    {
      name: 'ps-white-backend',
      script: './backend/server.js',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
    },
  ],
};

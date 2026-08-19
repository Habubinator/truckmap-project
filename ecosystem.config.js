module.exports = {
  apps: [
    {
      name: 'api-primary',
      script: 'dist/index.js',
      instances: '1',
      exec_mode: 'cluster',
    },
    {
      name: 'api-replica',
      script: 'dist/index.js',
      instances: '-2',
      exec_mode: 'cluster',
    },
  ],
};

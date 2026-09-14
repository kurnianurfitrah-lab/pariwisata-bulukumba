module.exports = {
  apps: [
    {
      name: 'bulukumba-api',
      cwd: './backend',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      kill_timeout: 12000,
      listen_timeout: 10000,
      time: true,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};


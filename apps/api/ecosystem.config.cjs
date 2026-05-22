module.exports = {
  apps: [
    {
      name: 'mvh-api',
      script: 'dist/server.js',
      cwd: '/var/www/mvh-store/apps/api',
      instances: 'max',
      exec_mode: 'cluster',
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 5000,
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      error_file: '/var/log/pm2/mvh-api-error.log',
      out_file: '/var/log/pm2/mvh-api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};

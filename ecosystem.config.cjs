module.exports = {
  apps: [
    {
      name: 'orderking-web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      instances: 'max',
      exec_mode: 'cluster',
      max_memory_restart: '1G',
      max_restarts: 10,
      restart_delay: 5000,
      out_file: './logs/web-out.log',
      error_file: './logs/web-error.log',
      merge_logs: true,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'orderking-workers',
      script: './dist/workers/index.js',
      instances: 1,
      max_memory_restart: '512M',
      max_restarts: 10,
      restart_delay: 5000,
      out_file: './logs/worker-out.log',
      error_file: './logs/worker-error.log',
      merge_logs: true,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};

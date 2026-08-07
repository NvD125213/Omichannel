/**
 * PM2 ecosystem — Omichannel (Next.js)
 * Dùng trong Docker: docker-entrypoint.sh sẽ start/reload app này.
 */
module.exports = {
  apps: [
    {
      name: "omichannel",
      cwd: "/app",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "1G",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "/app/logs/pm2-error.log",
      out_file: "/app/logs/pm2-out.log",
      merge_logs: true,
      time: true,
    },
  ],
};

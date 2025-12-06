module.exports = {
  apps: [{
    name: 'zyntrix-hosting',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: true,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 25569
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 25569
    }
  }]
};

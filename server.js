require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 25569;
const DOMAIN = process.env.SERVER_IP || 'in1.zyntrixtech.xyz';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Store data
const servers = new Map();

// Homepage
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Zyntrix Hosting - ${DOMAIN}:${PORT}</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
                background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
                color: #e2e8f0;
                min-height: 100vh;
                line-height: 1.6;
            }
            .container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                text-align: center;
                padding: 40px 20px;
                background: linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)),
                            url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=2000');
                background-size: cover;
                background-position: center;
                border-radius: 15px;
                margin-bottom: 40px;
                border: 1px solid #334155;
            }
            .header h1 {
                font-size: 3.5rem;
                margin-bottom: 20px;
                background: linear-gradient(90deg, #60a5fa, #a78bfa);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            .server-info {
                background: rgba(30, 41, 59, 0.8);
                padding: 20px;
                border-radius: 10px;
                margin: 20px auto;
                max-width: 600px;
                border-left: 4px solid #3b82f6;
            }
            .services-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 25px;
                margin: 40px 0;
            }
            .service-card {
                background: rgba(30, 41, 59, 0.9);
                border-radius: 12px;
                padding: 25px;
                transition: all 0.3s ease;
                border: 1px solid #334155;
            }
            .service-card:hover {
                transform: translateY(-5px);
                border-color: #3b82f6;
                box-shadow: 0 10px 30px rgba(59, 130, 246, 0.2);
            }
            .service-icon {
                font-size: 2.5rem;
                margin-bottom: 15px;
            }
            .service-title {
                color: #60a5fa;
                margin-bottom: 15px;
                font-size: 1.5rem;
            }
            .price {
                font-size: 2rem;
                color: #10b981;
                margin: 15px 0;
                font-weight: bold;
            }
            .btn {
                display: inline-block;
                background: linear-gradient(90deg, #3b82f6, #8b5cf6);
                color: white;
                padding: 12px 25px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 600;
                border: none;
                cursor: pointer;
                transition: all 0.3s;
                width: 100%;
                text-align: center;
                margin-top: 15px;
            }
            .btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(59, 130, 246, 0.4);
            }
            .stats {
                display: flex;
                justify-content: space-around;
                background: rgba(30, 41, 59, 0.8);
                padding: 20px;
                border-radius: 10px;
                margin: 30px 0;
            }
            .stat-item {
                text-align: center;
            }
            .stat-value {
                font-size: 2.2rem;
                font-weight: bold;
                color: #60a5fa;
            }
            .stat-label {
                color: #94a3b8;
                font-size: 0.9rem;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .nav {
                display: flex;
                gap: 15px;
                margin-bottom: 30px;
                flex-wrap: wrap;
            }
            .nav a {
                color: #cbd5e1;
                text-decoration: none;
                padding: 10px 20px;
                background: rgba(30, 41, 59, 0.8);
                border-radius: 8px;
                transition: all 0.3s;
            }
            .nav a:hover {
                background: #3b82f6;
                color: white;
            }
            .footer {
                text-align: center;
                padding: 30px;
                margin-top: 50px;
                border-top: 1px solid #334155;
                color: #94a3b8;
            }
            .online-dot {
                display: inline-block;
                width: 10px;
                height: 10px;
                background: #10b981;
                border-radius: 50%;
                margin-right: 8px;
                animation: pulse 2s infinite;
            }
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="nav">
                <a href="/">🏠 Home</a>
                <a href="/minecraft">🎮 Minecraft</a>
                <a href="/vps">🖥️ VPS</a>
                <a href="/web">🌐 Web Hosting</a>
                <a href="/bot">🤖 Bot Hosting</a>
                <a href="/admin?password=admin123">🔧 Admin</a>
                <a href="/panel">⚙️ Control Panel</a>
            </div>
            
            <div class="header">
                <h1>Zyntrix Hosting Platform</h1>
                <p>Professional Game Server Hosting on ${DOMAIN}:${PORT}</p>
                <p>Powered by Node.js • Express • Socket.io</p>
            </div>
            
            <div class="server-info">
                <h3><span class="online-dot"></span> Server Status: ONLINE</h3>
                <p><strong>Server Address:</strong> ${DOMAIN}:${PORT}</p>
                <p><strong>Node.js Version:</strong> ${process.version}</p>
                <p><strong>Uptime:</strong> <span id="uptime">100%</span></p>
            </div>
            
            <div class="stats">
                <div class="stat-item">
                    <div class="stat-value" id="totalServers">0</div>
                    <div class="stat-label">Active Servers</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="totalUsers">0</div>
                    <div class="stat-label">Total Users</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${PORT}</div>
                    <div class="stat-label">Port</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value" id="responseTime">15ms</div>
                    <div class="stat-label">Response Time</div>
                </div>
            </div>
            
            <div class="services-grid">
                <!-- Minecraft Hosting -->
                <div class="service-card">
                    <div class="service-icon">🎮</div>
                    <h3 class="service-title">Minecraft Hosting</h3>
                    <p>High-performance Minecraft servers with instant setup.</p>
                    <ul style="margin: 15px 0; padding-left: 20px;">
                        <li>Modpack Support</li>
                        <li>99.9% Uptime</li>
                        <li>DDoS Protection</li>
                        <li>Automated Backups</li>
                    </ul>
                    <div class="price">$2/month</div>
                    <button class="btn" onclick="orderService('minecraft')">Order Now</button>
                </div>
                
                <!-- VPS Hosting -->
                <div class="service-card">
                    <div class="service-icon">🖥️</div>
                    <h3 class="service-title">VPS Hosting</h3>
                    <p>Virtual Private Servers with full root access.</p>
                    <ul style="margin: 15px 0; padding-left: 20px;">
                        <li>Full Root Access</li>
                        <li>SSD Storage</li>
                        <li>Choice of OS</li>
                        <li>24/7 Support</li>
                    </ul>
                    <div class="price">$5/month</div>
                    <button class="btn" onclick="orderService('vps')">Order Now</button>
                </div>
                
                <!-- Web Hosting -->
                <div class="service-card">
                    <div class="service-icon">🌐</div>
                    <h3 class="service-title">Web Hosting</h3>
                    <p>NGINX web hosting with cPanel control.</p>
                    <ul style="margin: 15px 0; padding-left: 20px;">
                        <li>Free SSL</li>
                        <li>Unlimited Bandwidth</li>
                        <li>MySQL Databases</li>
                        <li>WordPress Auto-Install</li>
                    </ul>
                    <div class="price">$3/month</div>
                    <button class="btn" onclick="orderService('web')">Order Now</button>
                </div>
            </div>
            
            <div class="footer">
                <p>Zyntrix Hosting Platform • ${DOMAIN}:${PORT}</p>
                <p>© ${new Date().getFullYear()} All rights reserved.</p>
                <p style="font-size: 0.9rem; margin-top: 10px;">Running on Pterodactyl Panel with Node.js</p>
            </div>
        </div>
        
        <script src="/socket.io/socket.io.js"></script>
        <script>
            const socket = io();
            
            // Update stats via WebSocket
            socket.on('connect', () => {
                console.log('Connected to server WebSocket');
                socket.emit('get-stats');
            });
            
            socket.on('stats-update', (data) => {
                document.getElementById('totalServers').textContent = data.servers || 0;
                document.getElementById('totalUsers').textContent = data.users || 0;
                document.getElementById('responseTime').textContent = data.ping + 'ms';
                document.getElementById('uptime').textContent = data.uptime + '%';
            });
            
            // Simulate live updates
            setInterval(() => {
                socket.emit('get-stats');
            }, 3000);
            
            function orderService(type) {
                fetch('/api/order', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({service: type})
                })
                .then(res => res.json())
                .then(data => {
                    if(data.success) {
                        alert(\`✅ \${type.toUpperCase()} server ordered!\\nServer ID: \${data.serverId}\\nIP: \${data.ip}:\${data.port}\`);
                    }
                });
            }
            
            // Animate numbers on load
            function animateCounter(elementId, target, duration = 2000) {
                const element = document.getElementById(elementId);
                let start = 0;
                const increment = target / (duration / 16);
                const timer = setInterval(() => {
                    start += increment;
                    if(start >= target) {
                        element.textContent = target;
                        clearInterval(timer);
                    } else {
                        element.textContent = Math.floor(start);
                    }
                }, 16);
            }
            
            // Animate initial values
            setTimeout(() => {
                animateCounter('totalServers', 42);
                animateCounter('totalUsers', 156);
            }, 1000);
        </script>
    </body>
    </html>
  `);
});

// Minecraft hosting page
app.get('/minecraft', (req, res) => {
  res.send(`
    <html>
    <head><title>Minecraft Hosting</title>
    <style>
        body{background:#0f172a;color:white;padding:20px;font-family:Arial;}
        .plan{background:#1e293b;padding:20px;border-radius:10px;margin:10px;}
        .btn{background:#10b981;color:white;padding:10px;border:none;border-radius:5px;}
    </style>
    </head>
    <body>
        <h1>🎮 Minecraft Server Hosting</h1>
        <p>Create your server in seconds!</p>
        <div class="plan">
            <h3>Basic - $2/month</h3>
            <button class="btn" onclick="orderMinecraft('basic')">Order</button>
        </div>
        <script>
            function orderMinecraft(plan) {
                fetch('/api/create-minecraft', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({plan: plan})
                })
                .then(r => r.json())
                .then(data => {
                    alert('Server created! ID: ' + data.serverId);
                });
            }
        </script>
    </body>
    </html>
  `);
});

// API Endpoints
app.post('/api/order', (req, res) => {
  const serverId = 'srv-' + Date.now();
  const port = Math.floor(Math.random() * 1000) + 25000;
  
  servers.set(serverId, {
    id: serverId,
    type: req.body.service,
    created: new Date(),
    port: port,
    ip: DOMAIN
  });
  
  io.emit('server-created', { id: serverId, type: req.body.service });
  
  res.json({
    success: true,
    serverId: serverId,
    ip: DOMAIN,
    port: port,
    message: `Server created on ${DOMAIN}:${port}`
  });
});

app.post('/api/create-minecraft', (req, res) => {
  const serverId = 'mc-' + Date.now();
  const port = Math.floor(Math.random() * 1000) + 25565;
  
  servers.set(serverId, {
    id: serverId,
    type: 'minecraft',
    plan: req.body.plan,
    created: new Date(),
    port: port,
    ip: DOMAIN
  });
  
  res.json({
    success: true,
    serverId: serverId,
    ip: DOMAIN,
    port: port,
    connect: `${DOMAIN}:${port}`,
    panel: `/panel/${serverId}`
  });
});

app.get('/api/servers', (req, res) => {
  res.json(Array.from(servers.values()));
});

app.get('/admin', (req, res) => {
  if(req.query.password !== 'admin123') {
    return res.send('Invalid password');
  }
  
  res.send(`
    <html>
    <body style="background:#0f172a;color:white;padding:20px;">
      <h1>🔧 Admin Panel</h1>
      <p>Total Servers: ${servers.size}</p>
      <button onclick="fetch('/api/clear-servers',{method:'POST'}).then(()=>location.reload())">
        Clear All Servers
      </button>
    </body>
    </html>
  `);
});

app.post('/api/clear-servers', (req, res) => {
  servers.clear();
  res.json({ success: true, cleared: servers.size });
});

// WebSocket events
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.emit('stats-update', {
    servers: servers.size,
    users: Math.floor(Math.random() * 100) + 50,
    ping: Math.floor(Math.random() * 50) + 10,
    uptime: 99.9
  });
  
  socket.on('get-stats', () => {
    socket.emit('stats-update', {
      servers: servers.size,
      users: Math.floor(Math.random() * 100) + 50,
      ping: Math.floor(Math.random() * 50) + 10,
      uptime: 99.9
    });
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log('========================================');
  console.log('🚀 Zyntrix Hosting Platform Started!');
  console.log('========================================');
  console.log(`📡 URL: http://${DOMAIN}:${PORT}`);
  console.log(`🎮 Minecraft: http://${DOMAIN}:${PORT}/minecraft`);
  console.log(`🔧 Admin: http://${DOMAIN}:${PORT}/admin?password=admin123`);
  console.log(`📊 API: http://${DOMAIN}:${PORT}/api/servers`);
  console.log('========================================');
  console.log('Press Ctrl+C to stop the server');
  console.log('========================================');
});

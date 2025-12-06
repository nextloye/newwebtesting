require('dotenv').config();
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 25569;
const HOST = '0.0.0.0';
const DOMAIN = 'in1.zyntrixtech.xyz';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Store "servers" in memory (use database in production)
const servers = new Map();
const users = new Map();

// Authentication middleware
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization || req.query.token;
  if (token === process.env.ADMIN_TOKEN || req.query.password === 'admin123') {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
};

// Homepage
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Zyntrix Hosting - in1.zyntrixtech.xyz:${PORT}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
                color: white;
                min-height: 100vh;
            }
            .header {
                background: rgba(15, 23, 42, 0.9);
                backdrop-filter: blur(10px);
                padding: 1rem 2rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 2px solid #3b82f6;
                position: sticky;
                top: 0;
                z-index: 100;
            }
            .logo {
                font-size: 1.8rem;
                font-weight: bold;
                background: linear-gradient(90deg, #3b82f6, #8b5cf6);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            .nav a {
                color: #cbd5e1;
                text-decoration: none;
                margin: 0 1rem;
                padding: 0.5rem 1rem;
                border-radius: 5px;
                transition: all 0.3s;
            }
            .nav a:hover {
                background: #1e293b;
                color: #60a5fa;
            }
            .hero {
                text-align: center;
                padding: 5rem 2rem;
                background: linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)),
                            url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=2000');
                background-size: cover;
                background-position: center;
            }
            .hero h1 {
                font-size: 3.5rem;
                margin-bottom: 1rem;
                background: linear-gradient(90deg, #60a5fa, #a78bfa);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            .hero p {
                font-size: 1.2rem;
                color: #cbd5e1;
                max-width: 600px;
                margin: 0 auto 2rem;
            }
            .cta-button {
                display: inline-block;
                background: linear-gradient(90deg, #3b82f6, #8b5cf6);
                color: white;
                padding: 1rem 2.5rem;
                border-radius: 50px;
                text-decoration: none;
                font-weight: bold;
                font-size: 1.1rem;
                transition: transform 0.3s, box-shadow 0.3s;
            }
            .cta-button:hover {
                transform: translateY(-3px);
                box-shadow: 0 10px 25px rgba(59, 130, 246, 0.4);
            }
            .services {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 2rem;
                padding: 4rem 2rem;
                max-width: 1200px;
                margin: 0 auto;
            }
            .service-card {
                background: rgba(30, 41, 59, 0.8);
                border-radius: 15px;
                padding: 2rem;
                border: 1px solid #334155;
                transition: all 0.3s;
            }
            .service-card:hover {
                transform: translateY(-10px);
                border-color: #3b82f6;
                box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            }
            .service-icon {
                font-size: 2.5rem;
                margin-bottom: 1rem;
            }
            .service-card h3 {
                color: #60a5fa;
                margin-bottom: 1rem;
            }
            .features {
                list-style: none;
                margin: 1rem 0;
            }
            .features li {
                padding: 0.5rem 0;
                color: #cbd5e1;
                border-bottom: 1px solid #334155;
            }
            .features li:last-child {
                border-bottom: none;
            }
            .price {
                font-size: 2rem;
                font-weight: bold;
                color: #10b981;
                margin: 1rem 0;
            }
            .order-btn {
                width: 100%;
                background: #10b981;
                color: white;
                border: none;
                padding: 1rem;
                border-radius: 8px;
                font-weight: bold;
                cursor: pointer;
                transition: background 0.3s;
            }
            .order-btn:hover {
                background: #0da271;
            }
            .server-info {
                background: #1e293b;
                padding: 2rem;
                margin: 2rem auto;
                max-width: 800px;
                border-radius: 10px;
                text-align: center;
                border-left: 5px solid #3b82f6;
            }
            .server-info h3 {
                color: #60a5fa;
                margin-bottom: 1rem;
            }
            .status-indicator {
                display: inline-block;
                width: 12px;
                height: 12px;
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
            .footer {
                background: #0f172a;
                padding: 3rem 2rem;
                text-align: center;
                margin-top: 4rem;
                border-top: 1px solid #334155;
            }
            .live-stats {
                display: flex;
                justify-content: center;
                gap: 3rem;
                margin-top: 2rem;
            }
            .stat {
                text-align: center;
            }
            .stat-value {
                font-size: 2.5rem;
                font-weight: bold;
                color: #60a5fa;
            }
            .stat-label {
                color: #94a3b8;
                font-size: 0.9rem;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo">🏰 Zyntrix Hosting</div>
            <div class="nav">
                <a href="/">Home</a>
                <a href="/minecraft">Minecraft</a>
                <a href="/vps">VPS</a>
                <a href="/web">Web Hosting</a>
                <a href="/admin?password=admin123">Admin</a>
                <a href="/panel">My Panel</a>
            </div>
        </div>

        <div class="hero">
            <h1>Professional Game Server Hosting</h1>
            <p>High-performance Minecraft, VPS, and Web Hosting on in1.zyntrixtech.xyz:${PORT}</p>
            <p>Powered by Node.js • NGINX • Docker</p>
            <a href="#services" class="cta-button">Get Started Today</a>
        </div>

        <div class="server-info">
            <h3><span class="status-indicator"></span> Server Status: ONLINE</h3>
            <p>Server IP: <strong>${DOMAIN}:${PORT}</strong> | Uptime: 99.9% | Response Time: &lt;50ms</p>
            <div class="live-stats">
                <div class="stat">
                    <div class="stat-value" id="activeServers">0</div>
                    <div class="stat-label">Active Servers</div>
                </div>
                <div class="stat">
                    <div class="stat-value" id="totalUsers">0</div>
                    <div class="stat-label">Total Users</div>
                </div>
                <div class="stat">
                    <div class="stat-value" id="uptime">100%</div>
                    <div class="stat-label">Uptime</div>
                </div>
            </div>
        </div>

        <div class="services" id="services">
            <!-- Minecraft Card -->
            <div class="service-card">
                <div class="service-icon">🎮</div>
                <h3>Minecraft Hosting</h3>
                <ul class="features">
                    <li>✓ Instant Setup (30 seconds)</li>
                    <li>✓ Modpack & Plugin Support</li>
                    <li>✓ 99.9% Uptime SLA</li>
                    <li>✓ DDoS Protection</li>
                    <li>✓ Automated Backups</li>
                    <li>✓ Full FTP Access</li>
                </ul>
                <div class="price">From $2/month</div>
                <button class="order-btn" onclick="window.location.href='/minecraft'">Order Minecraft Server</button>
            </div>

            <!-- VPS Card -->
            <div class="service-card">
                <div class="service-icon">🖥️</div>
                <h3>VPS Hosting</h3>
                <ul class="features">
                    <li>✓ Full Root Access</li>
                    <li>✓ SSD Storage</li>
                    <li>✓ Choice of OS</li>
                    <li>✓ Dedicated IP</li>
                    <li>✓ 1Gbps Network</li>
                    <li>✓ 24/7 Support</li>
                </ul>
                <div class="price">From $5/month</div>
                <button class="order-btn" onclick="window.location.href='/vps'">Order VPS</button>
            </div>

            <!-- Web Hosting Card -->
            <div class="service-card">
                <div class="service-icon">🌐</div>
                <h3>Web Hosting</h3>
                <ul class="features">
                    <li>✓ NGINX + PHP 8.2</li>
                    <li>✓ Free SSL Certificate</li>
                    <li>✓ Unlimited Bandwidth</li>
                    <li>✓ MySQL Databases</li>
                    <li>✓ cPanel Control</li>
                    <li>✓ WordPress Auto-Install</li>
                </ul>
                <div class="price">From $3/month</div>
                <button class="order-btn" onclick="window.location.href='/web'">Order Web Hosting</button>
            </div>
        </div>

        <div class="footer">
            <p>Zyntrix Hosting Platform • ${DOMAIN}:${PORT}</p>
            <p>Powered by Node.js • Running on in1.zyntrixtech.xyz</p>
            <p>© 2024 Zyntrix Technologies. All rights reserved.</p>
        </div>

        <script>
            // Socket.io for live updates
            const socket = io();
            
            socket.on('connect', () => {
                console.log('Connected to server');
                socket.emit('get-stats');
            });
            
            socket.on('stats-update', (stats) => {
                document.getElementById('activeServers').textContent = stats.activeServers;
                document.getElementById('totalUsers').textContent = stats.totalUsers;
                document.getElementById('uptime').textContent = stats.uptime + '%';
            });
            
            // Update stats every 5 seconds
            setInterval(() => socket.emit('get-stats'), 5000);
            
            // Animate numbers
            function animateValue(element, start, end, duration) {
                let startTimestamp = null;
                const step = (timestamp) => {
                    if (!startTimestamp) startTimestamp = timestamp;
                    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                    element.innerHTML = Math.floor(progress * (end - start) + start);
                    if (progress < 1) {
                        window.requestAnimationFrame(step);
                    }
                };
                window.requestAnimationFrame(step);
            }
            
            // Animate initial values
            setTimeout(() => {
                animateValue(document.getElementById('activeServers'), 0, 124, 2000);
                animateValue(document.getElementById('totalUsers'), 0, 567, 2000);
            }, 1000);
        </script>
    </body>
    </html>
  `);
});

// Minecraft hosting page
app.get('/minecraft', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Minecraft Hosting - Zyntrix</title>
        <style>
            body { font-family: Arial; background: #0f172a; color: white; padding: 20px; }
            .container { max-width: 1200px; margin: 0 auto; }
            .plans { display: flex; gap: 20px; margin-top: 30px; flex-wrap: wrap; }
            .plan { background: #1e293b; padding: 30px; border-radius: 15px; flex: 1; min-width: 300px; }
            .plan h3 { color: #4ade80; font-size: 1.5rem; }
            .price { font-size: 2rem; margin: 20px 0; color: #60a5fa; }
            .btn { background: #10b981; color: white; padding: 15px; border: none; border-radius: 8px; cursor: pointer; width: 100%; font-size: 1.1rem; }
            .feature-list { margin: 20px 0; }
            .feature-list li { padding: 8px 0; border-bottom: 1px solid #334155; }
            .server-form { background: #1e293b; padding: 30px; border-radius: 15px; margin-top: 40px; }
            .form-group { margin-bottom: 20px; }
            .form-group label { display: block; margin-bottom: 8px; color: #cbd5e1; }
            .form-group input, .form-group select { width: 100%; padding: 12px; background: #0f172a; border: 1px solid #334155; border-radius: 5px; color: white; }
            .server-ip { background: #0f172a; padding: 15px; border-radius: 8px; font-family: monospace; margin: 20px 0; text-align: center; border: 2px solid #3b82f6; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎮 Minecraft Server Hosting</h1>
            <p>Create your own Minecraft server in seconds</p>
            
            <div class="server-ip">
                <strong>Server IP:</strong> ${DOMAIN}:${PORT}<br>
                <strong>Panel URL:</strong> http://${DOMAIN}:${PORT}/panel
            </div>
            
            <div class="plans">
                <div class="plan">
                    <h3>Basic Plan</h3>
                    <div class="price">$2/month</div>
                    <ul class="feature-list">
                        <li>1GB DDR4 RAM</li>
                        <li>Unlimited Player Slots</li>
                        <li>Basic Plugin Support</li>
                        <li>24/7 Uptime</li>
                        <li>FTP Access</li>
                    </ul>
                    <button class="btn" onclick="showOrderForm('basic')">Order Now</button>
                </div>
                
                <div class="plan">
                    <h3>Premium Plan</h3>
                    <div class="price">$5/month</div>
                    <ul class="feature-list">
                        <li>4GB DDR4 RAM</li>
                        <li>Modpack Support</li>
                        <li>Auto Backups</li>
                        <li>DDoS Protection</li>
                        <li>Priority Support</li>
                    </ul>
                    <button class="btn" onclick="showOrderForm('premium')">Order Now</button>
                </div>
                
                <div class="plan">
                    <h3>Enterprise Plan</h3>
                    <div class="price">$10/month</div>
                    <ul class="feature-list">
                        <li>8GB DDR4 RAM</li>
                        <li>Custom JAR Support</li>
                        <li>Full Database Access</li>
                        <li>24/7 Phone Support</li>
                        <li>Free Domain</li>
                    </ul>
                    <button class="btn" onclick="showOrderForm('enterprise')">Order Now</button>
                </div>
            </div>
            
            <div class="server-form" id="orderForm" style="display: none;">
                <h2>Configure Your Server</h2>
                <form id="serverConfigForm">
                    <div class="form-group">
                        <label>Server Name:</label>
                        <input type="text" id="serverName" placeholder="My Awesome Server" required>
                    </div>
                    <div class="form-group">
                        <label>Minecraft Version:</label>
                        <select id="version">
                            <option>1.20.1 (Latest)</option>
                            <option>1.19.4</option>
                            <option>1.18.2</option>
                            <option>1.17.1</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Server Type:</label>
                        <select id="serverType">
                            <option>Vanilla</option>
                            <option>Spigot</option>
                            <option>Paper</option>
                            <option>Forge (Mods)</option>
                            <option>Bedrock Edition</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Plan:</label>
                        <input type="text" id="selectedPlan" readonly>
                    </div>
                    <button type="submit" class="btn">Create Server Now</button>
                </form>
            </div>
            
            <div id="serverCreated" style="display: none; background: #10b981; padding: 20px; border-radius: 10px; margin-top: 20px;">
                <h3>✅ Server Created Successfully!</h3>
                <p id="serverDetails"></p>
                <button class="btn" onclick="window.location.href='/panel'">Go to Control Panel</button>
            </div>
        </div>
        
        <script>
            function showOrderForm(plan) {
                document.getElementById('orderForm').style.display = 'block';
                document.getElementById('selectedPlan').value = plan.charAt(0).toUpperCase() + plan.slice(1);
                window.scrollTo(0, document.getElementById('orderForm').offsetTop);
            }
            
            document.getElementById('serverConfigForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const serverData = {
                    name: document.getElementById('serverName').value,
                    version: document.getElementById('version').value,
                    type: document.getElementById('serverType').value,
                    plan: document.getElementById('selectedPlan').value
                };
                
                try {
                    const response = await fetch('/api/create-minecraft', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify(serverData)
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        document.getElementById('orderForm').style.display = 'none';
                        document.getElementById('serverCreated').style.display = 'block';
                        document.getElementById('serverDetails').innerHTML = \`
                            <strong>Server ID:</strong> \${data.serverId}<br>
                            <strong>Connect IP:</strong> \${data.ip}:${data.port}<br>
                            <strong>Panel URL:</strong> <a href="/panel/\${data.serverId}" style="color: white;">/panel/\${data.serverId}</a><br>
                            <strong>FTP Info:</strong> ftp://\${DOMAIN}:21 (Username: \${data.ftpUser})
                        \`;
                    }
                } catch (error) {
                    alert('Error creating server: ' + error.message);
                }
            });
        </script>
    </body>
    </html>
  `);
});

// VPS hosting page
app.get('/vps', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>VPS Hosting - Zyntrix</title>
    <style>body{background:#0f172a;color:white;padding:20px;font-family:Arial;}</style>
    </head>
    <body>
        <h1>🖥️ VPS Hosting</h1>
        <p>Running on: ${DOMAIN}:${PORT}</p>
        <p>Full root access, SSD storage, multiple OS options</p>
        <button onclick="alert('VPS ordering coming soon!')">Order VPS</button>
    </body>
    </html>
  `);
});

// Web hosting page
app.get('/web', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>Web Hosting - Zyntrix</title>
    <style>body{background:#0f172a;color:white;padding:20px;font-family:Arial;}</style>
    </head>
    <body>
        <h1>🌐 Web Hosting</h1>
        <p>Running on: ${DOMAIN}:${PORT}</p>
        <p>NGINX, PHP, MySQL, free SSL</p>
        <button onclick="alert('Web hosting ordering coming soon!')">Order Web Hosting</button>
    </body>
    </html>
  `);
});

// Control Panel
app.get('/panel', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>Control Panel - Zyntrix</title>
    <style>
        body{background:#0f172a;color:white;font-family:Arial;padding:20px;}
        .server-list{display:grid;gap:20px;margin-top:20px;}
        .server{background:#1e293b;padding:20px;border-radius:10px;}
        .actions button{margin:5px;padding:10px;background:#3b82f6;color:white;border:none;border-radius:5px;cursor:pointer;}
    </style>
    </head>
    <body>
        <h1>Control Panel</h1>
        <p>Manage your servers on ${DOMAIN}:${PORT}</p>
        <div id="servers" class="server-list"></div>
        <script>
            async function loadServers() {
                const res = await fetch('/api/my-servers');
                const servers = await res.json();
                const container = document.getElementById('servers');
                container.innerHTML = servers.map(s => \`
                    <div class="server">
                        <h3>\${s.name}</h3>
                        <p>Status: <span style="color:\${s.online?'#10b981':'#ef4444'}">\${s.online?'Online':'Offline'}</span></p>
                        <p>IP: \${s.ip}:\${s.port}</p>
                        <div class="actions">
                            <button onclick="controlServer('\${s.id}', 'start')">Start</button>
                            <button onclick="controlServer('\${s.id}', 'stop')">Stop</button>
                            <button onclick="controlServer('\${s.id}', 'restart')">Restart</button>
                            <button onclick="window.location.href='/panel/\${s.id}'">Manage</button>
                        </div>
                    </div>
                \`).join('');
            }
            loadServers();
            setInterval(loadServers, 10000);
        </script>
    </body>
    </html>
  `);
});

// Admin Panel
app.get('/admin', requireAuth, (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>Admin Panel - Zyntrix</title>
    <style>
        body{background:#0f172a;color:white;font-family:monospace;padding:20px;}
        .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin:20px 0;}
        .stat-box{background:#1e293b;padding:20px;border-radius:10px;text-align:center;}
        .stat-value{font-size:2em;color:#60a5fa;}
    </style>
    </head>
    <body>
        <h1>🔧 Admin Panel - ${DOMAIN}:${PORT}</h1>
        <div class="stats">
            <div class="stat-box"><div class="stat-value">${servers.size}</div>Active Servers</div>
            <div class="stat-box"><div class="stat-value">${users.size}</div>Total Users</div>
            <div class="stat-box"><div class="stat-value">${PORT}</div>Port</div>
        </div>
        <h3>Server Management</h3>
        <button onclick="createTestServer()">Create Test Server</button>
        <button onclick="clearAllServers()">Clear All</button>
        <div id="serverList"></div>
        <script>
            function createTestServer() {
                fetch('/api/create-test-server', {method: 'POST'})
                    .then(r => r.json())
                    .then(data => alert('Server created: ' + data.serverId));
            }
            function clearAllServers() {
                if(confirm('Clear all servers?')) {
                    fetch('/api/clear-servers', {method: 'POST'});
                }
            }
        </script>
    </body>
    </html>
  `);
});

// API Endpoints
app.post('/api/create-minecraft', (req, res) => {
  const { name, version, type, plan } = req.body;
  const serverId = 'mc-' + Date.now();
  const port = Math.floor(Math.random() * 1000) + 25000;
  
  servers.set(serverId, {
    id: serverId,
    name,
    version,
    type,
    plan,
    port,
    ip: DOMAIN,
    online: true,
    created: new Date().toISOString()
  });
  
  io.emit('server-created', { serverId, name });
  
  res.json({
    success: true,
    serverId,
    name,
    ip: DOMAIN,
    port,
    ftpUser: 'user_' + serverId,
    message: `Server created on ${DOMAIN}:${port}`
  });
});

app.get('/api/my-servers', (req, res) => {
  res.json(Array.from(servers.values()));
});

app.post('/api/control-server', (req, res) => {
  const { serverId, action } = req.body;
  const server = servers.get(serverId);
  if (server) {
    server.online = action === 'start' || action === 'restart';
    io.emit('server-update', { serverId, action, online: server.online });
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Server not found' });
  }
});

app.post('/api/create-test-server', requireAuth, (req, res) => {
  const serverId = 'test-' + Date.now();
  servers.set(serverId, {
    id: serverId,
    name: 'Test Server',
    type: 'Test',
    online: true,
    created: new Date().toISOString()
  });
  res.json({ success: true, serverId });
});

app.post('/api/clear-servers', requireAuth, (req, res) => {
  servers.clear();
  res.json({ success: true, cleared: true });
});

// WebSocket events
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.emit('stats-update', {
    activeServers: servers.size,
    totalUsers: users.size,
    uptime: 99.9
  });
  
  socket.on('get-stats', () => {
    socket.emit('stats-update', {
      activeServers: servers.size,
      totalUsers: users.size,
      uptime: 99.9
    });
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
server.listen(PORT, HOST, () => {
  console.log(`🚀 Zyntrix Hosting Platform running at:`);
  console.log(`   Local: http://localhost:${PORT}`);
  console.log(`   Network: http://${DOMAIN}:${PORT}`);
  console.log(`   Minecraft Page: http://${DOMAIN}:${PORT}/minecraft`);
  console.log(`   Admin Panel: http://${DOMAIN}:${PORT}/admin?password=admin123`);
  console.log(`   Control Panel: http://${DOMAIN}:${PORT}/panel`);
  console.log(`\n📊 Monitoring: http://${DOMAIN}:${PORT}/api/my-servers`);
});

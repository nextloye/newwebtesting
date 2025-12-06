require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const app = express();
const PORT = process.env.PORT || 25569;

// Database simulation (in production use MongoDB/MySQL)
let users = [];
let orders = [];
let invoices = [];
let servers = [];
let tickets = [];
let announcements = [];

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: process.env.SESSION_SECRET || 'creepercastle-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
};

const requireAdmin = (req, res, next) => {
    const user = users.find(u => u.id === req.session.userId);
    if (!user || user.role !== 'admin') {
        return res.status(403).send('Access denied');
    }
    next();
};

// ==================== ROUTES ====================

// Homepage - EXACT COPY of CreeperCastle
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CreeperCastle - Minecraft & Game Server Hosting</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --primary: #8b5cf6;
            --primary-dark: #7c3aed;
            --secondary: #10b981;
            --dark: #0f172a;
            --darker: #020617;
        }
        .gradient-bg {
            background: linear-gradient(135deg, var(--darker) 0%, var(--dark) 100%);
        }
        .card-hover {
            transition: all 0.3s ease;
            border: 1px solid #1e293b;
        }
        .card-hover:hover {
            transform: translateY(-5px);
            border-color: var(--primary);
            box-shadow: 0 20px 40px rgba(139, 92, 246, 0.15);
        }
        .btn-primary {
            background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
        }
        .btn-primary:hover {
            background: linear-gradient(135deg, var(--primary-dark) 0%, #6d28d9 100%);
        }
        .stat-card {
            background: rgba(30, 41, 59, 0.5);
            backdrop-filter: blur(10px);
        }
        .sidebar {
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(20px);
        }
        .nav-link.active {
            background: rgba(139, 92, 246, 0.2);
            border-left: 4px solid var(--primary);
        }
        .progress-bar {
            background: linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%);
        }
    </style>
</head>
<body class="gradient-bg min-h-screen text-gray-100">
    <!-- Navigation -->
    <nav class="border-b border-gray-800">
        <div class="container mx-auto px-4 py-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-8">
                    <div class="flex items-center space-x-2">
                        <div class="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                            <i class="fas fa-castle text-white"></i>
                        </div>
                        <span class="text-xl font-bold">CreeperCastle</span>
                    </div>
                    <div class="hidden md:flex space-x-6">
                        <a href="/" class="hover:text-purple-400 font-medium">Home</a>
                        <a href="/minecraft" class="hover:text-purple-400 font-medium">Minecraft</a>
                        <a href="/vps" class="hover:text-purple-400 font-medium">VPS</a>
                        <a href="/web-hosting" class="hover:text-purple-400 font-medium">Web Hosting</a>
                        <a href="/bot-hosting" class="hover:text-purple-400 font-medium">Bot Hosting</a>
                        <a href="/pricing" class="hover:text-purple-400 font-medium">Pricing</a>
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    ${req.session.userId ? `
                        <a href="/client" class="hover:text-purple-400">
                            <i class="fas fa-user-circle text-xl"></i>
                        </a>
                        <a href="/logout" class="btn-primary px-6 py-2 rounded-lg font-medium">
                            Logout
                        </a>
                    ` : `
                        <a href="/login" class="hover:text-purple-400">Login</a>
                        <a href="/register" class="btn-primary px-6 py-2 rounded-lg font-medium">
                            Sign Up
                        </a>
                    `}
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <section class="py-20 px-4">
        <div class="container mx-auto text-center">
            <h1 class="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                <span class="bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent">
                    Premium Game Server Hosting
                </span>
            </h1>
            <p class="text-xl text-gray-300 mb-10 max-w-3xl mx-auto">
                High-performance Minecraft, VPS, and web hosting with 24/7 support, 
                DDoS protection, and instant setup.
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="/minecraft" class="btn-primary px-8 py-4 rounded-lg font-bold text-lg hover:shadow-2xl hover:shadow-purple-500/30 transition-all">
                    <i class="fas fa-bolt mr-2"></i> Get Started
                </a>
                <a href="/pricing" class="bg-gray-800 hover:bg-gray-700 px-8 py-4 rounded-lg font-bold text-lg border border-gray-700">
                    View Pricing
                </a>
            </div>
        </div>
    </section>

    <!-- Stats -->
    <div class="container mx-auto px-4 mb-16">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div class="stat-card p-6 rounded-2xl text-center">
                <div class="text-3xl font-bold text-emerald-400">1,250+</div>
                <div class="text-gray-400">Active Servers</div>
            </div>
            <div class="stat-card p-6 rounded-2xl text-center">
                <div class="text-3xl font-bold text-purple-400">99.9%</div>
                <div class="text-gray-400">Uptime</div>
            </div>
            <div class="stat-card p-6 rounded-2xl text-center">
                <div class="text-3xl font-bold text-cyan-400">24/7</div>
                <div class="text-gray-400">Support</div>
            </div>
            <div class="stat-card p-6 rounded-2xl text-center">
                <div class="text-3xl font-bold text-orange-400">50+</div>
                <div class="text-gray-400">Countries</div>
            </div>
        </div>
    </div>

    <!-- Services -->
    <section class="container mx-auto px-4 mb-20">
        <h2 class="text-4xl font-bold text-center mb-12">Our Services</h2>
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <!-- Minecraft -->
            <div class="card-hover bg-gray-900/50 p-8 rounded-2xl">
                <div class="w-14 h-14 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6">
                    <i class="fas fa-cube text-2xl text-purple-400"></i>
                </div>
                <h3 class="text-xl font-bold mb-4">Minecraft Hosting</h3>
                <p class="text-gray-400 mb-6">High-performance Minecraft servers with mod support.</p>
                <ul class="space-y-3 mb-8">
                    <li class="flex items-center"><i class="fas fa-check text-emerald-400 mr-3"></i> Instant Setup</li>
                    <li class="flex items-center"><i class="fas fa-check text-emerald-400 mr-3"></i> Modpack Support</li>
                    <li class="flex items-center"><i class="fas fa-check text-emerald-400 mr-3"></i> DDoS Protection</li>
                </ul>
                <a href="/minecraft" class="inline-flex items-center text-purple-400 font-medium">
                    Learn More <i class="fas fa-arrow-right ml-2"></i>
                </a>
            </div>

            <!-- VPS -->
            <div class="card-hover bg-gray-900/50 p-8 rounded-2xl">
                <div class="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6">
                    <i class="fas fa-server text-2xl text-blue-400"></i>
                </div>
                <h3 class="text-xl font-bold mb-4">VPS Hosting</h3>
                <p class="text-gray-400 mb-6">Virtual Private Servers with full root access.</p>
                <ul class="space-y-3 mb-8">
                    <li class="flex items-center"><i class="fas fa-check text-emerald-400 mr-3"></i> Full Root Access</li>
                    <li class="flex items-center"><i class="fas fa-check text-emerald-400 mr-3"></i> SSD Storage</li>
                    <li class="flex items-center"><i class="fas fa-check text-emerald-400 mr-3"></i> 24/7 Monitoring</li>
                </ul>
                <a href="/vps" class="inline-flex items-center text-blue-400 font-medium">
                    Learn More <i class="fas fa-arrow-right ml-2"></i>
                </a>
            </div>

            <!-- Web Hosting -->
            <div class="card-hover bg-gray-900/50 p-8 rounded-2xl">
                <div class="w-14 h-14 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-6">
                    <i class="fas fa-globe text-2xl text-cyan-400"></i>
                </div>
                <h3 class="text-xl font-bold mb-4">Web Hosting</h3>
                <p class="text-gray-400 mb-6">NGINX web hosting with cPanel.</p>
                <ul class="space-y-3 mb-8">
                    <li class="flex items-center"><i class="fas fa-check text-emerald-400 mr-3"></i> Free SSL</li>
                    <li class="flex items-center"><i class="fas fa-check text-emerald-400 mr-3"></i> Unlimited Bandwidth</li>
                    <li class="flex items-center"><i class="fas fa-check text-emerald-400 mr-3"></i> cPanel Included</li>
                </ul>
                <a href="/web-hosting" class="inline-flex items-center text-cyan-400 font-medium">
                    Learn More <i class="fas fa-arrow-right ml-2"></i>
                </a>
            </div>

            <!-- Bot Hosting -->
            <div class="card-hover bg-gray-900/50 p-8 rounded-2xl">
                <div class="w-14 h-14 bg-pink-500/20 rounded-xl flex items-center justify-center mb-6">
                    <i class="fab fa-discord text-2xl text-pink-400"></i>
                </div>
                <h3 class="text-xl font-bold mb-4">Bot Hosting</h3>
                <p class="text-gray-400 mb-6">24/7 Discord bot hosting.</p>
                <ul class="space-y-3 mb-8">
                    <li class="flex items-center"><i class="fas fa-check text-emerald-400 mr-3"></i> Always Online</li>
                    <li class="flex items-center"><i class="fas fa-check text-emerald-400 mr-3"></i> Auto Restart</li>
                    <li class="flex items-center"><i class="fas fa-check text-emerald-400 mr-3"></i> Database Included</li>
                </ul>
                <a href="/bot-hosting" class="inline-flex items-center text-pink-400 font-medium">
                    Learn More <i class="fas fa-arrow-right ml-2"></i>
                </a>
            </div>
        </div>
    </section>

    <!-- Pricing -->
    <section class="py-20 px-4 bg-black/30">
        <div class="container mx-auto">
            <h2 class="text-4xl font-bold text-center mb-4">Simple, Transparent Pricing</h2>
            <p class="text-gray-400 text-center mb-12">No hidden fees. Cancel anytime.</p>
            
            <div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                <!-- Basic -->
                <div class="card-hover bg-gray-900/50 p-8 rounded-2xl relative">
                    <div class="absolute top-0 right-0 bg-purple-600 text-white px-4 py-1 rounded-bl-lg rounded-tr-2xl">
                        Popular
                    </div>
                    <h3 class="text-2xl font-bold mb-4">Basic</h3>
                    <div class="mb-6">
                        <span class="text-4xl font-bold">$5</span>
                        <span class="text-gray-400">/month</span>
                    </div>
                    <ul class="space-y-4 mb-8">
                        <li class="flex items-center"><i class="fas fa-check text-emerald-400 mr-3"></i> 2GB RAM</li>
                        <li class="flex items-center"><i class="fas fa-check text-emerald-400 mr-3"></i> 20GB SSD</li>
                        <li class="flex items-center"><i class="fas fa-check text-emerald-400 mr-3"></i> Unlimited Players</li>
                        <li class="flex items-center"><i class="fas fa-check text-emerald-400 mr-3"></i> Basic Support</li>
                    </ul>
                    <a href="/order/minecraft/basic" class="btn-primary w-full py-3 rounded-lg font-bold text-center block">
                        Get Started
                    </a>
                </div>

                <!-- Premium -->
                <div class="card-hover bg-gray-900/50 p-8 rounded-2xl border-2 border-purple-500 relative">
                    <div class="absolute top-0 right-0 bg-emerald-600 text-white px-4 py-1 rounded-bl-lg rounded-tr-2xl">
                        Best Value
                    </div>
                    <h3 class="text-2xl font-bold mb-4">Premium</h3>
                    <div class="mb-6">
                        <span class="text-4xl font-bold">$10</span>
                        <span class="text-gray-400">/month</span>
                    </div>
                    <ul class="space-y-4 mb-8">
                        <li class="flex items-center"><i class="fas fa-check text-emerald-400 mr-3"></i> 4GB RAM</li>
                        <li class="flex items-center"><i class="fas fa-check text-emerald-400 mr-3"></i> 40GB SSD</li>
                        <li class="flex items-center"><i class="fas fa-check text-emerald-400 mr-3"></i> Modpack Support</li>
                        <li class="flex items-center"><i class="fas fa-check text-emerald-400 mr-3"></i> Priority Support</li>
                        <li class="flex items-center"><i class="fas fa-check text-emerald-400 mr-3"></i> Auto Backups</li>
                    </ul>
                    <a href="/order/minecraft/premium" class="btn-primary w-full py-3 rounded-lg font-bold text-center block">
                        Get Started
                    </a>
                </div>

                <!-- Enterprise -->
                <div class="card-hover bg-gray-900/50 p-8 rounded-2xl">
                    <h3 class="text-2xl font-bold mb-4">Enterprise</h3>
                    <div class="mb-6">
                        <span class="text-4xl font-bold">$20</span>
                        <span class="text-gray-400">/month</span>
                    </div>
                    <ul class="space-y-4 mb-8">
                        <li class="flex items-center"><i class="fas fa-check text-emerald-400 mr-3"></i> 8GB RAM</li>
                        <li class="flex items-center"><i class="fas fa-check text-emerald-400 mr-3"></i> 80GB NVMe</li>
                        <li class="flex items-center"><i class="fas fa-check text-emerald-400 mr-3"></i> DDoS Protection</li>
                        <li class="flex items-center"><i class="fas fa-check text-emerald-400 mr-3"></i> 24/7 Phone Support</li>
                        <li class="flex items-center"><i class="fas fa-check text-emerald-400 mr-3"></i> Dedicated IP</li>
                    </ul>
                    <a href="/order/minecraft/enterprise" class="btn-primary w-full py-3 rounded-lg font-bold text-center block">
                        Get Started
                    </a>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-gray-800 mt-20 py-10 px-4">
        <div class="container mx-auto">
            <div class="grid md:grid-cols-4 gap-8">
                <div>
                    <div class="flex items-center space-x-2 mb-4">
                        <div class="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                            <i class="fas fa-castle text-white"></i>
                        </div>
                        <span class="text-xl font-bold">CreeperCastle</span>
                    </div>
                    <p class="text-gray-400">Premium game server hosting since 2020.</p>
                </div>
                <div>
                    <h4 class="font-bold mb-4">Services</h4>
                    <ul class="space-y-2 text-gray-400">
                        <li><a href="/minecraft" class="hover:text-white">Minecraft Hosting</a></li>
                        <li><a href="/vps" class="hover:text-white">VPS Hosting</a></li>
                        <li><a href="/web-hosting" class="hover:text-white">Web Hosting</a></li>
                        <li><a href="/bot-hosting" class="hover:text-white">Bot Hosting</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-bold mb-4">Company</h4>
                    <ul class="space-y-2 text-gray-400">
                        <li><a href="/about" class="hover:text-white">About Us</a></li>
                        <li><a href="/tos" class="hover:text-white">Terms of Service</a></li>
                        <li><a href="/privacy" class="hover:text-white">Privacy Policy</a></li>
                        <li><a href="/contact" class="hover:text-white">Contact</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-bold mb-4">Connect</h4>
                    <div class="flex space-x-4">
                        <a href="#" class="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-purple-600">
                            <i class="fab fa-discord"></i>
                        </a>
                        <a href="#" class="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-500">
                            <i class="fab fa-twitter"></i>
                        </a>
                        <a href="#" class="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-pink-600">
                            <i class="fab fa-instagram"></i>
                        </a>
                    </div>
                </div>
            </div>
            <div class="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500">
                <p>&copy; 2024 CreeperCastle. All rights reserved.</p>
            </div>
        </div>
    </footer>
</body>
</html>
    `);
});

// ==================== CLIENT AREA ====================
app.get('/client', requireAuth, (req, res) => {
    const user = users.find(u => u.id === req.session.userId);
    const userServers = servers.filter(s => s.userId === req.session.userId);
    const userInvoices = invoices.filter(i => i.userId === req.session.userId);
    
    res.send(`
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Client Area - CreeperCastle</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        .sidebar {
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(20px);
            height: calc(100vh - 4rem);
        }
        .nav-link {
            padding: 0.75rem 1rem;
            border-radius: 0.5rem;
            transition: all 0.2s;
        }
        .nav-link:hover {
            background: rgba(139, 92, 246, 0.1);
        }
        .nav-link.active {
            background: rgba(139, 92, 246, 0.2);
            border-left: 4px solid #8b5cf6;
        }
        .stat-card {
            background: rgba(30, 41, 59, 0.5);
            backdrop-filter: blur(10px);
        }
        .table-row:hover {
            background: rgba(139, 92, 246, 0.05);
        }
    </style>
</head>
<body class="bg-gray-950 text-gray-100">
    <!-- Top Bar -->
    <nav class="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                    <i class="fas fa-castle text-white"></i>
                </div>
                <span class="text-xl font-bold">CreeperCastle</span>
                <span class="text-gray-400">/ Client Area</span>
            </div>
            <div class="flex items-center space-x-4">
                <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                        ${user?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                        <div class="font-medium">${user?.username || 'User'}</div>
                        <div class="text-xs text-gray-400">${user?.role || 'Client'}</div>
                    </div>
                </div>
                <a href="/logout" class="text-gray-400 hover:text-white">
                    <i class="fas fa-sign-out-alt"></i>
                </a>
            </div>
        </div>
    </nav>

    <div class="flex">
        <!-- Sidebar -->
        <div class="sidebar w-64 border-r border-gray-800 p-6">
            <div class="space-y-2">
                <a href="/client" class="nav-link active flex items-center space-x-3">
                    <i class="fas fa-tachometer-alt w-5"></i>
                    <span>Dashboard</span>
                </a>
                <a href="/client/servers" class="nav-link flex items-center space-x-3">
                    <i class="fas fa-server w-5"></i>
                    <span>My Servers</span>
                    <span class="ml-auto bg-purple-600 text-xs px-2 py-1 rounded">${userServers.length}</span>
                </a>
                <a href="/client/services" class="nav-link flex items-center space-x-3">
                    <i class="fas fa-cube w-5"></i>
                    <span>Services</span>
                </a>
                <a href="/client/invoices" class="nav-link flex items-center space-x-3">
                    <i class="fas fa-file-invoice-dollar w-5"></i>
                    <span>Invoices</span>
                    <span class="ml-auto bg-red-500 text-xs px-2 py-1 rounded">${userInvoices.filter(i => i.status === 'unpaid').length}</span>
                </a>
                <a href="/client/tickets" class="nav-link flex items-center space-x-3">
                    <i class="fas fa-ticket-alt w-5"></i>
                    <span>Support Tickets</span>
                </a>
                <a href="/client/settings" class="nav-link flex items-center space-x-3">
                    <i class="fas fa-cog w-5"></i>
                    <span>Settings</span>
                </a>
                ${user?.role === 'admin' ? `
                <div class="pt-8 border-t border-gray-800">
                    <div class="text-xs uppercase text-gray-500 mb-2">Admin</div>
                    <a href="/admin" class="nav-link flex items-center space-x-3 text-purple-400">
                        <i class="fas fa-shield-alt w-5"></i>
                        <span>Admin Panel</span>
                    </a>
                </div>
                ` : ''}
            </div>
        </div>

        <!-- Main Content -->
        <div class="flex-1 p-8">
            <!-- Welcome -->
            <div class="mb-8">
                <h1 class="text-3xl font-bold mb-2">Welcome back, ${user?.username}!</h1>
                <p class="text-gray-400">Here's what's happening with your services today.</p>
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div class="stat-card p-6 rounded-xl">
                    <div class="flex items-center justify-between mb-4">
                        <div>
                            <div class="text-2xl font-bold">${userServers.length}</div>
                            <div class="text-gray-400">Active Services</div>
                        </div>
                        <div class="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                            <i class="fas fa-server text-purple-400"></i>
                        </div>
                    </div>
                    <a href="/client/servers" class="text-purple-400 text-sm hover:underline">View all →</a>
                </div>

                <div class="stat-card p-6 rounded-xl">
                    <div class="flex items-center justify-between mb-4">
                        <div>
                            <div class="text-2xl font-bold">$${userInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0)}</div>
                            <div class="text-gray-400">Total Spent</div>
                        </div>
                        <div class="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                            <i class="fas fa-dollar-sign text-emerald-400"></i>
                        </div>
                    </div>
                    <a href="/client/invoices" class="text-emerald-400 text-sm hover:underline">View invoices →</a>
                </div>

                <div class="stat-card p-6 rounded-xl">
                    <div class="flex items-center justify-between mb-4">
                        <div>
                            <div class="text-2xl font-bold">${userInvoices.filter(i => i.status === 'unpaid').length}</div>
                            <div class="text-gray-400">Pending Invoices</div>
                        </div>
                        <div class="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                            <i class="fas fa-exclamation-triangle text-red-400"></i>
                        </div>
                    </div>
                    <a href="/client/invoices" class="text-red-400 text-sm hover:underline">Pay now →</a>
                </div>
            </div>

            <!-- Recent Services -->
            <div class="bg-gray-900/50 rounded-xl border border-gray-800 p-6 mb-8">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-xl font-bold">Recent Services</h2>
                    <a href="/client/servers" class="text-purple-400 text-sm hover:underline">View All</a>
                </div>
                ${userServers.length > 0 ? `
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead>
                            <tr class="text-left text-gray-400 border-b border-gray-800">
                                <th class="pb-3">Service</th>
                                <th class="pb-3">Plan</th>
                                <th class="pb-3">Status</th>
                                <th class="pb-3">Next Due</th>
                                <th class="pb-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${userServers.slice(0, 5).map(server => `
                            <tr class="table-row border-b border-gray-800/50">
                                <td class="py-4">
                                    <div class="font-medium">${server.name}</div>
                                    <div class="text-sm text-gray-400">${server.ip}:${server.port}</div>
                                </td>
                                <td class="py-4">${server.plan}</td>
                                <td class="py-4">
                                    <span class="px-3 py-1 rounded-full text-xs ${server.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}">
                                        ${server.status}
                                    </span>
                                </td>
                                <td class="py-4">${new Date(server.nextDue).toLocaleDateString()}</td>
                                <td class="py-4">
                                    <a href="/client/server/${server.id}" class="text-purple-400 hover:text-purple-300 mr-3">
                                        <i class="fas fa-cog"></i>
                                    </a>
                                    <a href="#" class="text-gray-400 hover:text-white">
                                        <i class="fas fa-play"></i>
                                    </a>
                                </td>
                            </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                ` : `
                <div class="text-center py-8">
                    <div class="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-server text-2xl text-gray-600"></i>
                    </div>
                    <h3 class="text-lg font-medium mb-2">No services yet</h3>
                    <p class="text-gray-400 mb-4">Get started by ordering your first server!</p>
                    <a href="/minecraft" class="inline-block bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg">
                        Order Service
                    </a>
                </div>
                `}
            </div>

            <!-- Recent Invoices -->
            <div class="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-xl font-bold">Recent Invoices</h2>
                    <a href="/client/invoices" class="text-purple-400 text-sm hover:underline">View All</a>
                </div>
                ${userInvoices.length > 0 ? `
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead>
                            <tr class="text-left text-gray-400 border-b border-gray-800">
                                <th class="pb-3">Invoice #</th>
                                <th class="pb-3">Date</th>
                                <th class="pb-3">Amount</th>
                                <th class="pb-3">Status</th>
                                <th class="pb-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${userInvoices.slice(0, 5).map(invoice => `
                            <tr class="table-row border-b border-gray-800/50">
                                <td class="py-4 font-medium">#${invoice.id}</td>
                                <td class="py-4">${new Date(invoice.date).toLocaleDateString()}</td>
                                <td class="py-4">$${invoice.amount}</td>
                                <td class="py-4">
                                    <span class="px-3 py-1 rounded-full text-xs ${invoice.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}">
                                        ${invoice.status}
                                    </span>
                                </td>
                                <td class="py-4">
                                    ${invoice.status === 'unpaid' ? `
                                    <a href="/client/pay/${invoice.id}" class="bg-emerald-600 hover:bg-emerald-700 px-4 py-1 rounded text-sm">
                                        Pay Now
                                    </a>
                                    ` : ''}
                                    <a href="/client/invoice/${invoice.id}" class="text-gray-400 hover:text-white ml-3">
                                        <i class="fas fa-eye"></i>
                                    </a>
                                </td>
                            </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                ` : `
                <div class="text-center py-8">
                    <div class="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-file-invoice text-2xl text-gray-600"></i>
                    </div>
                    <p class="text-gray-400">No invoices yet</p>
                </div>
                `}
            </div>
        </div>
    </div>
</body>
</html>
    `);
});

// ==================== ADMIN PANEL ====================
app.get('/admin', requireAdmin, (req, res) => {
    const stats = {
        totalUsers: users.length,
        totalOrders: orders.length,
        totalRevenue: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0),
        activeServers: servers.filter(s => s.status === 'active').length,
        pendingTickets: tickets.filter(t => t.status === 'open').length,
        monthlyRevenue: invoices
            .filter(i => i.status === 'paid' && new Date(i.date) > new Date(Date.now() - 30*24*60*60*1000))
            .reduce((sum, i) => sum + i.amount, 0)
    };
    
    res.send(`
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Panel - CreeperCastle</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        .sidebar {
            background: rgba(15, 23, 42, 0.98);
            backdrop-filter: blur(20px);
            height: calc(100vh - 4rem);
        }
        .nav-link {
            padding: 0.75rem 1rem;
            border-radius: 0.5rem;
            transition: all 0.2s;
        }
        .nav-link:hover {
            background: rgba(139, 92, 246, 0.1);
        }
        .nav-link.active {
            background: rgba(139, 92, 246, 0.2);
            border-left: 4px solid #8b5cf6;
        }
        .stat-card {
            background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .table-row:hover {
            background: rgba(139, 92, 246, 0.05);
        }
        .gradient-text {
            background: linear-gradient(135deg, #8b5cf6 0%, #10b981 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
    </style>
</head>
<body class="bg-gray-950 text-gray-100">
    <!-- Top Bar -->
    <nav class="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                    <i class="fas fa-shield-alt text-white"></i>
                </div>
                <span class="text-xl font-bold">CreeperCastle</span>
                <span class="text-gray-400">/ Admin Panel</span>
            </div>
            <div class="flex items-center space-x-4">
                <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                        <i class="fas fa-user-cog"></i>
                    </div>
                    <div>
                        <div class="font-medium">Administrator</div>
                        <div class="text-xs text-gray-400">Super Admin</div>
                    </div>
                </div>
                <a href="/logout" class="text-gray-400 hover:text-white">
                    <i class="fas fa-sign-out-alt"></i>
                </a>
            </div>
        </div>
    </nav>

    <div class="flex">
        <!-- Sidebar -->
        <div class="sidebar w-64 border-r border-gray-800 p-6">
            <div class="space-y-2">
                <a href="/admin" class="nav-link active flex items-center space-x-3">
                    <i class="fas fa-tachometer-alt w-5"></i>
                    <span>Dashboard</span>
                </a>
                <a href="/admin/users" class="nav-link flex items-center space-x-3">
                    <i class="fas fa-users w-5"></i>
                    <span>Users</span>
                    <span class="ml-auto bg-blue-500 text-xs px-2 py-1 rounded">${stats.totalUsers}</span>
                </a>
                <a href="/admin/orders" class="nav-link flex items-center space-x-3">
                    <i class="fas fa-shopping-cart w-5"></i>
                    <span>Orders</span>
                    <span class="ml-auto bg-emerald-500 text-xs px-2 py-1 rounded">${stats.totalOrders}</span>
                </a>
                <a href="/admin/servers" class="nav-link flex items-center space-x-3">
                    <i class="fas fa-server w-5"></i>
                    <span>Servers</span>
                    <span class="ml-auto bg-purple-500 text-xs px-2 py-1 rounded">${stats.activeServers}</span>
                </a>
                <a href="/admin/invoices" class="nav-link flex items-center space-x-3">
                    <i class="fas fa-file-invoice-dollar w-5"></i>
                    <span>Invoices</span>
                </a>
                <a href="/admin/tickets" class="nav-link flex items-center space-x-3">
                    <i class="fas fa-ticket-alt w-5"></i>
                    <span>Support Tickets</span>
                    <span class="ml-auto bg-orange-500 text-xs px-2 py-1 rounded">${stats.pendingTickets}</span>
                </a>
                <a href="/admin/finance" class="nav-link flex items-center space-x-3">
                    <i class="fas fa-chart-line w-5"></i>
                    <span>Financial Reports</span>
                </a>
                <a href="/admin/settings" class="nav-link flex items-center space-x-3">
                    <i class="fas fa-cogs w-5"></i>
                    <span>System Settings</span>
                </a>
                <a href="/admin/announcements" class="nav-link flex items-center space-x-3">
                    <i class="fas fa-bullhorn w-5"></i>
                    <span>Announcements</span>
                </a>
                <div class="pt-8 border-t border-gray-800">
                    <a href="/client" class="nav-link flex items-center space-x-3">
                        <i class="fas fa-arrow-left w-5"></i>
                        <span>Back to Client Area</span>
                    </a>
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="flex-1 p-8">
            <!-- Header -->
            <div class="mb-8">
                <h1 class="text-3xl font-bold mb-2">Admin Dashboard</h1>
                <p class="text-gray-400">Welcome to the CreeperCastle administration panel.</p>
            </div>

            <!-- Stats Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div class="stat-card p-6 rounded-xl">
                    <div class="flex items-center justify-between">
                        <div>
                            <div class="text-2xl font-bold">$${stats.totalRevenue.toFixed(2)}</div>
                            <div class="text-gray-400">Total Revenue</div>
                        </div>
                        <div class="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                            <i class="fas fa-dollar-sign text-emerald-400 text-xl"></i>
                        </div>
                    </div>
                    <div class="mt-4">
                        <div class="flex justify-between text-sm mb-1">
                            <span>Monthly: $${stats.monthlyRevenue.toFixed(2)}</span>
                            <span>+12.5%</span>
                        </div>
                        <div class="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div class="h-full bg-emerald-500 rounded-full" style="width: 75%"></div>
                        </div>
                    </div>
                </div>

                <div class="stat-card p-6 rounded-xl">
                    <div class="flex items-center justify-between">
                        <div>
                            <div class="text-2xl font-bold">${stats.totalUsers}</div>
                            <div class="text-gray-400">Total Users</div>
                        </div>
                        <div class="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                            <i class="fas fa-users text-blue-400 text-xl"></i>
                        </div>
                    </div>
                    <div class="mt-4">
                        <div class="flex justify-between text-sm mb-1">
                            <span>Active Today: ${Math.floor(stats.totalUsers * 0.3)}</span>
                            <span class="text-emerald-400">+5.2%</span>
                        </div>
                        <div class="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div class="h-full bg-blue-500 rounded-full" style="width: 45%"></div>
                        </div>
                    </div>
                </div>

                <div class="stat-card p-6 rounded-xl">
                    <div class="flex items-center justify-between">
                        <div>
                            <div class="text-2xl font-bold">${stats.activeServers}</div>
                            <div class="text-gray-400">Active Servers</div>
                        </div>
                        <div class="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                            <i class="fas fa-server text-purple-400 text-xl"></i>
                        </div>
                    </div>
                    <div class="mt-4">
                        <div class="flex justify-between text-sm mb-1">
                            <span>Online: ${stats.activeServers}</span>
                            <span class="text-emerald-400">100%</span>
                        </div>
                        <div class="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div class="h-full bg-purple-500 rounded-full" style="width: 100%"></div>
                        </div>
                    </div>
                </div>

                <div class="stat-card p-6 rounded-xl">
                    <div class="flex items-center justify-between">
                        <div>
                            <div class="text-2xl font-bold">${stats.pendingTickets}</div>
                            <div class="text-gray-400">Pending Tickets</div>
                        </div>
                        <div class="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                            <i class="fas fa-ticket-alt text-orange-400 text-xl"></i>
                        </div>
                    </div>
                    <div class="mt-4">
                        <div class="flex justify-between text-sm mb-1">
                            <span>Avg Response: 2h</span>
                            <span class="text-red-400">-8%</span>
                        </div>
                        <div class="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div class="h-full bg-orange-500 rounded-full" style="width: 30%"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Charts & Recent Activity -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <!-- Revenue Chart -->
                <div class="stat-card p-6 rounded-xl">
                    <h2 class="text-xl font-bold mb-6">Revenue Overview</h2>
                    <div class="h-64">
                        <canvas id="revenueChart"></canvas>
                    </div>
                </div>

                <!-- Recent Orders -->
                <div class="stat-card p-6 rounded-xl">
                    <div class="flex items-center justify-between mb-6">
                        <h2 class="text-xl font-bold">Recent Orders</h2>
                        <a href="/admin/orders" class="text-purple-400 text-sm hover:underline">View All</a>
                    </div>
                    <div class="space-y-4">
                        ${orders.slice(0, 5).map(order => `
                        <div class="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                            <div>
                                <div class="font-medium">${order.service} - ${order.plan}</div>
                                <div class="text-sm text-gray-400">Order #${order.id}</div>
                            </div>
                            <div class="text-right">
                                <div class="font-bold">$${order.amount}</div>
                                <span class="text-xs px-2 py-1 rounded ${order.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}">
                                    ${order.status}
                                </span>
                            </div>
                        </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- Quick Actions & System Info -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Quick Actions -->
                <div class="stat-card p-6 rounded-xl">
                    <h2 class="text-xl font-bold mb-6">Quick Actions</h2>
                    <div class="grid grid-cols-2 gap-4">
                        <a href="/admin/users/new" class="p-4 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors text-center">
                            <i class="fas fa-user-plus text-2xl text-blue-400 mb-2"></i>
                            <div class="font-medium">Add User</div>
                        </a>
                        <a href="/admin/servers/create" class="p-4 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors text-center">
                            <i class="fas fa-plus-circle text-2xl text-purple-400 mb-2"></i>
                            <div class="font-medium">Create Server</div>
                        </a>
                        <a href="/admin/announcements/new" class="p-4 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors text-center">
                            <i class="fas fa-bullhorn text-2xl text-orange-400 mb-2"></i>
                            <div class="font-medium">New Announcement</div>
                        </a>
                        <a href="/admin/settings" class="p-4 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors text-center">
                            <i class="fas fa-cogs text-2xl text-gray-400 mb-2"></i>
                            <div class="font-medium">Settings</div>
                        </a>
                    </div>
                </div>

                <!-- System Information -->
                <div class="stat-card p-6 rounded-xl">
                    <h2 class="text-xl font-bold mb-6">System Information</h2>
                    <div class="space-y-4">
                        <div class="flex justify-between items-center">
                            <span class="text-gray-400">Node.js Version</span>
                            <span class="font-mono">${process.version}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-gray-400">Uptime</span>
                            <span>${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-gray-400">Memory Usage</span>
                            <span>${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-gray-400">Server Port</span>
                            <span>${PORT}</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-gray-400">Environment</span>
                            <span class="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">${process.env.NODE_ENV || 'development'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Revenue Chart
        const ctx = document.getElementById('revenueChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
                datasets: [{
                    label: 'Revenue ($)',
                    data: [1200, 1900, 1500, 2800, 2200, 3000, 3500],
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    }
                }
            }
        });
    </script>
</body>
</html>
    `);
});

// ==================== ADMIN SUB-PAGES ====================

// Users Management
app.get('/admin/users', requireAdmin, (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Users Management - CreeperCastle Admin</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="bg-gray-950 text-gray-100">
    <!-- Top Bar -->
    <nav class="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                    <i class="fas fa-shield-alt text-white"></i>
                </div>
                <span class="text-xl font-bold">CreeperCastle</span>
                <span class="text-gray-400">/ Users Management</span>
            </div>
            <a href="/admin" class="text-gray-400 hover:text-white">
                <i class="fas fa-arrow-left"></i> Back to Dashboard
            </a>
        </div>
    </nav>

    <div class="p-8">
        <div class="flex justify-between items-center mb-8">
            <div>
                <h1 class="text-3xl font-bold mb-2">Users Management</h1>
                <p class="text-gray-400">Manage all user accounts and permissions</p>
            </div>
            <a href="/admin/users/new" class="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-medium">
                <i class="fas fa-user-plus mr-2"></i> Add New User
            </a>
        </div>

        <!-- Users Table -->
        <div class="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
            <div class="p-6 border-b border-gray-800">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <div class="relative">
                            <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"></i>
                            <input type="text" placeholder="Search users..." class="bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 w-64 focus:outline-none focus:border-purple-500">
                        </div>
                        <select class="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500">
                            <option>All Users</option>
                            <option>Admins</option>
                            <option>Clients</option>
                            <option>Suspended</option>
                        </select>
                    </div>
                    <div class="text-gray-400">
                        ${users.length} users found
                    </div>
                </div>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-800">
                        <tr>
                            <th class="text-left p-4">
                                <input type="checkbox" class="rounded border-gray-600">
                            </th>
                            <th class="text-left p-4">User</th>
                            <th class="text-left p-4">Email</th>
                            <th class="text-left p-4">Role</th>
                            <th class="text-left p-4">Services</th>
                            <th class="text-left p-4">Joined</th>
                            <th class="text-left p-4">Status</th>
                            <th class="text-left p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(user => `
                        <tr class="border-t border-gray-800 hover:bg-gray-800/30">
                            <td class="p-4">
                                <input type="checkbox" class="rounded border-gray-600">
                            </td>
                            <td class="p-4">
                                <div class="flex items-center">
                                    <div class="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                                        ${user.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div class="font-medium">${user.username}</div>
                                        <div class="text-sm text-gray-400">ID: ${user.id.slice(0, 8)}</div>
                                    </div>
                                </div>
                            </td>
                            <td class="p-4">${user.email || 'N/A'}</td>
                            <td class="p-4">
                                <span class="px-3 py-1 rounded-full text-xs ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}">
                                    ${user.role}
                                </span>
                            </td>
                            <td class="p-4">
                                <div class="flex items-center">
                                    <span class="font-medium mr-2">${servers.filter(s => s.userId === user.id).length}</span>
                                    <span class="text-gray-400">servers</span>
                                </div>
                            </td>
                            <td class="p-4">
                                <div class="text-sm">${new Date(user.createdAt).toLocaleDateString()}</div>
                                <div class="text-xs text-gray-400">${new Date(user.createdAt).toLocaleTimeString()}</div>
                            </td>
                            <td class="p-4">
                                <span class="px-3 py-1 rounded-full text-xs ${user.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}">
                                    ${user.status || 'active'}
                                </span>
                            </td>
                            <td class="p-4">
                                <div class="flex items-center space-x-2">
                                    <a href="/admin/users/${user.id}" class="w-8 h-8 bg-gray-800 rounded flex items-center justify-center hover:bg-gray-700">
                                        <i class="fas fa-edit text-sm"></i>
                                    </a>
                                    <a href="/admin/users/${user.id}/impersonate" class="w-8 h-8 bg-blue-500/20 rounded flex items-center justify-center hover:bg-blue-500/30">
                                        <i class="fas fa-user-secret text-sm text-blue-400"></i>
                                    </a>
                                    <button onclick="deleteUser('${user.id}')" class="w-8 h-8 bg-red-500/20 rounded flex items-center justify-center hover:bg-red-500/30">
                                        <i class="fas fa-trash text-sm text-red-400"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            <div class="p-6 border-t border-gray-800 flex items-center justify-between">
                <div class="text-gray-400">
                    Showing 1 to ${Math.min(users.length, 10)} of ${users.length} entries
                </div>
                <div class="flex items-center space-x-2">
                    <button class="w-10 h-10 bg-gray-800 rounded flex items-center justify-center hover:bg-gray-700">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <button class="w-10 h-10 bg-purple-600 rounded flex items-center justify-center">1</button>
                    <button class="w-10 h-10 bg-gray-800 rounded flex items-center justify-center hover:bg-gray-700">2</button>
                    <button class="w-10 h-10 bg-gray-800 rounded flex items-center justify-center hover:bg-gray-700">3</button>
                    <button class="w-10 h-10 bg-gray-800 rounded flex items-center justify-center hover:bg-gray-700">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <script>
        function deleteUser(userId) {
            if(confirm('Are you sure you want to delete this user?')) {
                fetch('/admin/users/' + userId + '/delete', {
                    method: 'DELETE'
                }).then(() => location.reload());
            }
        }
    </script>
</body>
</html>
    `);
});

// Orders Management
app.get('/admin/orders', requireAdmin, (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Orders Management - CreeperCastle Admin</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="bg-gray-950 text-gray-100">
    <nav class="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                    <i class="fas fa-shield-alt text-white"></i>
                </div>
                <span class="text-xl font-bold">CreeperCastle</span>
                <span class="text-gray-400">/ Orders Management</span>
            </div>
            <a href="/admin" class="text-gray-400 hover:text-white">
                <i class="fas fa-arrow-left"></i> Back to Dashboard
            </a>
        </div>
    </nav>

    <div class="p-8">
        <div class="mb-8">
            <h1 class="text-3xl font-bold mb-2">Orders Management</h1>
            <p class="text-gray-400">Manage and process all customer orders</p>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-4 gap-6 mb-8">
            <div class="bg-gray-900/50 p-6 rounded-xl">
                <div class="text-2xl font-bold text-emerald-400">${orders.filter(o => o.status === 'completed').length}</div>
                <div class="text-gray-400">Completed</div>
            </div>
            <div class="bg-gray-900/50 p-6 rounded-xl">
                <div class="text-2xl font-bold text-yellow-400">${orders.filter(o => o.status === 'pending').length}</div>
                <div class="text-gray-400">Pending</div>
            </div>
            <div class="bg-gray-900/50 p-6 rounded-xl">
                <div class="text-2xl font-bold text-blue-400">${orders.filter(o => o.status === 'processing').length}</div>
                <div class="text-gray-400">Processing</div>
            </div>
            <div class="bg-gray-900/50 p-6 rounded-xl">
                <div class="text-2xl font-bold">${orders.length}</div>
                <div class="text-gray-400">Total Orders</div>
            </div>
        </div>

        <!-- Orders Table -->
        <div class="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
            <table class="w-full">
                <thead class="bg-gray-800">
                    <tr>
                        <th class="text-left p-4">Order ID</th>
                        <th class="text-left p-4">Customer</th>
                        <th class="text-left p-4">Service</th>
                        <th class="text-left p-4">Amount</th>
                        <th class="text-left p-4">Date</th>
                        <th class="text-left p-4">Status</th>
                        <th class="text-left p-4">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${orders.map(order => {
                        const user = users.find(u => u.id === order.userId);
                        return `
                        <tr class="border-t border-gray-800 hover:bg-gray-800/30">
                            <td class="p-4 font-mono">#${order.id}</td>
                            <td class="p-4">
                                <div class="flex items-center">
                                    <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                                        ${user?.username?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                        <div class="font-medium">${user?.username || 'Unknown'}</div>
                                        <div class="text-xs text-gray-400">${user?.email || ''}</div>
                                    </div>
                                </div>
                            </td>
                            <td class="p-4">
                                <div class="flex items-center">
                                    <i class="fas ${order.service === 'minecraft' ? 'fa-cube' : order.service === 'vps' ? 'fa-server' : 'fa-globe'} text-purple-400 mr-2"></i>
                                    ${order.service} - ${order.plan}
                                </div>
                            </td>
                            <td class="p-4 font-bold">$${order.amount}</td>
                            <td class="p-4">${new Date(order.date).toLocaleDateString()}</td>
                            <td class="p-4">
                                <span class="px-3 py-1 rounded-full text-xs ${
                                    order.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                                    order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-blue-500/20 text-blue-400'
                                }">
                                    ${order.status}
                                </span>
                            </td>
                            <td class="p-4">
                                <div class="flex space-x-2">
                                    <a href="/admin/orders/${order.id}" class="px-3 py-1 bg-gray-800 rounded text-sm hover:bg-gray-700">
                                        View
                                    </a>
                                    ${order.status === 'pending' ? `
                                    <button onclick="processOrder('${order.id}')" class="px-3 py-1 bg-emerald-600 rounded text-sm hover:bg-emerald-700">
                                        Process
                                    </button>
                                    ` : ''}
                                </div>
                            </td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    </div>

    <script>
        function processOrder(orderId) {
            fetch('/admin/orders/' + orderId + '/process', {
                method: 'POST'
            }).then(() => location.reload());
        }
    </script>
</body>
</html>
    `);
});

// ==================== AUTHENTICATION ====================

app.get('/login', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - CreeperCastle</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-950 min-h-screen flex items-center justify-center">
    <div class="w-full max-w-md">
        <div class="text-center mb-8">
            <div class="w-16 h-16 bg-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-castle text-2xl text-white"></i>
            </div>
            <h1 class="text-3xl font-bold">Welcome Back</h1>
            <p class="text-gray-400 mt-2">Sign in to your CreeperCastle account</p>
        </div>
        
        <div class="bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
            <form action="/login" method="POST" class="space-y-6">
                <div>
                    <label class="block text-sm font-medium mb-2">Username or Email</label>
                    <input type="text" name="username" required class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Password</label>
                    <input type="password" name="password" required class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500">
                </div>
                <div class="flex items-center justify-between">
                    <label class="flex items-center">
                        <input type="checkbox" class="rounded border-gray-700 bg-gray-800">
                        <span class="ml-2 text-sm">Remember me</span>
                    </label>
                    <a href="/forgot" class="text-sm text-purple-400 hover:text-purple-300">Forgot password?</a>
                </div>
                <button type="submit" class="w-full bg-purple-600 hover:bg-purple-700 py-3 rounded-lg font-medium">
                    Sign In
                </button>
            </form>
            
            <div class="mt-6 text-center">
                <p class="text-gray-400">Don't have an account? <a href="/register" class="text-purple-400 hover:text-purple-300">Sign up</a></p>
            </div>
        </div>
    </div>
</body>
</html>
    `);
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username || u.email === username);
    
    if (user && bcrypt.compareSync(password, user.password)) {
        req.session.userId = user.id;
        res.redirect('/client');
    } else {
        res.send('Invalid credentials');
    }
});

app.get('/register', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register - CreeperCastle</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-950 min-h-screen flex items-center justify-center">
    <div class="w-full max-w-md">
        <div class="text-center mb-8">
            <div class="w-16 h-16 bg-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-castle text-2xl text-white"></i>
            </div>
            <h1 class="text-3xl font-bold">Create Account</h1>
            <p class="text-gray-400 mt-2">Join CreeperCastle today</p>
        </div>
        
        <div class="bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
            <form action="/register" method="POST" class="space-y-6">
                <div>
                    <label class="block text-sm font-medium mb-2">Username</label>
                    <input type="text" name="username" required class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Email Address</label>
                    <input type="email" name="email" required class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Password</label>
                    <input type="password" name="password" required class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Confirm Password</label>
                    <input type="password" name="confirmPassword" required class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500">
                </div>
                <div class="flex items-center">
                    <input type="checkbox" required class="rounded border-gray-700 bg-gray-800">
                    <span class="ml-2 text-sm">I agree to the <a href="/tos" class="text-purple-400">Terms of Service</a> and <a href="/privacy" class="text-purple-400">Privacy Policy</a></span>
                </div>
                <button type="submit" class="w-full bg-purple-600 hover:bg-purple-700 py-3 rounded-lg font-medium">
                    Create Account
                </button>
            </form>
            
            <div class="mt-6 text-center">
                <p class="text-gray-400">Already have an account? <a href="/login" class="text-purple-400 hover:text-purple-300">Sign in</a></p>
            </div>
        </div>
    </div>
</body>
</html>
    `);
});

app.post('/register', (req, res) => {
    const { username, email, password, confirmPassword } = req.body;
    
    if (password !== confirmPassword) {
        return res.send('Passwords do not match');
    }
    
    if (users.find(u => u.username === username || u.email === email)) {
        return res.send('User already exists');
    }
    
    const userId = crypto.randomBytes(16).toString('hex');
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    users.push({
        id: userId,
        username,
        email,
        password: hashedPassword,
        role: 'client',
        createdAt: new Date(),
        status: 'active'
    });
    
    req.session.userId = userId;
    res.redirect('/client');
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// ==================== SEED DATA ====================

// Seed initial data
function seedData() {
    if (users.length === 0) {
        const adminId = crypto.randomBytes(16).toString('hex');
        users.push({
            id: adminId,
            username: 'admin',
            email: 'admin@creepercastle.cloud',
            password: bcrypt.hashSync('admin123', 10),
            role: 'admin',
            createdAt: new Date(),
            status: 'active'
        });
        
        // Create some test users
        for (let i = 1; i <= 5; i++) {
            users.push({
                id: crypto.randomBytes(16).toString('hex'),
                username: `user${i}`,
                email: `user${i}@example.com`,
                password: bcrypt.hashSync('password123', 10),
                role: 'client',
                createdAt: new Date(Date.now() - i * 86400000),
                status: 'active'
            });
        }
        
        // Create some orders
        for (let i = 1; i <= 10; i++) {
            orders.push({
                id: `ORD${1000 + i}`,
                userId: users[Math.floor(Math.random() * users.length)].id,
                service: ['minecraft', 'vps', 'web'][Math.floor(Math.random() * 3)],
                plan: ['Basic', 'Premium', 'Enterprise'][Math.floor(Math.random() * 3)],
                amount: [5, 10, 20][Math.floor(Math.random() * 3)],
                status: ['pending', 'processing', 'completed'][Math.floor(Math.random() * 3)],
                date: new Date(Date.now() - i * 86400000)
            });
        }
        
        // Create some servers
        for (let i = 1; i <= 8; i++) {
            servers.push({
                id: `SRV${1000 + i}`,
                userId: users[Math.floor(Math.random() * users.length)].id,
                name: `Server ${i}`,
                service: 'minecraft',
                plan: ['Basic', 'Premium', 'Enterprise'][Math.floor(Math.random() * 3)],
                ip: `mc${i}.creepercastle.cloud`,
                port: 25565 + i,
                status: 'active',
                created: new Date(Date.now() - i * 86400000),
                nextDue: new Date(Date.now() + 30 * 86400000)
            });
        }
        
        // Create some invoices
        for (let i = 1; i <= 15; i++) {
            invoices.push({
                id: `INV${1000 + i}`,
                userId: users[Math.floor(Math.random() * users.length)].id,
                amount: [5, 10, 20][Math.floor(Math.random() * 3)],
                status: ['paid', 'unpaid'][Math.floor(Math.random() * 2)],
                date: new Date(Date.now() - i * 86400000),
                dueDate: new Date(Date.now() + (30 - i) * 86400000)
            });
        }
    }
}

// ==================== START SERVER ====================

seedData();

app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   🏰 CreeperCastle Clone v1.0                           ║
║                                                          ║
║   Server running on: http://localhost:${PORT}               ║
║                                                          ║
║   👑 Admin Panel: http://localhost:${PORT}/admin          ║
║   👤 Admin Login: admin / admin123                      ║
║                                                          ║
║   👥 ${users.length} users seeded                          ║
║   📦 ${orders.length} orders seeded                        ║
║   🖥️  ${servers.length} servers seeded                     ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
    `);
});

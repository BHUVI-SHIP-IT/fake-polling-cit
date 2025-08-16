# 🚀 Fake Poll Detection System - Deployment Guide

## **📋 Prerequisites**
- ✅ Backend server running on port 4000
- ✅ PostgreSQL database configured
- ✅ Frontend built for production
- ✅ Environment variables configured

---

## **🏠 Option 1: Local Network Deployment (Recommended for College)**

### **Step 1: Build Production Frontend**
```bash
# In project root directory
npm run build
```
This creates a `dist` folder with optimized files.

### **Step 2: Configure Backend for Production**
Create `server/.env.production`:
```env
NODE_ENV=production
PORT=4000
DATABASE_URL="postgresql://username:password@localhost:5432/fake_poll_db"
JWT_SECRET="your_super_secure_jwt_secret_here"
CORS_ORIGIN=http://localhost:3000,http://192.168.1.100:3000
```

### **Step 3: Start Production Backend**
```bash
cd server
npm run build
npm start
```

### **Step 4: Serve Frontend**
```bash
# Install serve globally
npm install -g serve

# Serve the built frontend
serve -s dist -l 3000
```

### **Step 5: Access System**
- **Backend API**: `http://localhost:4000`
- **Frontend**: `http://localhost:3000`
- **Network Access**: `http://[YOUR_IP]:3000`

---

## **☁️ Option 2: Cloud Deployment (Railway/Render)**

### **Step 1: Prepare for Cloud**
Update `vite.config.ts`:
```typescript
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
```

### **Step 2: Deploy Backend to Railway**
1. **Sign up** at [railway.app](https://railway.app)
2. **Connect GitHub** repository
3. **Add PostgreSQL** database
4. **Set environment variables**:
   ```env
   DATABASE_URL=your_railway_postgres_url
   JWT_SECRET=your_secret
   NODE_ENV=production
   ```
5. **Deploy** automatically

### **Step 3: Deploy Frontend to Vercel**
1. **Sign up** at [vercel.com](https://vercel.com)
2. **Import** your GitHub repository
3. **Set environment variables**:
   ```env
   VITE_API_URL=https://your-railway-backend.railway.app
   ```
4. **Deploy** automatically

---

## **🖥️ Option 3: VPS Deployment (DigitalOcean/AWS)**

### **Step 1: Set Up VPS**
```bash
# Connect to your VPS
ssh root@your_server_ip

# Update system
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install PostgreSQL
apt install postgresql postgresql-contrib -y

# Install Nginx
apt install nginx -y
```

### **Step 2: Configure PostgreSQL**
```bash
sudo -u postgres psql
CREATE DATABASE fake_poll_db;
CREATE USER fakepoll_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE fake_poll_db TO fakepoll_user;
\q
```

### **Step 3: Deploy Backend**
```bash
# Clone repository
git clone https://github.com/yourusername/fake-poll-system.git
cd fake-poll-system/server

# Install dependencies
npm install

# Build
npm run build

# Create systemd service
sudo nano /etc/systemd/system/fakepoll-backend.service
```

**Service file content:**
```ini
[Unit]
Description=Fake Poll Backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/fake-poll-system/server
ExecStart=/usr/bin/node dist/index.js
Restart=always
Environment=NODE_ENV=production
Environment=PORT=4000
Environment=DATABASE_URL=postgresql://fakepoll_user:secure_password@localhost:5432/fake_poll_db

[Install]
WantedBy=multi-user.target
```

### **Step 4: Deploy Frontend**
```bash
# Build frontend
cd /root/fake-poll-system
npm install
npm run build

# Configure Nginx
sudo nano /etc/nginx/sites-available/fakepoll
```

**Nginx configuration:**
```nginx
server {
    listen 80;
    server_name your_domain.com;

    # Frontend
    location / {
        root /root/fake-poll-system/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### **Step 5: Start Services**
```bash
# Enable and start backend
sudo systemctl enable fakepoll-backend
sudo systemctl start fakepoll-backend

# Enable and start Nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Check status
sudo systemctl status fakepoll-backend
sudo systemctl status nginx
```

---

## **🔧 Environment Variables Reference**

### **Required Variables**
```env
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Security
JWT_SECRET=your_very_long_random_secret_key

# Server
NODE_ENV=production
PORT=4000
```

### **Optional Variables**
```env
# Email (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=noreply@yourcollege.edu

# CORS
CORS_ORIGIN=http://localhost:3000,https://yourdomain.com
```

---

## **📱 Access Your Deployed System**

### **Local Network**
- **Faculty**: `http://192.168.1.100:3000`
- **Students**: `http://192.168.1.100:3000`

### **Cloud Deployment**
- **Faculty**: `https://your-app.vercel.app`
- **Students**: `https://your-app.vercel.app`

### **VPS Deployment**
- **Faculty**: `http://your_server_ip` or `https://yourdomain.com`
- **Students**: `http://your_server_ip` or `https://yourdomain.com`

---

## **✅ Deployment Checklist**

- [ ] Backend built and tested
- [ ] Frontend built (`npm run build`)
- [ ] Environment variables configured
- [ ] Database connection tested
- [ ] Services started and running
- [ ] Network access configured
- [ ] SSL certificate (for production)
- [ ] Domain configured (optional)
- [ ] Backup strategy in place

---

## **🚨 Security Considerations**

1. **Change default passwords**
2. **Use strong JWT secrets**
3. **Configure firewall rules**
4. **Enable HTTPS (production)**
5. **Regular security updates**
6. **Database backups**
7. **Monitor logs**

---

## **🎯 Recommended for College Use**

**Start with Option 1 (Local Network)** because:
- ✅ **Free** - No cloud costs
- ✅ **Fast** - Local network speed
- ✅ **Secure** - Behind college firewall
- ✅ **Simple** - Easy to maintain
- ✅ **Reliable** - No internet dependency

**Upgrade to cloud later** when you need:
- Internet access
- Professional hosting
- Better uptime
- Scalability

---

## **📞 Need Help?**

1. **Check logs**: `sudo journalctl -u fakepoll-backend`
2. **Test database**: `psql -h localhost -U username -d database`
3. **Check ports**: `netstat -tlnp | grep :4000`
4. **Test API**: `curl http://localhost:4000/api/health`

**Your system is ready for deployment! 🚀** 
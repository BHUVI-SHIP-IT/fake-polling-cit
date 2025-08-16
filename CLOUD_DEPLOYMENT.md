# ☁️ Cloud Deployment Configuration - Fake Poll Detection System

## **🎯 Overview**
This guide will deploy your system to the cloud using:
- **🚂 Railway**: Backend API + PostgreSQL Database
- **🚀 Vercel**: Frontend React App
- **🔒 Free Tier**: Start free, scale as needed

---

## **📋 Prerequisites**
- ✅ GitHub account
- ✅ Railway account (free at [railway.app](https://railway.app))
- ✅ Vercel account (free at [vercel.com](https://vercel.com))
- ✅ Your project code ready

---

## **🚂 Step 1: Deploy Backend to Railway**

### **1.1 Sign Up for Railway**
1. Go to [railway.app](https://railway.app)
2. Click "Sign Up" and connect your GitHub account
3. Verify your email

### **1.2 Create New Project**
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your repository: `sb1-vxjvekbm`
4. Click "Deploy Now"

### **1.3 Add PostgreSQL Database**
1. In your Railway project, click "New"
2. Select "Database" → "PostgreSQL"
3. Click "Add"
4. **Copy the connection string** (you'll need this)

### **1.4 Configure Environment Variables**
In your Railway project, go to "Variables" tab and add:

```env
# Database (Railway will auto-fill this)
DATABASE_URL=postgresql://username:password@host:port/database

# Security (Change this!)
JWT_SECRET=your_super_secure_jwt_secret_key_here_change_this

# Server
NODE_ENV=production
PORT=4000

# Email (Optional - for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=noreply@yourcollege.edu

# CORS (Allow Vercel domain)
CORS_ORIGIN=https://your-app.vercel.app,http://localhost:3000
```

### **1.5 Deploy Backend**
1. Railway will automatically detect it's a Node.js project
2. It will run `npm install` and `npm start`
3. Wait for deployment to complete
4. **Copy your Railway app URL** (e.g., `https://your-app.railway.app`)

---

## **🚀 Step 2: Deploy Frontend to Vercel**

### **2.1 Sign Up for Vercel**
1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up" and connect your GitHub account
3. Verify your email

### **2.2 Import Your Project**
1. Click "New Project"
2. Select "Import Git Repository"
3. Choose your repository: `sb1-vxjvekbm`
4. Click "Import"

### **2.3 Configure Build Settings**
Vercel will auto-detect React, but verify these settings:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite"
}
```

### **2.4 Set Environment Variables**
In Vercel project settings → "Environment Variables":

```env
# API URL (Your Railway backend URL)
VITE_API_URL=https://your-app.railway.app

# Build time variables
VITE_APP_NAME=Fake Poll Detection System
VITE_APP_VERSION=1.0.0
```

### **2.5 Deploy Frontend**
1. Click "Deploy"
2. Wait for build to complete
3. **Copy your Vercel app URL** (e.g., `https://your-app.vercel.app`)

---

## **🔧 Step 3: Update CORS in Railway**

### **3.1 Update CORS Origin**
Go back to Railway → Variables and update:

```env
CORS_ORIGIN=https://your-app.vercel.app,http://localhost:3000
```

### **3.2 Redeploy Backend**
Railway will automatically redeploy when you change variables.

---

## **📱 Step 4: Test Your Cloud Deployment**

### **4.1 Test Backend API**
```bash
curl https://your-app.railway.app/api/health
```
Should return: `{"ok": true}`

### **4.2 Test Frontend**
1. Open `https://your-app.vercel.app`
2. Try to register as faculty
3. Test login functionality

### **4.3 Test Database Connection**
1. Go to Railway → PostgreSQL → "Connect"
2. Use a database client to verify connection

---

## **🌐 Step 5: Custom Domain (Optional)**

### **5.1 Add Custom Domain to Vercel**
1. Go to Vercel project → "Settings" → "Domains"
2. Add your domain: `fakepoll.yourcollege.edu`
3. Update DNS records as instructed

### **5.2 Update CORS in Railway**
```env
CORS_ORIGIN=https://fakepoll.yourcollege.edu,https://your-app.vercel.app
```

---

## **🔒 Step 6: Security & Production Settings**

### **6.1 Update JWT Secret**
Generate a strong secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### **6.2 Environment Variables Checklist**
```env
✅ DATABASE_URL=postgresql://...
✅ JWT_SECRET=your_generated_secret
✅ NODE_ENV=production
✅ CORS_ORIGIN=https://yourdomain.com
✅ EMAIL_* (if using notifications)
```

---

## **📊 Step 7: Monitor & Maintain**

### **7.1 Railway Monitoring**
- **Logs**: View real-time logs in Railway dashboard
- **Metrics**: Monitor CPU, memory, database usage
- **Deployments**: Track deployment history

### **7.2 Vercel Analytics**
- **Performance**: Page load times, Core Web Vitals
- **Traffic**: Visitor analytics, geographic distribution
- **Errors**: JavaScript errors and performance issues

---

## **💰 Pricing & Scaling**

### **Free Tier Limits**
- **Railway**: $5/month after free tier (includes database)
- **Vercel**: Free forever for personal projects
- **Database**: 1GB storage, 1000 connections

### **Paid Plans**
- **Railway**: $5-20/month for production use
- **Vercel**: $20/month for team features
- **Database**: $5/month for 10GB storage

---

## **🚨 Troubleshooting**

### **Common Issues**

#### **1. CORS Errors**
```env
# Check CORS_ORIGIN in Railway
CORS_ORIGIN=https://your-app.vercel.app
```

#### **2. Database Connection Failed**
```env
# Verify DATABASE_URL in Railway
DATABASE_URL=postgresql://username:password@host:port/database
```

#### **3. Build Failures**
- Check build logs in Vercel
- Verify `package.json` scripts
- Ensure all dependencies are installed

#### **4. Environment Variables Not Working**
- Variables must be set in both Railway and Vercel
- Frontend variables must start with `VITE_`
- Backend variables are set in Railway

---

## **✅ Deployment Checklist**

- [ ] Railway account created
- [ ] Vercel account created
- [ ] Backend deployed to Railway
- [ ] PostgreSQL database added
- [ ] Environment variables configured
- [ ] Frontend deployed to Vercel
- [ ] CORS settings updated
- [ ] API endpoints tested
- [ ] Frontend functionality verified
- [ ] Custom domain configured (optional)
- [ ] Security settings updated
- [ ] Monitoring enabled

---

## **🎯 Benefits of Cloud Deployment**

### **For Faculty:**
- ✅ Access from anywhere (home, office, mobile)
- ✅ No need to be on college network
- ✅ Professional, reliable service
- ✅ Automatic backups and updates

### **For Students:**
- ✅ Submit polls from anywhere
- ✅ Mobile-friendly access
- ✅ Fast loading worldwide
- ✅ Always available

### **For Administrators:**
- ✅ 99.9% uptime guarantee
- ✅ Automatic scaling
- ✅ Professional monitoring
- ✅ Easy maintenance

---

## **📞 Need Help?**

### **Railway Support**
- **Documentation**: [docs.railway.app](https://docs.railway.app)
- **Discord**: [discord.gg/railway](https://discord.gg/railway)
- **Email**: support@railway.app

### **Vercel Support**
- **Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Discord**: [discord.gg/vercel](https://discord.gg/vercel)
- **Email**: support@vercel.com

---

## **🚀 Ready to Deploy?**

Your system is perfectly configured for cloud deployment! 

**Next steps:**
1. Create Railway and Vercel accounts
2. Follow the deployment steps above
3. Test your cloud-hosted system
4. Share the URL with your college!

**Your fake poll detection system will be accessible worldwide! 🌍** 
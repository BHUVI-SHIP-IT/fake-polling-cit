# PostgreSQL Setup Guide

## 🗄️ **Database Setup for Fake Poll Detection System**

### **Option 1: Local PostgreSQL Installation**

#### **Windows (Recommended)**
1. **Download PostgreSQL**: https://www.postgresql.org/download/windows/
2. **Install with default settings**:
   - Port: 5432
   - Password: `postgres` (or your choice)
   - Install pgAdmin (GUI tool)

#### **macOS**
```bash
# Using Homebrew
brew install postgresql
brew services start postgresql
```

#### **Linux (Ubuntu/Debian)**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### **Option 2: Docker PostgreSQL (Easiest)**

```bash
# Create and run PostgreSQL container
docker run --name fake-poll-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=fake_poll_db \
  -p 5432:5432 \
  -d postgres:15

# Check if running
docker ps
```

### **Option 3: Cloud PostgreSQL (Production)**

- **Railway**: https://railway.app/ (Free tier available)
- **Supabase**: https://supabase.com/ (Free tier available)
- **Neon**: https://neon.tech/ (Free tier available)

## 🔧 **Database Configuration**

### **1. Create Database**
```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create database
CREATE DATABASE fake_poll_db;

-- Verify
\l

-- Exit
\q
```

### **2. Update Environment File**
Edit `server/.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fake_poll_db"
JWT_SECRET="your-secret-key-here"
PORT=4000
```

**Replace with your actual credentials:**
- `postgres` (username)
- `postgres` (password) 
- `localhost` (host)
- `5432` (port)
- `fake_poll_db` (database name)

### **3. Test Connection**
```bash
cd server
npx prisma db pull
```

## 🚀 **Setup Commands**

### **1. Install Dependencies**
```bash
cd server
npm install --legacy-peer-deps
```

### **2. Generate Prisma Client**
```bash
npx prisma generate
```

### **3. Run Database Migrations**
```bash
npx prisma migrate dev --name init
```

### **4. Verify Database**
```bash
npx prisma studio
```

## 📊 **Database Schema**

Your PostgreSQL database will have these tables:

- **User** - Authentication (email, password, type)
- **Student** - Student details + competitive programming IDs
- **Faculty** - Faculty details + handling classes
- **Class** - Year/Section/Department combinations
- **StudentClass** - Many-to-many relationship
- **Poll** - Faculty-created polls with questions
- **PollResponse** - Student responses + verification flags

## 🔍 **Troubleshooting**

### **Connection Issues**
```bash
# Test connection
npx prisma db pull

# Check if PostgreSQL is running
# Windows: Services app
# macOS/Linux: systemctl status postgresql
```

### **Permission Issues**
```sql
-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE fake_poll_db TO postgres;
```

### **Port Conflicts**
```bash
# Check if port 5432 is in use
netstat -an | findstr 5432  # Windows
lsof -i :5432               # macOS/Linux
```

## 📝 **Sample Connection Strings**

### **Local Development**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fake_poll_db"
```

### **Docker**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fake_poll_db"
```

### **Railway**
```env
DATABASE_URL="postgresql://username:password@containers-us-west-1.railway.app:5432/railway"
```

### **Supabase**
```env
DATABASE_URL="postgresql://postgres:password@db.abcdefghijklmnop.supabase.co:5432/postgres"
```

## ✅ **Verification Steps**

1. **PostgreSQL running**: `npx prisma db pull`
2. **Client generated**: `npx prisma generate`
3. **Tables created**: `npx prisma migrate dev --name init`
4. **Database accessible**: `npx prisma studio`

## 🎯 **Next Steps**

After database setup:
1. Start backend: `npm run dev`
2. Start frontend: `npm run dev` (in root directory)
3. Import students via CSV
4. Test the system!

**Need help?** Check the main README.md for API documentation and usage examples. 
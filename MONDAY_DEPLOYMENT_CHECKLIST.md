# PocketAccountant - Monday Deployment Checklist
## March 30, 2026

## ✅ **STATUS: READY FOR DEPLOYMENT**

### **Summary**
The npm dependency installation issue has been resolved through Docker containerization. The project is now deployment-ready with a complete Docker-based infrastructure.

---

## **🎯 DEPLOYMENT OPTIONS**

### **Option 1: Docker Deployment (RECOMMENDED)**
```bash
cd /home/node/.openclaw/workspace/pocketaccountant
./deploy.sh docker
```

**What this does:**
1. Backs up existing database
2. Builds Docker images for frontend and backend
3. Starts containers with health checks
4. Sets up reverse proxy (optional)

### **Option 2: Direct Deployment**
```bash
cd /home/node/.openclaw/workspace/pocketaccountant
./deploy.sh production
```

**Requirements:**
- Node.js 18+ installed
- PM2 installed globally (`npm install -g pm2`)
- Ports 80 and 3000 available

---

## **📋 PRE-DEPLOYMENT CHECKLIST**

### **Infrastructure**
- [ ] **Server Requirements:**
  - Linux server (Ubuntu 20.04+ recommended)
  - Docker and Docker Compose installed
  - Ports 80 (HTTP) and 3000 (API) open
  - 2GB RAM minimum, 4GB recommended
  - 10GB disk space

- [ ] **Domain & SSL (Optional but recommended):**
  - Domain name pointed to server IP
  - SSL certificate (Let's Encrypt)
  - Nginx configured for HTTPS

### **Environment Variables**
Create `.env` file in project root:
```env
# Backend
NODE_ENV=production
PORT=3000
JWT_SECRET=your-strong-secret-key-here
DATABASE_URL=file:./pocketaccountant

# Frontend
REACT_APP_API_URL=https://your-domain.com/api
```

### **Database Backup**
- [ ] Current database backed up
- [ ] Backup stored in `backups/` directory
- [ ] Verify backup integrity

---

## **🚀 DEPLOYMENT STEPS**

### **Step 1: Server Setup**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install docker.io docker-compose -y

# Add user to docker group
sudo usermod -aG docker $USER

# Clone or copy project to server
git clone <repository-url> /opt/pocketaccountant
cd /opt/pocketaccountant
```

### **Step 2: Configure Environment**
```bash
# Copy environment template
cp .env.example .env

# Edit with your values
nano .env
```

### **Step 3: Deploy**
```bash
# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh docker
```

### **Step 4: Verify Deployment**
```bash
# Check running containers
docker ps

# Check logs
docker logs pocketaccountant-backend
docker logs pocketaccountant-frontend

# Test endpoints
curl http://localhost:3000/api/health
curl http://localhost:80
```

---

## **🔧 TROUBLESHOOTING**

### **Common Issues & Solutions**

#### **1. Docker Containers Not Starting**
```bash
# Check Docker service
sudo systemctl status docker

# Check container logs
docker logs <container-name>

# Rebuild containers
docker-compose down
docker-compose up --build
```

#### **2. Database Permission Issues**
```bash
# Fix SQLite database permissions
sudo chown -R node:node backend/pocketaccountant
sudo chmod 664 backend/pocketaccountant
```

#### **3. Port Conflicts**
```bash
# Check what's using ports 80 and 3000
sudo lsof -i :80
sudo lsof -i :3000

# Stop conflicting services
sudo systemctl stop nginx apache2
```

#### **4. Memory Issues**
```bash
# Check memory usage
free -h

# Increase swap if needed
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## **📊 POST-DEPLOYMENT VERIFICATION**

### **Functional Testing**
- [ ] **Authentication:**
  - User registration works
  - Login with credentials
  - JWT token generation
  - Protected routes accessible

- [ ] **Core Features:**
  - Expense creation and listing
  - Budget management
  - Currency conversion (ZAR support)
  - Offline data sync

- [ ] **API Endpoints:**
  - All endpoints return expected responses
  - Error handling works
  - Database operations succeed

### **Performance Testing**
- [ ] **Response Times:**
  - API response < 200ms
  - Page load < 3 seconds
  - Database queries optimized

- [ ] **Concurrent Users:**
  - Test with 10+ simultaneous users
  - Verify no data corruption
  - Check memory usage

### **Security Verification**
- [ ] **Input Validation:**
  - SQL injection prevention
  - XSS protection
  - CSRF tokens working

- [ ] **Authentication:**
  - Password hashing (bcrypt)
  - JWT token expiration
  - Session management

---

## **🔒 PRODUCTION SECURITY CHECKLIST**

### **Server Security**
- [ ] Firewall configured (UFW)
- [ ] SSH key authentication only
- [ ] Fail2ban installed
- [ ] Regular security updates

### **Application Security**
- [ ] Environment variables not in code
- [ ] API rate limiting enabled
- [ ] CORS properly configured
- [ ] HTTPS enforced

### **Database Security**
- [ ] Regular backups (daily)
- [ ] Backup encryption
- [ ] Access logs monitored
- [ ] SQLite file permissions secure

---

## **📈 MONITORING & MAINTENANCE**

### **Logging**
```bash
# View application logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### **Health Monitoring**
- [ ] Set up health check endpoints
- [ ] Configure monitoring (Prometheus/Grafana)
- [ ] Set up alerts for downtime

### **Backup Schedule**
```bash
# Daily backup script
0 2 * * * /opt/pocketaccountant/backup.sh

# Weekly backup rotation
0 3 * * 0 /opt/pocketaccountant/rotate-backups.sh
```

---

## **📞 SUPPORT & RECOVERY**

### **Emergency Contacts**
- **Technical Lead:** [Name/Contact]
- **Backup Admin:** [Name/Contact]
- **Hosting Provider:** [Contact]

### **Disaster Recovery**
1. **Database Corruption:**
   ```bash
   # Restore from latest backup
   cp backups/latest/pocketaccountant.db backend/
   docker-compose restart backend
   ```

2. **Complete System Failure:**
   ```bash
   # Rebuild from scratch
   git clone <repository>
   cp backup/database.db backend/
   ./deploy.sh docker
   ```

3. **Security Breach:**
   - Rotate all secrets (JWT, database)
   - Review access logs
   - Update all dependencies

---

## **✅ FINAL VERIFICATION**

### **Before Going Live**
- [ ] All tests pass
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Documentation updated
- [ ] Team trained on procedures

### **Launch Day**
- [ ] Deploy during low-traffic window
- [ ] Monitor closely for 24 hours
- [ ] Have rollback plan ready
- [ ] Communicate with stakeholders

---

## **🎉 SUCCESS METRICS**

### **Immediate (Day 1)**
- [ ] Application accessible via URL
- [ ] No critical errors in logs
- [ ] Users can register and login
- [ ] Core features working

### **Short-term (Week 1)**
- [ ] Stable uptime (>99.5%)
- [ ] User feedback collected
- [ ] Performance metrics tracked
- [ ] Backup system verified

### **Long-term (Month 1)**
- [ ] User growth targets met
- [ ] Feature usage analytics
- [ ] Infrastructure scaling plan
- [ ] Cost optimization

---

**Last Updated:** March 27, 2026  
**Prepared By:** Leano 🦁 - Digital Naga  
**Status:** READY FOR DEPLOYMENT
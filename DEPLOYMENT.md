# Deployment Guide

## Overview

This guide covers how to deploy the Finance Data Processing Backend to production environments. The application is built with Node.js, Express, and Sequelize ORM.

## Prerequisites

- **Node.js**: v18 or higher
- **npm**: v8 or higher
- **SQLite** or **PostgreSQL**: For data persistence
- **Git**: For version control

## Quick Start (Local Development)

### 1. Clone Repository
```bash
git clone <repository-url>
cd finance-backend
npm install
```

### 2. Setup Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Initialize Database
```bash
# Database is automatically created and synced on first run
npm run dev
```

### 4. Test the API
```bash
# In another terminal, run the test suite
powershell -ExecutionPolicy Bypass -File TEST_ALL_ENDPOINTS.ps1
```

## Environment Configuration

### .env File Template

```dotenv
# Server Configuration
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000

# Database Configuration
DB_DIALECT=sqlite          # or 'postgres'
DB_STORAGE=./finance.db   # For SQLite

# PostgreSQL Configuration (if using PostgreSQL)
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=finance_db
# DB_USER=postgres
# DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Logging
LOG_LEVEL=info
```

## Deployment to Production

### Option 1: Heroku Deployment

#### 1. Prepare Application
```bash
# Update package.json if needed
npm audit fix
```

#### 2. Create Heroku App
```bash
heroku login
heroku create your-app-name
```

#### 3. Add Database
```bash
# For PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Or for SQLite (not recommended for production)
# SQLite can be used but data will be lost on dyno restarts
```

#### 4. Set Environment Variables
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-production-secret
heroku config:set API_URL=https://your-app-name.herokuapp.com
```

#### 5. Deploy
```bash
git push heroku main
```

#### 6. Verify Deployment
```bash
heroku logs --tail
curl https://your-app-name.herokuapp.com/health
```

### Option 2: AWS EC2 Deployment

#### 1. Launch EC2 Instance
```bash
# Use Amazon Linux 2 or Ubuntu 20.04+
# Security group: Allow HTTP (80), HTTPS (443), and SSH (22)
```

#### 2. Connect and Setup
```bash
ssh -i your-key.pem ec2-user@your-instance-ip

# Update system
sudo yum update -y

# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install PostgreSQL client
sudo yum install -y postgresql15

# Clone repository
git clone <repository-url>
cd finance-backend
npm install
```

#### 3. Configure Environment
```bash
cp .env.example .env
nano .env
# Edit with your production values
```

#### 4. Setup PM2 (Process Manager)
```bash
npm install -g pm2
pm2 start src/app.js --name "finance-backend"
pm2 startup
pm2 save
```

#### 5. Setup Nginx Reverse Proxy
```bash
sudo amazon-linux-extras install nginx1 -y

# Create config
sudo nano /etc/nginx/conf.d/finance-backend.conf

# Add:
upstream finance_backend {
    server localhost:3000;
}

server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://finance_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### 6. Setup SSL with Let's Encrypt
```bash
sudo yum install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Option 3: Docker Deployment

#### 1. Create Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src ./src
COPY .env .env

EXPOSE 3000

CMD ["node", "src/app.js"]
```

#### 2. Create .dockerignore
```
node_modules
npm-debug.log
.git
.gitignore
.env.example
docs
README.md
```

#### 3. Build and Run
```bash
docker build -t finance-backend:latest .
docker run -p 3000:3000 -e NODE_ENV=production finance-backend:latest
```

#### 4. Push to Container Registry
```bash
# AWS ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com
docker tag finance-backend:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/finance-backend:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/finance-backend:latest
```

## Database Migration

### SQLite to PostgreSQL

If migrating from SQLite to PostgreSQL:

```bash
# 1. Export data from SQLite
npm run migrate:undo:all

# 2. Update .env to PostgreSQL
DB_DIALECT=postgres
DB_HOST=your-postgres-host
DB_PORT=5432
DB_NAME=finance_db
DB_USER=postgres
DB_PASSWORD=your-password

# 3. Create database
createdb finance_db

# 4. Run migrations
npm run migrate

# 5. Run seeds
npm run seed
```

## Monitoring and Maintenance

### Health Check Endpoint
```bash
curl https://your-domain.com/health
```

### View Logs
```bash
# Heroku
heroku logs --tail

# EC2 with PM2
pm2 logs finance-backend

# Docker
docker logs container-id
```

### Database Backup
```bash
# PostgreSQL
pg_dump -U postgres -h localhost finance_db > backup.sql

# SQLite
sqlite3 finance.db ".backup backup.db"
```

### Database Restore
```bash
# PostgreSQL
psql -U postgres -h localhost finance_db < backup.sql

# SQLite
sqlite3 finance.db < backup.sql
```

## Performance Optimization

### 1. Database Indexing
The database automatically creates indexes on frequently queried columns:
- `users.email` (unique)
- `financial_records.userId` (foreign key)
- `financial_records.date` (for range queries)

### 2. Connection Pooling
Configured in `database.js`:
```javascript
pool: {
  max: 5,
  min: 0,
  acquire: 30000,
  idle: 10000,
}
```

### 3. Caching
For frequently accessed dashboard data, implement Redis caching:
```javascript
const redis = require('redis');
const client = redis.createClient();

// Cache summary for 5 minutes
const cachedSummary = await client.get('dashboard:summary');
```

## Security Checklist

- [ ] Change `JWT_SECRET` to a strong, random value
- [ ] Enable HTTPS/SSL
- [ ] Set `NODE_ENV=production`
- [ ] Use strong database passwords
- [ ] Implement rate limiting
- [ ] Enable CORS only for trusted domains
- [ ] Keep dependencies updated: `npm audit`
- [ ] Implement API key rotation
- [ ] Setup firewall rules
- [ ] Enable database backups
- [ ] Monitor error logs
- [ ] Implement request logging

## Scaling Considerations

### Horizontal Scaling
1. Use a load balancer (AWS ALB, Heroku, nginx)
2. Scale to multiple instances
3. Use shared database (PostgreSQL recommended)
4. Implement session management if needed

### Vertical Scaling
1. Increase server resources
2. Optimize database queries
3. Implement caching layer (Redis)
4. Use CDN for static assets

## Troubleshooting

### Application won't start
```bash
# Check Node version
node --version

# Check dependencies
npm install

# Check database connection
npm run migrate
```

### Database connection errors
```bash
# Test PostgreSQL connection
psql -h your-host -U your-user -d your-db

# Test SQLite
sqlite3 finance.db ".tables"
```

### Out of memory errors
```bash
# Increase Node memory
node --max-old-space-size=4096 src/app.js
```

### Slow queries
1. Check database indexes
2. Review query logs
3. Optimize ORM queries
4. Consider caching strategies

## Support

For issues or questions:
1. Check logs: `pm2 logs`
2. Review documentation in `/docs` folder
3. Check GitHub issues
4. Contact development team

---

**Last Updated**: April 2026
**Version**: 1.0.0


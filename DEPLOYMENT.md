# EC2 Docker Container Deployment Guide for Nutricount Backend

This guide details how to build, deploy, and manage the production Docker container for **Nutricount Backend** on AWS EC2.

---

## 1. Container Architecture & Best Practices Implemented

The `Dockerfile` is built following Docker and cloud security best practices:
- **Multi-Stage Build**: Separates TypeScript compilation (`builder`) and production dependencies (`dependencies`) from the final runtime image (`runner`), keeping the image lightweight (~54 MB compressed).
- **Security Hardening**:
  - Runs as the non-root `node` user (UID 1000).
  - Uses `dumb-init` as PID 1 to ensure POSIX termination signals (`SIGTERM`, `SIGINT`) are handled properly without leaving zombie processes.
- **Healthcheck**: Uses Node's built-in `fetch` API against `/health` without requiring external curl/wget binaries.
- **Persistent Volume**: Keeps the `uploads/` directory mounted on a Docker volume so uploaded meal images persist across container updates and restarts.
- **AWS RDS SSL Certificate**: Bundles `global-bundle.pem` inside the working directory so encrypted RDS connections succeed out of the box.

---

## 2. AWS EC2 Prerequisites

### A. Recommended EC2 Instance
- **Instance Type**: `t3.small` or `t3.medium` (minimum 2 GB RAM recommended for Node.js + build steps).
- **Operating System**: **Amazon Linux 2023** or **Ubuntu 22.04 / 24.04 LTS**.
- **Storage**: Minimum 20 GB gp3 EBS root volume.

### B. EC2 Security Group Configuration
Ensure your EC2 Security Group has the following inbound rules:

| Type | Protocol | Port Range | Source | Purpose |
|------|----------|------------|--------|---------|
| SSH | TCP | 22 | Your IP / Bastion | Secure SSH access |
| Custom TCP | TCP | 5000 | Anywhere (`0.0.0.0/0`) or CloudFront/ALB | Direct backend API access |
| HTTP | TCP | 80 | Anywhere (`0.0.0.0/0`) | Nginx / Let's Encrypt validation |
| HTTPS | TCP | 443 | Anywhere (`0.0.0.0/0`) | Production HTTPS |

### C. AWS RDS Security Group Configuration
In your RDS PostgreSQL Security Group:
- Add an **Inbound rule** allowing PostgreSQL (port `5432`) from your **EC2 Security Group ID** (e.g. `sg-xxxxxxxx`).

---

## 3. Quick Setup on EC2 (Install Docker & Docker Compose)

SSH into your EC2 instance:
```bash
ssh -i your-key.pem ec2-user@your-ec2-public-ip
```

### On Amazon Linux 2023:
```bash
sudo dnf update -y
sudo dnf install -y docker git
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user

# Install Docker Compose Plugin
DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
mkdir -p $DOCKER_CONFIG/cli-plugins
curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m) -o $DOCKER_CONFIG/cli-plugins/docker-compose
chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose

# Log out and back in to apply group permissions
exit
```

### On Ubuntu (22.04 / 24.04):
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-v2 git
sudo systemctl enable --now docker
sudo usermod -aG docker ubuntu
exit
```

---

## 4. Deployment Option A: Docker Compose on EC2 (Recommended)

### Step 1: Clone or Copy Project Code
```bash
git clone <your-repository-url> /opt/nutricount-backend
cd /opt/nutricount-backend
```

### Step 2: Configure Production `.env`
Copy `.env.example` to `.env` and fill in production secrets:
```bash
cp .env.example .env
nano .env
```
Ensure your database credentials point to your AWS RDS endpoint:
```env
PORT=5000
NODE_ENV=production
DB_HOST=database-1.xxxxxx.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_rds_password
JWT_ACCESS_SECRET=your_32_character_minimum_access_secret_here
JWT_REFRESH_SECRET=your_32_character_minimum_refresh_secret_here
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
FRONTEND_URL=https://app.yourdomain.com
```

### Step 3: Launch with Docker Compose
```bash
# Build and run backend container in background
docker compose up -d --build
```

*(Optional) If you also want to run the FastAPI AI microservice on the same instance:*
```bash
docker compose --profile full up -d --build
```

### Step 4: Verify Container Health & Logs
```bash
# Check container status (should show 'healthy')
docker compose ps

# View live server logs
docker compose logs -f backend
```

Test the health endpoint from EC2:
```bash
curl http://localhost:5000/health
# Response: {"status":"ok"}
```

---

## 5. Deployment Option B: Deploying directly from Docker Hub (Fastest)

Since the image is already pushed to Docker Hub (`danishpc/nutricount-backend:latest` and `danishpc/nutricount-backend:1.0.0`), you don't even need to build the code on EC2.

On your EC2 instance:
```bash
# 1. Pull the image from Docker Hub
docker pull danishpc/nutricount-backend:latest

# 2. Run the container with environment variables and persistent storage
docker run -d \
  --name nutricount-backend \
  --restart unless-stopped \
  -p 5000:5000 \
  --env-file .env \
  -v nutricount-uploads:/app/uploads \
  danishpc/nutricount-backend:latest

# 3. Check status & logs
docker ps
docker logs -f nutricount-backend
```

---

## 6. Deployment Option C: AWS ECR (Elastic Container Registry)

If you prefer building the image locally or in GitHub Actions CI/CD and pushing to Amazon ECR:

### Step 1: Create ECR Repository (AWS CLI)
```bash
aws ecr create-repository --repository-name nutricount-backend --region us-east-1
```

### Step 2: Authenticate Docker to ECR
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com
```

### Step 3: Build, Tag, and Push
```bash
docker build -t nutricount-backend:latest .
docker tag nutricount-backend:latest <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com/nutricount-backend:latest
docker push <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com/nutricount-backend:latest
```

### Step 4: Pull and Run on EC2
On your EC2 instance:
```bash
# Login to ECR on EC2
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com

# Pull the latest image
docker pull <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com/nutricount-backend:latest

# Run the container with persistent uploads volume and restart policy
docker run -d \
  --name nutricount-backend \
  --restart unless-stopped \
  -p 5000:5000 \
  --env-file .env \
  -v nutricount-uploads:/app/uploads \
  <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com/nutricount-backend:latest
```

---

## 7. Production Reverse Proxy with Nginx & SSL (Let's Encrypt)

For production, route incoming HTTPS traffic on port 443 to container port 5000:

1. Install Nginx & Certbot on EC2:
   ```bash
   sudo apt install -y nginx certbot python3-certbot-nginx   # Ubuntu
   # or on Amazon Linux 2023:
   # sudo dnf install -y nginx python3-certbot-nginx
   ```

2. Configure `/etc/nginx/conf.d/nutricount.conf`:
   ```nginx
   server {
       server_name api.yourdomain.com;

       location / {
           proxy_pass http://127.0.0.1:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           client_max_body_size 50M;
       }
   }
   ```

3. Obtain SSL Certificate:
   ```bash
   sudo certbot --nginx -d api.yourdomain.com
   sudo systemctl restart nginx
   ```

---

## 8. Useful Operational Commands

| Action | Command |
|---|---|
| View container logs | `docker logs -f nutricount-backend` |
| View compose logs | `docker compose logs -f backend` |
| Restart backend | `docker compose restart backend` |
| Redeploy after code update | `git pull && docker compose up -d --build` |
| Check memory/CPU usage | `docker stats` |
| Inspect healthcheck logs | `docker inspect --format "{{json .State.Health}}" nutricount-backend` |
| Prune old unused images | `docker image prune -f` |


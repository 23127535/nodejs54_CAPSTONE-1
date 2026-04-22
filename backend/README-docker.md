# Docker Deployment Guide

This guide covers deploying the backend using Docker and Docker Compose.

## Prerequisites

- Docker (20.10+)
- Docker Compose (2.0+)
- Git (optional, if pulling from repository)

## Quick Start

1. **Clone the repository and navigate to backend directory**

```bash
cd nodejs54_capstone1/backend
```

2. **Create environment file**

```bash
cp .env.example .env
```

Edit `.env` and set your values:

```env
# Database (Docker auto-constructs DATABASE_URL from these)
MYSQL_ROOT_PASSWORD=your_root_password
MYSQL_DATABASE=image_gallery_db
MYSQL_USER=capstone_user
MYSQL_PASSWORD=your_user_password

# JWT Secrets (generate with: openssl rand -base64 64)
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret

# Server
PORT=3069
NODE_ENV=production

# CORS (add your frontend URL, comma-separated)
CORS_ORIGIN="https://your-frontend.vercel.app,http://localhost:5173"
```

**Note:** The `DATABASE_URL` is automatically constructed by Docker Compose using the MYSQL_* variables and pointing to the `db` service. Do not set `DATABASE_URL` manually in `.env` when using Docker Compose.

3. **Build and start the services**

```bash
# Build and start in detached mode
docker-compose up -d --build

# View logs
docker-compose logs -f backend
docker-compose logs -f db
```

4. **Run database migrations**

```bash
# Push Prisma schema to database
docker-compose exec backend npx prisma db push

# Optional: seed the database
docker-compose exec backend npm run prisma:seed
```

5. **Access the API**

- API: http://localhost:3069/api
- API Documentation: http://localhost:3069/api-docs
- Database: localhost:3306

## Common Commands

```bash
# Stop services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v

# Restart a service
docker-compose restart backend

# View logs
docker-compose logs -f

# Execute a command in the backend container
docker-compose exec backend sh

# Check service status
docker-compose ps

# Rebuild after code changes
docker-compose up -d --build
```

## Production Deployment with Nginx Reverse Proxy

For production, use Nginx as a reverse proxy with SSL termination.

### 1. Deploy with Docker on your VPS

```bash
# On your VPS
git clone https://github.com/your-repo.git
cd nodejs54_capstone1/backend

# Copy environment file
nano .env  # Set production values

# Start services
docker-compose up -d --build
```

### 2. Configure Nginx

Create `/etc/nginx/sites-available/capstone-api`:

```nginx
server {
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3069;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and test:

```bash
sudo ln -s /etc/nginx/sites-available/capstone-api /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d api.yourdomain.com
```

### 3. Update CORS

Add your production domain to `server.js`:

```javascript
origin: [
  "http://localhost:5173",
  "https://nodejs54-capstone-1.vercel.app",
  "https://yourdomain.com"
]
```

Rebuild and restart:

```bash
docker-compose up -d --build
```

### 4. Update Vercel Environment Variable

In Vercel dashboard → Settings → Environment Variables:

```
VITE_API_URL = https://api.yourdomain.com/api
```

Redeploy your frontend.

## Without a Domain: Cloudflare Tunnel

If you don't have a domain, use Cloudflare Tunnel for free HTTPS:

```bash
# Install cloudflared on your VPS
# Follow: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/

# Create a tunnel that routes to localhost:3069
cloudflared tunnel create capstone-api
cloudflared tunnel route dns capstone-api capstone-api.your-subdomain.workers.dev
cloudflared tunnel run capstone-api
```

Or use the config file:

```yaml
tunnel: <tunnel-id>
credentials-file: /root/.cloudflared/<tunnel-id>.json
ingress:
  - hostname: capstone-api.your-subdomain.workers.dev
    service: http://localhost:3069
  - service: http_status:404
```

## Backup Database

```bash
# Backup
docker-compose exec db mysqldump -u root -p"${MYSQL_ROOT_PASSWORD}" image_gallery_db > backup.sql

# Restore
docker-compose exec -T db mysql -u root -p"${MYSQL_ROOT_PASSWORD}" image_gallery_db < backup.sql
```

## Monitoring

```bash
# View resource usage
docker stats

# Check container logs
docker-compose logs -f backend

# Enter container shell
docker-compose exec backend sh

# View running processes
docker-compose exec backend ps aux
```

## Updating the Application

1. Pull latest code
2. Rebuild and restart:
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

## Troubleshooting

### Database connection errors
- Ensure `DATABASE_URL` uses `db` as host (Docker service name)
- Check that the database container is healthy: `docker-compose ps`
- Verify credentials in `.env`

### Port already in use
Change `PORT` in `.env` or modify the port mapping in `docker-compose.yml`.

### Permission errors on uploads
The Dockerfile creates the uploads directory with correct permissions. If issues persist:
```bash
docker-compose exec backend chown -R nodejs:nodejs /app/uploads
```

### Prisma client not found
Rebuild to regenerate Prisma client:
```bash
docker-compose build --no-cache backend
docker-compose up -d
```

## Security Notes

- Change default passwords in `.env`
- Use strong JWT secrets (minimum 256-bit entropy)
- Keep Docker images updated: `docker-compose pull` then rebuild
- Use HTTPS in production (with Nginx + Certbot or Cloudflare Tunnel)
- Limit database access to the backend container only
- Regularly backup your database

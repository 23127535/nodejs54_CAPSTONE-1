
1. On your VPS — Install Node.js & PM2
bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
# Install PM2 (process manager to keep backend running)
npm install -g pm2
2. On your VPS — Deploy the backend
bash
# Clone your repo
git clone https://github.com/your-repo.git
cd nodejs54_capstone1/backend
# Install dependencies
npm install
# Create .env with your DB and JWT secrets
nano .env
# Start with PM2
pm2 start npm --name "capstone-backend" -- run dev
pm2 save
pm2 startup
3. On your VPS — Open port & get HTTPS with Nginx
Browsers require HTTPS for your backend when Vercel is HTTPS. Install Nginx + SSL:

bash
sudo apt install -y nginx certbot python3-certbot-nginx
# Create Nginx config
sudo nano /etc/nginx/sites-available/capstone-api
Nginx config:

nginx
server {
    server_name api.yourdomain.com;
    location / {
        proxy_pass http://localhost:3069;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
bash
sudo ln -s /etc/nginx/sites-available/capstone-api /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
# Get free SSL certificate
sudo certbot --nginx -d api.yourdomain.com
If you don't have a domain, you can use your VPS's IP directly but you need to handle SSL another way (e.g., Cloudflare Tunnel — free, no domain needed).

4. Update backend CORS
Update server.js with your Vercel URL:

js
origin: [
  "http://localhost:5173",           // local dev
  "https://nodejs54-capstone-1.vercel.app"  // production
]
5. Set Vercel environment variable
In Vercel dashboard → Settings → Environment Variables:

VITE_API_URL = https://api.yourdomain.com/api
Then redeploy:

bash
vercel --prod
No domain? Use Cloudflare Tunnel (Free)
If you don't have a domain, Cloudflare Tunnel gives you HTTPS for free without any domain or port forwarding:

bash
# On your VPS
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared
./cloudflared tunnel --url http://localhost:3069
It will print a URL like https://random-name.trycloudflare.com — use that as your VITE_API_URL.

Summary
What	Where
Frontend (React/Vite)	Vercel
Backend (Node.js/Express)	Your VPS (via PM2)
Reverse proxy + HTTPS	Nginx + Certbot
Database (MySQL)	Your VPS
Environment variable	Set VITE_API_URL in Vercel

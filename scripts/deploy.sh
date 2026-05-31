#!/bin/bash
# Skrypt wdrożenia aplikacji na AWS EC2 (Amazon Linux 2023, t2.micro/t3.micro)
# Uruchom na świeżej instancji EC2 jako użytkownik ec2-user:
#   chmod +x deploy.sh && ./deploy.sh

set -e  # Zatrzymaj skrypt przy pierwszym błędzie

APP_DIR="/home/ec2-user/events-platform"
APP_NAME="events-platform"
REPO_URL="https://github.com/Loxingrgmws/events-platform.git"

echo "======================================="
echo " Wdrożenie Platformy Wydarzeń Lokalnych"
echo " Amazon Linux 2023 + Node.js + Nginx"
echo "======================================="

# 1. Aktualizacja pakietów systemowych
echo "[1/9] Aktualizacja pakietów..."
sudo dnf update -y

# 2. Instalacja Node.js 20 LTS (dostępny bezpośrednio w repozytoriach AL2023)
echo "[2/9] Instalacja Node.js 20 LTS..."
sudo dnf install -y nodejs npm

# 3. Instalacja PM2 — globalny process manager dla Node.js
echo "[3/9] Instalacja PM2..."
sudo npm install -g pm2

# 4. Instalacja Nginx — reverse proxy
echo "[4/9] Instalacja Nginx..."
sudo dnf install -y nginx

# 5. Klonowanie lub aktualizacja kodu aplikacji
echo "[5/9] Pobieranie kodu z GitHub..."
if [ -d "$APP_DIR" ]; then
  cd "$APP_DIR" && git pull origin main
else
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

# 6. Instalacja zależności Node.js (tylko produkcyjne)
echo "[6/9] Instalacja zależności npm..."
cd "$APP_DIR"
npm install --production

# 7. Uruchomienie aplikacji przez PM2
echo "[7/9] Uruchamianie aplikacji przez PM2..."
pm2 delete "$APP_NAME" 2>/dev/null || true
pm2 start server.js --name "$APP_NAME"

# 8. PM2 auto-start po restarcie serwera
echo "[8/9] Konfiguracja auto-startu PM2..."
pm2 startup | tail -1 | sudo bash
pm2 save

# 9. Konfiguracja Nginx jako reverse proxy (port 80 → 3000)
# Na Amazon Linux 2023 Nginx używa /etc/nginx/conf.d/ zamiast sites-available
echo "[9/9] Konfiguracja Nginx reverse proxy..."
sudo tee /etc/nginx/conf.d/"$APP_NAME".conf > /dev/null <<EOF
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Usunięcie domyślnej konfiguracji Nginx (blokuje port 80)
sudo rm -f /etc/nginx/conf.d/default.conf

# Włączenie i restart Nginx
sudo systemctl enable nginx
sudo nginx -t && sudo systemctl restart nginx

echo ""
echo "======================================="
echo " Wdrożenie zakończone pomyślnie!"
echo " Aplikacja dostępna na porcie 80"
echo " Status PM2: pm2 status"
echo " Logi:       pm2 logs $APP_NAME"
echo "======================================="

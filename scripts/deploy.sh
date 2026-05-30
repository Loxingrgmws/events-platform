#!/bin/bash
# Skrypt wdrożenia aplikacji na AWS EC2 (Ubuntu 22.04, t2.micro)
# Uruchom na świeżej instancji EC2 jako użytkownik ubuntu:
#   chmod +x deploy.sh && ./deploy.sh

set -e  # Zatrzymaj skrypt przy pierwszym błędzie

APP_DIR="/home/ubuntu/events-platform"
APP_NAME="events-platform"
REPO_URL="https://github.com/TWOJ_UZYTKOWNIK/events-platform.git"  # Zmień na swoje repo

echo "======================================="
echo " Wdrożenie Platformy Wydarzeń Lokalnych"
echo "======================================="

# 1. Aktualizacja listy pakietów
echo "[1/9] Aktualizacja pakietów..."
sudo apt-get update -y

# 2. Instalacja Node.js 20 LTS przez NodeSource
echo "[2/9] Instalacja Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Instalacja PM2 — globalny process manager
echo "[3/9] Instalacja PM2..."
sudo npm install -g pm2

# 4. Instalacja Nginx — reverse proxy
echo "[4/9] Instalacja i konfiguracja Nginx..."
sudo apt-get install -y nginx

# 5. Klonowanie lub aktualizacja kodu aplikacji
echo "[5/9] Pobieranie kodu aplikacji..."
if [ -d "$APP_DIR" ]; then
  cd "$APP_DIR" && git pull origin main
else
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

# 6. Instalacja zależności Node.js (tylko produkcyjne)
echo "[6/9] Instalacja zależności npm..."
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
echo "[9/9] Konfiguracja Nginx reverse proxy..."
sudo tee /etc/nginx/sites-available/"$APP_NAME" > /dev/null <<EOF
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

# Aktywacja konfiguracji i restart Nginx
sudo ln -sf /etc/nginx/sites-available/"$APP_NAME" /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "======================================="
echo " Wdrożenie zakończone pomyślnie!"
echo " Aplikacja dostępna na porcie 80"
echo " Status PM2: pm2 status"
echo " Logi:       pm2 logs $APP_NAME"
echo "======================================="

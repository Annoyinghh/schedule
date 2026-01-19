#!/bin/bash

# 配置HTTPS反向代理

echo "========================================="
echo "📅 配置HTTPS反向代理"
echo "========================================="

# 1. 安装Nginx
echo ""
echo "📦 步骤 1/5: 安装Nginx..."
sudo apt-get update
sudo apt-get install -y nginx

# 2. 生成自签名SSL证书
echo ""
echo "📦 步骤 2/5: 生成SSL证书..."
sudo mkdir -p /etc/nginx/ssl
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/schedule.key \
  -out /etc/nginx/ssl/schedule.crt \
  -subj "/C=CN/ST=Guangdong/L=Guangzhou/O=Schedule/CN=171.80.9.175"

# 3. 停止Nginx
echo ""
echo "📦 步骤 3/5: 停止旧的Nginx..."
sudo service nginx stop 2>/dev/null || true

# 4. 配置Nginx
echo ""
echo "📦 步骤 4/5: 配置Nginx..."
sudo tee /etc/nginx/sites-available/schedule > /dev/null <<'EOF'
server {
    listen 443 ssl;
    server_name 171.80.9.175;

    ssl_certificate /etc/nginx/ssl/schedule.crt;
    ssl_certificate_key /etc/nginx/ssl/schedule.key;
    ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location /api/ {
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Content-Type' always;
            return 204;
        }

        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type' always;

        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# 启用配置
sudo ln -sf /etc/nginx/sites-available/schedule /etc/nginx/sites-enabled/schedule
sudo rm -f /etc/nginx/sites-enabled/default

# 5. 测试并启动Nginx
echo ""
echo "📦 步骤 5/5: 测试并启动Nginx..."
if sudo nginx -t; then
    sudo service nginx start
    echo ""
    echo "========================================="
    echo "✅ HTTPS配置完成！"
    echo "========================================="
    echo ""
    echo "📋 配置信息:"
    echo "  HTTPS地址: https://171.80.9.175/api/"
    echo ""
    echo "🧪 测试命令:"
    echo "  curl -k https://171.80.9.175/api/health"
    echo ""
else
    echo ""
    echo "❌ Nginx配置测试失败！"
    echo "请检查配置文件: /etc/nginx/sites-available/schedule"
    exit 1
fi

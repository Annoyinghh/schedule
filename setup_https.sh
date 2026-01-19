#!/bin/bash

# 配置HTTPS反向代理

echo "========================================="
echo "📅 配置HTTPS反向代理"
echo "========================================="

# 1. 安装Nginx
echo ""
echo "📦 步骤 1/4: 安装Nginx..."
sudo apt-get update
sudo apt-get install -y nginx

# 2. 生成自签名SSL证书
echo ""
echo "📦 步骤 2/4: 生成SSL证书..."
sudo mkdir -p /etc/nginx/ssl
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/schedule.key \
  -out /etc/nginx/ssl/schedule.crt \
  -subj "/C=CN/ST=Guangdong/L=Guangzhou/O=Schedule/CN=171.80.9.175"

# 3. 配置Nginx
echo ""
echo "📦 步骤 3/4: 配置Nginx..."
sudo tee /etc/nginx/sites-available/schedule > /dev/null <<'EOF'
server {
    listen 443 ssl;
    server_name 171.80.9.175;

    ssl_certificate /etc/nginx/ssl/schedule.crt;
    ssl_certificate_key /etc/nginx/ssl/schedule.key;

    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # CORS headers
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Content-Type' always;
            return 204;
        }
        
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type' always;
    }
}
EOF

# 启用配置
sudo ln -sf /etc/nginx/sites-available/schedule /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 4. 重启Nginx
echo ""
echo "📦 步骤 4/4: 重启Nginx..."
sudo nginx -t
sudo service nginx restart

echo ""
echo "========================================="
echo "✅ HTTPS配置完成！"
echo "========================================="
echo ""
echo "📋 配置信息:"
echo "  HTTPS地址: https://171.80.9.175/api/"
echo "  证书类型: 自签名证书"
echo ""
echo "⚠️  注意事项:"
echo "  1. 浏览器会提示证书不安全，需要手动信任"
echo "  2. 首次访问 https://171.80.9.175 时点击「高级」→「继续访问」"
echo ""
echo "🧪 测试命令:"
echo "  curl -k https://171.80.9.175/api/health"
echo ""

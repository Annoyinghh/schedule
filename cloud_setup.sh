#!/bin/bash

# 一键部署脚本 - 完整部署云服务器

echo "========================================="
echo "📅 日程管理系统 - 一键部署"
echo "========================================="
echo ""
echo "此脚本将完成以下操作:"
echo "  1. 部署API服务器"
echo "  2. 配置HTTPS反向代理"
echo "  3. 设置定时提醒"
echo "  4. 测试所有功能"
echo ""
read -p "按回车键继续，或按 Ctrl+C 取消..."

# 步骤1: 部署基础服务
echo ""
echo "========================================="
echo "步骤 1/3: 部署基础服务"
echo "========================================="
chmod +x deploy.sh
./deploy.sh

if [ $? -ne 0 ]; then
    echo "❌ 基础服务部署失败"
    exit 1
fi

# 步骤2: 配置HTTPS
echo ""
echo "========================================="
echo "步骤 2/3: 配置HTTPS反向代理"
echo "========================================="
chmod +x setup_https.sh
./setup_https.sh

if [ $? -ne 0 ]; then
    echo "❌ HTTPS配置失败"
    exit 1
fi

# 步骤3: 测试功能
echo ""
echo "========================================="
echo "步骤 3/3: 测试功能"
echo "========================================="

echo ""
echo "🧪 测试1: HTTP API..."
if curl -s http://localhost:3000/api/health | grep -q success; then
    echo "✅ HTTP API 正常"
else
    echo "❌ HTTP API 失败"
fi

echo ""
echo "🧪 测试2: HTTPS API..."
if curl -k -s https://171.80.9.175/api/health | grep -q success; then
    echo "✅ HTTPS API 正常"
else
    echo "❌ HTTPS API 失败"
fi

echo ""
echo "🧪 测试3: 提醒功能..."
echo "即将发送测试通知到微信..."
read -p "按回车键继续测试提醒功能..."
node test_reminder.js

# 完成
echo ""
echo "========================================="
echo "🎉 部署完成！"
echo "========================================="
echo ""
echo "📋 服务状态:"
echo ""
ps aux | grep -v grep | grep api_server.js && echo "✅ API服务器运行中" || echo "❌ API服务器未运行"
sudo service nginx status | grep -q running && echo "✅ Nginx运行中" || echo "❌ Nginx未运行"
crontab -l | grep -q cloud_reminder && echo "✅ 定时任务已设置" || echo "❌ 定时任务未设置"

echo ""
echo "📋 重要信息:"
echo "  API地址: https://171.80.9.175/api"
echo "  提醒时间: 每天早上 7:00"
echo "  数据文件: ~/schedule-reminder/events_data.json"
echo ""
echo "📋 下一步:"
echo "  1. 在网页中测试添加事件"
echo "  2. 检查浏览器控制台是否有错误"
echo "  3. 在服务器查看数据文件是否更新"
echo ""
echo "📋 查看日志:"
echo "  tail -f ~/schedule-reminder/api.log"
echo "  tail -f ~/schedule-reminder/reminder.log"
echo ""

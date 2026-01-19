#!/bin/bash

# 日程管理系统 - 云服务器部署脚本

echo "========================================="
echo "📅 日程管理系统 - 云服务器部署"
echo "========================================="

# 1. 创建工作目录
echo ""
echo "📦 步骤 1/5: 创建工作目录..."
mkdir -p ~/schedule-reminder
cd ~/schedule-reminder

# 2. 下载文件（如果从GitHub下载）
echo ""
echo "📦 步骤 2/5: 检查文件..."
if [ ! -f "api_server.js" ]; then
    echo "⚠️ 文件不存在，请先上传以下文件到 ~/schedule-reminder/:"
    echo "  - api_server.js"
    echo "  - cloud_reminder.js"
    echo "  - test_reminder.js"
    exit 1
fi

# 3. 停止旧进程
echo ""
echo "📦 步骤 3/5: 停止旧进程..."
pkill -f api_server.js 2>/dev/null || true
sleep 2

# 4. 启动API服务器（后台运行）
echo ""
echo "📦 步骤 4/5: 启动API服务器..."
nohup node api_server.js > api.log 2>&1 &
sleep 3

# 5. 设置定时任务（每天早上7:00）
echo ""
echo "📦 步骤 5/5: 设置定时任务..."
(crontab -l 2>/dev/null | grep -v "cloud_reminder.js"; echo "0 7 * * * cd ~/schedule-reminder && node cloud_reminder.js >> ~/schedule-reminder/reminder.log 2>&1") | crontab -

# 验证部署
echo ""
echo "========================================="
echo "✅ 部署完成！"
echo "========================================="
echo ""

# 检查API服务器
if ps aux | grep -v grep | grep api_server.js > /dev/null; then
    echo "✅ API服务器运行中"
    echo "   进程ID: $(ps aux | grep -v grep | grep api_server.js | awk '{print $2}')"
    echo "   地址: http://0.0.0.0:3000"
else
    echo "❌ API服务器未运行"
    echo "   请检查日志: tail -f ~/schedule-reminder/api.log"
fi

# 检查定时任务
echo ""
echo "✅ 定时任务已设置"
echo "   时间: 每天早上 7:00"
echo "   命令: $(crontab -l | grep cloud_reminder.js)"

# 测试API
echo ""
echo "🧪 测试API服务器..."
sleep 2
if curl -s http://localhost:3000/api/health | grep -q success; then
    echo "✅ API测试成功"
else
    echo "❌ API测试失败"
    echo "   请检查日志: tail -f ~/schedule-reminder/api.log"
fi

echo ""
echo "========================================="
echo "📋 下一步操作"
echo "========================================="
echo ""
echo "1. 配置HTTPS反向代理（必须）:"
echo "   chmod +x setup_https.sh"
echo "   ./setup_https.sh"
echo ""
echo "2. 测试HTTPS连接:"
echo "   curl -k https://171.80.9.175/api/health"
echo ""
echo "3. 测试提醒功能:"
echo "   node test_reminder.js"
echo ""
echo "========================================="
echo "📋 常用命令"
echo "========================================="
echo ""
echo "查看API日志:"
echo "  tail -f ~/schedule-reminder/api.log"
echo ""
echo "查看提醒日志:"
echo "  tail -f ~/schedule-reminder/reminder.log"
echo ""
echo "手动测试提醒:"
echo "  cd ~/schedule-reminder && node cloud_reminder.js"
echo ""
echo "重启API服务器:"
echo "  pkill -f api_server.js"
echo "  cd ~/schedule-reminder && nohup node api_server.js > api.log 2>&1 &"
echo ""
echo "查看运行状态:"
echo "  ps aux | grep api_server.js"
echo ""

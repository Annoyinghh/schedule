#!/bin/bash

# 日程管理系统 - 完整部署脚本
# 适用于已安装Node.js的服务器

echo "========================================="
echo "📅 日程管理系统 - 完整部署"
echo "========================================="

# 3. 启动API服务器（后台运行）
echo ""
echo "📦 步骤 3/4: 启动API服务器..."
nohup node api_server.js > api.log 2>&1 &
sleep 2

# 4. 设置定时任务（每天早上7:00）
echo ""
echo "📦 步骤 4/4: 设置定时任务..."
(crontab -l 2>/dev/null | grep -v "cloud_reminder"; echo "0 7 * * * cd ~/schedule-reminder && node cloud_reminder.js >> reminder.log 2>&1") | crontab -

# 验证部署
echo ""
echo "========================================="
echo "✅ 部署完成！"
echo "========================================="
echo ""

# 检查API服务器
if ps aux | grep -v grep | grep api_server.js > /dev/null; then
    echo "✅ API服务器运行中"
    echo "   地址: http://0.0.0.0:3000"
else
    echo "❌ API服务器未运行"
fi

# 检查定时任务
echo ""
echo "✅ 定时任务已设置"
echo "   时间: 每天早上 7:00"
crontab -l | grep cloud_reminder

# 测试API
echo ""
echo "🧪 测试API服务器..."
sleep 1
curl -s http://localhost:3000/api/health | grep -q success && echo "✅ API测试成功" || echo "❌ API测试失败"

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
echo "  pkill -f api_server.js && cd ~/schedule-reminder && nohup node api_server.js > api.log 2>&1 &"
echo ""
echo "查看定时任务:"
echo "  crontab -l"
echo ""

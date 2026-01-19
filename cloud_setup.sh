#!/bin/bash

# 日程管理系统 - 简化部署脚本（适用于 Ubuntu 14.04）

echo "========================================="
echo "📅 日程管理系统 - 简化部署"
echo "========================================="

# 1. 检查 Node.js
echo ""
echo "📦 检查 Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ 未检测到 Node.js"
    echo ""
    echo "请手动安装 Node.js："
    echo "  方法1: 使用 apt-get"
    echo "    sudo apt-get update"
    echo "    sudo apt-get install -y nodejs npm"
    echo ""
    echo "  方法2: 使用 nvm (推荐)"
    echo "    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    echo "    source ~/.bashrc"
    echo "    nvm install 10"
    echo ""
    echo "安装完成后，重新运行此脚本"
    exit 1
else
    echo "✅ Node.js 已安装: $(node -v)"
fi

# 2. 创建工作目录
echo ""
echo "📦 创建工作目录..."
mkdir -p ~/schedule-reminder
cd ~/schedule-reminder

# 3. 创建提醒脚本
echo ""
echo "📦 创建提醒脚本..."
cat > daily_reminder.js << 'EOFSCRIPT'
#!/usr/bin/env node

const https = require('https');

// 配置
const CONFIG = {
    SERVER_CHAN_KEY: 'SCT310265TyJ4D67VAfJfQTSj87381qEAY',
    REMINDER_DAYS: [14, 7, 3, 1],
    MILESTONES: [
        { date: "2026-03-15", name: "春季大考 (预估)", note: "3月1日开始停止娱乐，全力冲刺" },
        { date: "2026-03-20", name: "求职+基础期开始", note: "重点处理春招和重学基础" },
        { date: "2026-06-01", name: "求职+基础期结束", note: "" },
        { date: "2026-11-27", name: "年度大考·国考 (参考)", note: "11月进入全真模拟模式" },
        { date: "2026-12-07", name: "年度大考·省考 (参考)", note: "考完即止，长假休息" }
    ],
    CALENDAR_EVENTS: {
        "2026-01-20": "xzx"
    }
};

function sendWeChatNotification(title, content) {
    return new Promise((resolve) => {
        const postData = 'title=' + encodeURIComponent(title) + '&desp=' + encodeURIComponent(content);
        const options = {
            hostname: 'sctapi.ftqq.com',
            port: 443,
            path: '/' + CONFIG.SERVER_CHAN_KEY + '.send',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        const req = https.request(options, function(res) {
            var data = '';
            res.on('data', function(chunk) { data += chunk; });
            res.on('end', function() {
                try {
                    var result = JSON.parse(data);
                    if (result.code === 0) {
                        console.log('✅ 发送成功: ' + title);
                        resolve(true);
                    } else {
                        console.log('❌ 发送失败: ' + result.message);
                        resolve(false);
                    }
                } catch (e) {
                    console.log('❌ 解析失败');
                    resolve(false);
                }
            });
        });
        req.on('error', function(e) {
            console.log('❌ 请求失败: ' + e.message);
            resolve(false);
        });
        req.write(postData);
        req.end();
    });
}

function getDaysDiff(dateStr) {
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);
    return Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
}

function checkAndSendReminders() {
    console.log('\n🔍 开始检查提醒...');
    console.log('📅 当前时间: ' + new Date().toLocaleString('zh-CN'));
    
    var reminders = [];
    var i, daysUntil;
    
    // 检查里程碑
    for (i = 0; i < CONFIG.MILESTONES.length; i++) {
        var milestone = CONFIG.MILESTONES[i];
        daysUntil = getDaysDiff(milestone.date);
        console.log('  - ' + milestone.name + ': 还有 ' + daysUntil + ' 天');
        if (CONFIG.REMINDER_DAYS.indexOf(daysUntil) !== -1) {
            reminders.push({ type: 'milestone', data: milestone, daysUntil: daysUntil });
        }
    }
    
    // 检查月历事件
    for (var dateStr in CONFIG.CALENDAR_EVENTS) {
        var eventName = CONFIG.CALENDAR_EVENTS[dateStr];
        daysUntil = getDaysDiff(dateStr);
        console.log('  - ' + eventName + ': 还有 ' + daysUntil + ' 天');
        if (CONFIG.REMINDER_DAYS.indexOf(daysUntil) !== -1) {
            reminders.push({ 
                type: 'calendar', 
                data: { date: dateStr, name: eventName, note: '来自月历' },
                daysUntil: daysUntil 
            });
        }
    }
    
    // 发送提醒
    if (reminders.length > 0) {
        console.log('\n📤 准备发送 ' + reminders.length + ' 条提醒');
        var index = 0;
        function sendNext() {
            if (index >= reminders.length) {
                console.log('\n✅ 全部发送完成！\n');
                process.exit(0);
                return;
            }
            var reminder = reminders[index];
            var title = '🔔 日程提醒 (' + reminder.daysUntil + '天后)';
            var content = '## 重要提醒\n\n距离「**' + reminder.data.name + '**」还有 **' + reminder.daysUntil + '** 天！\n\n**日期：** ' + reminder.data.date + '\n' + (reminder.data.note ? '**备注：** ' + reminder.data.note + '\n' : '') + '\n请做好准备！💪';
            sendWeChatNotification(title, content).then(function() {
                index++;
                setTimeout(sendNext, 1000);
            });
        }
        sendNext();
    } else {
        console.log('\n✅ 今天没有需要提醒的事件\n');
        process.exit(0);
    }
}

console.log('========================================');
console.log('📅 日程管理系统 - 每日自动提醒');
console.log('========================================');
checkAndSendReminders();
EOFSCRIPT

chmod +x daily_reminder.js

# 4. 测试运行
echo ""
echo "📦 测试运行..."
node daily_reminder.js

# 5. 设置定时任务
echo ""
echo "📦 设置定时任务..."
(crontab -l 2>/dev/null | grep -v "daily_reminder.js"; echo "0 7 * * * cd ~/schedule-reminder && node daily_reminder.js >> ~/schedule-reminder/reminder.log 2>&1") | crontab -

echo ""
echo "========================================="
echo "✅ 部署完成！"
echo "========================================="
echo ""
echo "📋 配置信息:"
echo "  - 工作目录: ~/schedule-reminder"
echo "  - 运行时间: 每天早上 7:00"
echo ""
echo "🧪 手动测试:"
echo "  cd ~/schedule-reminder && node daily_reminder.js"
echo ""
echo "📝 查看日志:"
echo "  tail -f ~/schedule-reminder/reminder.log"
echo ""

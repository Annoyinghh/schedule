#!/bin/bash

# 日程管理系统 - 云主机部署脚本
# 适用于 Ubuntu 14.04

echo "========================================="
echo "📅 日程管理系统 - 云主机自动部署"
echo "========================================="

# 1. 更新系统
echo ""
echo "📦 步骤 1/5: 更新系统..."
sudo apt-get update

# 2. 安装 Node.js
echo ""
echo "📦 步骤 2/5: 安装 Node.js..."
if ! command -v node &> /dev/null; then
    echo "正在安装 Node.js 10.x (适用于 Ubuntu 14.04)..."
    curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo "✅ Node.js 安装完成"
else
    echo "✅ Node.js 已安装: $(node -v)"
fi

# 3. 创建工作目录
echo ""
echo "📦 步骤 3/5: 创建工作目录..."
mkdir -p ~/schedule-reminder
cd ~/schedule-reminder

# 4. 下载提醒脚本
echo ""
echo "📦 步骤 4/5: 下载提醒脚本..."
cat > daily_reminder.js << 'EOF'
#!/usr/bin/env node

/**
 * 日程管理系统 - 每日自动提醒脚本
 */

const https = require('https');

// ========== 配置区域 ==========
const CONFIG = {
    SERVER_CHAN_KEY: 'SCT310265TyJ4D67VAfJfQTSj87381qEAY',
    PHONE: '15914969166',
    EMAIL: '1875512848@qq.com',
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

// 发送微信通知
function sendWeChatNotification(title, content) {
    return new Promise((resolve, reject) => {
        const postData = `title=${encodeURIComponent(title)}&desp=${encodeURIComponent(content)}`;
        
        const options = {
            hostname: 'sctapi.ftqq.com',
            port: 443,
            path: `/${CONFIG.SERVER_CHAN_KEY}.send`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (result.code === 0) {
                        console.log(`✅ 微信通知发送成功: ${title}`);
                        resolve(true);
                    } else {
                        console.error(`❌ 微信通知发送失败: ${result.message}`);
                        resolve(false);
                    }
                } catch (e) {
                    console.error('❌ 解析响应失败:', e);
                    resolve(false);
                }
            });
        });
        
        req.on('error', (e) => {
            console.error('❌ 请求失败:', e);
            reject(e);
        });
        
        req.write(postData);
        req.end();
    });
}

// 计算日期差
function getDaysDiff(dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);
    return Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
}

// 检查并发送提醒
async function checkAndSendReminders() {
    console.log('\n🔍 开始检查提醒事件...');
    console.log(`📅 当前日期: ${new Date().toLocaleDateString('zh-CN')}`);
    
    let sentCount = 0;
    const reminders = [];
    
    // 检查里程碑
    for (const milestone of CONFIG.MILESTONES) {
        const daysUntil = getDaysDiff(milestone.date);
        console.log(`  - ${milestone.name}: 还有 ${daysUntil} 天`);
        if (CONFIG.REMINDER_DAYS.includes(daysUntil)) {
            reminders.push({ type: 'milestone', ...milestone, daysUntil });
        }
    }
    
    // 检查月历事件
    for (const [dateStr, eventName] of Object.entries(CONFIG.CALENDAR_EVENTS)) {
        const daysUntil = getDaysDiff(dateStr);
        console.log(`  - ${eventName}: 还有 ${daysUntil} 天`);
        if (CONFIG.REMINDER_DAYS.includes(daysUntil)) {
            reminders.push({ type: 'calendar', date: dateStr, name: eventName, note: '来自月历', daysUntil });
        }
    }
    
    // 发送提醒
    if (reminders.length > 0) {
        console.log(`\n📤 准备发送 ${reminders.length} 条提醒:`);
        for (const reminder of reminders) {
            const title = `🔔 日程提醒 (${reminder.daysUntil}天后)`;
            const content = `## 重要提醒\n\n距离「**${reminder.name}**」还有 **${reminder.daysUntil}** 天！\n\n**日期：** ${reminder.date}\n${reminder.note ? `**备注：** ${reminder.note}\n` : ''}\n请做好准备！💪\n\n---\n*来自日程管理系统自动提醒*`;
            try {
                await sendWeChatNotification(title, content);
                sentCount++;
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (e) {
                console.error(`❌ 发送失败: ${reminder.name}`, e);
            }
        }
    } else {
        console.log('\n✅ 今天没有需要提醒的事件');
    }
    
    console.log(`\n✅ 检查完成！共发送 ${sentCount} 条提醒\n`);
}

// 主程序
async function main() {
    console.log('========================================');
    console.log('📅 日程管理系统 - 每日自动提醒');
    console.log('========================================');
    try {
        await checkAndSendReminders();
        process.exit(0);
    } catch (error) {
        console.error('❌ 执行失败:', error);
        process.exit(1);
    }
}

main();
EOF

chmod +x daily_reminder.js

# 5. 设置定时任务
echo ""
echo "📦 步骤 5/5: 设置定时任务..."
echo "正在配置 crontab，每天早上 8:00 自动运行..."

# 添加到 crontab
(crontab -l 2>/dev/null | grep -v "daily_reminder.js"; echo "0 8 * * * cd ~/schedule-reminder && /usr/bin/node daily_reminder.js >> ~/schedule-reminder/reminder.log 2>&1") | crontab -

echo ""
echo "========================================="
echo "✅ 部署完成！"
echo "========================================="
echo ""
echo "📋 配置信息:"
echo "  - 工作目录: ~/schedule-reminder"
echo "  - 脚本文件: ~/schedule-reminder/daily_reminder.js"
echo "  - 日志文件: ~/schedule-reminder/reminder.log"
echo "  - 运行时间: 每天早上 8:00"
echo ""
echo "🧪 测试命令:"
echo "  cd ~/schedule-reminder && node daily_reminder.js"
echo ""
echo "📝 查看日志:"
echo "  tail -f ~/schedule-reminder/reminder.log"
echo ""
echo "⚙️  修改配置:"
echo "  nano ~/schedule-reminder/daily_reminder.js"
echo ""
echo "🔔 现在可以立即测试一次，运行:"
echo "  cd ~/schedule-reminder && node daily_reminder.js"
echo ""

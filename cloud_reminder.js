#!/usr/bin/env node

/**
 * 日程管理系统 - 每日自动提醒脚本 V2
 * 从本地数据文件读取事件（由API服务器维护）
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
    SERVER_CHAN_KEY: 'SCT310265TyJ4D67VAfJfQTSj87381qEAY',
    REMINDER_DAYS: [14, 7, 3, 1],
    DATA_FILE: path.join(__dirname, 'events_data.json')
};

// 读取事件数据
function loadEvents() {
    try {
        if (fs.existsSync(CONFIG.DATA_FILE)) {
            const data = fs.readFileSync(CONFIG.DATA_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('❌ 读取数据失败:', e);
    }
    return {
        milestones: [],
        calendarEvents: {}
    };
}

// 发送微信通知
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

// 计算日期差
function getDaysDiff(dateStr) {
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);
    return Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
}

// 检查并发送提醒
function checkAndSendReminders() {
    console.log('\n🔍 开始检查提醒...');
    console.log('📅 当前时间: ' + new Date().toLocaleString('zh-CN'));
    
    // 读取事件数据
    const events = loadEvents();
    console.log('📂 加载事件数据:', {
        milestones: events.milestones.length,
        calendarEvents: Object.keys(events.calendarEvents).length
    });
    
    var reminders = [];
    var i, daysUntil;
    
    // 检查里程碑
    console.log('\n📌 检查里程碑:');
    for (i = 0; i < events.milestones.length; i++) {
        var milestone = events.milestones[i];
        daysUntil = getDaysDiff(milestone.date);
        console.log('  - ' + milestone.name + ': 还有 ' + daysUntil + ' 天');
        if (CONFIG.REMINDER_DAYS.indexOf(daysUntil) !== -1) {
            reminders.push({ type: 'milestone', data: milestone, daysUntil: daysUntil });
        }
    }
    
    // 检查月历事件
    console.log('\n📅 检查月历事件:');
    for (var dateStr in events.calendarEvents) {
        var eventName = events.calendarEvents[dateStr];
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
console.log('📅 日程管理系统 - 每日自动提醒 V2');
console.log('========================================');
checkAndSendReminders();

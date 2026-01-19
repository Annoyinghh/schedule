#!/usr/bin/env node

/**
 * 打卡提醒脚本 - 每10分钟检查一次
 */

var fs = require('fs');
var path = require('path');
var notification = require('./notification.js');

// 配置
var CONFIG = {
    CHECKIN_FILE: path.join(__dirname, 'checkin_data.json'),
    TIMELINE: [
        { time: "06:30 - 07:30", tag: "唤醒" },
        { time: "07:30 - 11:30", tag: "高能" },
        { time: "11:30 - 13:30", tag: "充电" },
        { time: "13:30 - 16:30", tag: "实战" },
        { time: "16:30 - 17:30", tag: "运动" },
        { time: "17:30 - 19:30", tag: "生活" },
        { time: "19:30 - 22:30", tag: "复盘" },
        { time: "22:30 - 23:00", tag: "洗漱" },
        { time: "23:00 - 24:00", tag: "必做" }
    ]
};

// 读取打卡数据
function loadCheckins() {
    try {
        if (fs.existsSync(CONFIG.CHECKIN_FILE)) {
            var data = fs.readFileSync(CONFIG.CHECKIN_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('读取打卡数据失败:', e);
    }
    return {};
}

// 解析时间
function parseTime(timeStr) {
    var match = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (match) {
        return parseInt(match[1]) * 60 + parseInt(match[2]);
    }
    return 0;
}

// 检查打卡提醒
function checkCheckinReminders() {
    console.log('\n⏰ 检查打卡提醒...');
    console.log('📅 当前时间: ' + new Date().toLocaleString('zh-CN'));
    
    var now = new Date();
    var currentHour = now.getHours();
    var currentMinute = now.getMinutes();
    var currentTime = currentHour * 60 + currentMinute;
    var date = now.toISOString().split('T')[0];
    
    var checkins = loadCheckins();
    var todayCheckins = checkins[date] || {};
    
    var reminders = [];
    
    // 检查每个时间段
    for (var i = 0; i < CONFIG.TIMELINE.length; i++) {
        var item = CONFIG.TIMELINE[i];
        var timeMatch = item.time.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
        if (!timeMatch) continue;
        
        var endHour = parseInt(timeMatch[3]);
        var endMinute = parseInt(timeMatch[4]);
        var endTime = endHour * 60 + endMinute;
        
        // 检查是否已打卡
        var completed = todayCheckins[i] === true;
        
        // 如果未打卡且距离结束时间还有10分钟
        var timeUntilEnd = endTime - currentTime;
        if (!completed && timeUntilEnd > 0 && timeUntilEnd <= 10) {
            reminders.push({ item: item, timeUntilEnd: timeUntilEnd, index: i });
        }
    }
    
    // 发送提醒
    if (reminders.length > 0) {
        console.log('📤 发现 ' + reminders.length + ' 个未打卡任务');
        var index = 0;
        function sendNext() {
            if (index >= reminders.length) {
                console.log('✅ 打卡提醒发送完成\n');
                process.exit(0);
                return;
            }
            var reminder = reminders[index];
            var title = '⏰ 打卡提醒';
            var content = '## 打卡提醒\n\n「**' + reminder.item.tag + '**」时间段即将结束！\n\n**还剩：** ' + reminder.timeUntilEnd + ' 分钟\n**时间段：** ' + reminder.item.time + '\n\n请记得打卡！💪\n\n---\n*来自云服务器打卡提醒*';
            
            notification.sendDualNotification(title, content, function() {
                index++;
                setTimeout(sendNext, 2000);
            });
        }
        sendNext();
    } else {
        console.log('✅ 所有任务已打卡或时间未到\n');
        process.exit(0);
    }
}

console.log('========================================');
console.log('⏰ 打卡提醒检查');
console.log('========================================');
checkCheckinReminders();

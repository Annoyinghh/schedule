#!/usr/bin/env node

/**
 * 日程管理系统 - 每日自动提醒脚本（兼容老版本Node.js）
 * 支持：微信通知（Server酱）+ 邮箱通知（QQ邮箱）
 */

var https = require('https');
var fs = require('fs');
var path = require('path');
var tls = require('tls');
var net = require('net');

// 配置
var CONFIG = {
    SERVER_CHAN_KEY: 'SCT310265TyJ4D67VAfJfQTSj87381qEAY',
    REMINDER_DAYS: [14, 7, 3, 1],
    DATA_FILE: path.join(__dirname, 'events_data.json'),
    // 邮箱配置
    EMAIL: {
        from: '1875512848@qq.com',
        to: '1875512848@qq.com',
        password: 'ofntgkurlfujgbba', // QQ邮箱授权码
        smtp: {
            host: 'smtp.qq.com',
            port: 465
        }
    }
};

// 读取事件数据
function loadEvents() {
    try {
        if (fs.existsSync(CONFIG.DATA_FILE)) {
            var data = fs.readFileSync(CONFIG.DATA_FILE, 'utf8');
            console.log('✅ 从云服务器读取数据: ' + CONFIG.DATA_FILE);
            return JSON.parse(data);
        } else {
            console.log('⚠️ 云服务器数据文件不存在，使用默认数据');
        }
    } catch (e) {
        console.error('❌ 读取数据失败:', e);
    }
    return {
        milestones: [
            { date: "2026-03-15", name: "春季大考 (预估)", note: "3月1日开始停止娱乐，全力冲刺" },
            { date: "2026-03-20", name: "求职+基础期开始", note: "重点处理春招和重学基础" },
            { date: "2026-06-01", name: "求职+基础期结束", note: "" },
            { date: "2026-11-27", name: "年度大考·国考 (参考)", note: "11月进入全真模拟模式" },
            { date: "2026-12-07", name: "年度大考·省考 (参考)", note: "考完即止，长假休息" }
        ],
        calendarEvents: {}
    };
}

// 发送邮件通知（使用原生SMTP，兼容老版本Node.js）
function sendEmailNotification(subject, content, callback) {
    console.log('📧 准备发送邮件...');
    
    var socket = tls.connect(CONFIG.EMAIL.smtp.port, CONFIG.EMAIL.smtp.host, {
        rejectUnauthorized: false
    }, function() {
        console.log('📧 已连接到SMTP服务器');
    });
    
    var step = 0;
    var buffer = '';
    
    socket.on('data', function(data) {
        buffer += data.toString();
        var lines = buffer.split('\r\n');
        
        for (var i = 0; i < lines.length - 1; i++) {
            var line = lines[i];
            console.log('< ' + line);
            
            if (step === 0 && line.indexOf('220') === 0) {
                socket.write('EHLO localhost\r\n');
                step = 1;
            } else if (step === 1 && line.indexOf('250') === 0) {
                socket.write('AUTH LOGIN\r\n');
                step = 2;
            } else if (step === 2 && line.indexOf('334') === 0) {
                socket.write(Buffer.from(CONFIG.EMAIL.from).toString('base64') + '\r\n');
                step = 3;
            } else if (step === 3 && line.indexOf('334') === 0) {
                socket.write(Buffer.from(CONFIG.EMAIL.password).toString('base64') + '\r\n');
                step = 4;
            } else if (step === 4 && line.indexOf('235') === 0) {
                socket.write('MAIL FROM:<' + CONFIG.EMAIL.from + '>\r\n');
                step = 5;
            } else if (step === 5 && line.indexOf('250') === 0) {
                socket.write('RCPT TO:<' + CONFIG.EMAIL.to + '>\r\n');
                step = 6;
            } else if (step === 6 && line.indexOf('250') === 0) {
                socket.write('DATA\r\n');
                step = 7;
            } else if (step === 7 && line.indexOf('354') === 0) {
                var emailContent = 'From: ' + CONFIG.EMAIL.from + '\r\n' +
                    'To: ' + CONFIG.EMAIL.to + '\r\n' +
                    'Subject: =?UTF-8?B?' + Buffer.from(subject).toString('base64') + '?=\r\n' +
                    'Content-Type: text/plain; charset=UTF-8\r\n' +
                    '\r\n' +
                    content + '\r\n.\r\n';
                socket.write(emailContent);
                step = 8;
            } else if (step === 8 && line.indexOf('250') === 0) {
                console.log('✅ 邮件发送成功');
                socket.write('QUIT\r\n');
                callback(true);
                socket.end();
            }
        }
        
        buffer = lines[lines.length - 1];
    });
    
    socket.on('error', function(err) {
        console.error('❌ 邮件发送失败:', err.message);
        callback(false);
    });
    
    socket.setTimeout(30000, function() {
        console.error('❌ 邮件发送超时');
        socket.end();
        callback(false);
    });
}

// 发送微信通知
function sendWeChatNotification(title, content, callback) {
    var postData = 'title=' + encodeURIComponent(title) + '&desp=' + encodeURIComponent(content);
    var options = {
        hostname: 'sctapi.ftqq.com',
        port: 443,
        path: '/' + CONFIG.SERVER_CHAN_KEY + '.send',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
        },
        rejectUnauthorized: false
    };
    var req = https.request(options, function(res) {
        var data = '';
        res.on('data', function(chunk) { data += chunk; });
        res.on('end', function() {
            try {
                var result = JSON.parse(data);
                if (result.code === 0) {
                    console.log('✅ 发送成功: ' + title);
                    callback(true);
                } else {
                    console.log('❌ 发送失败: ' + result.message);
                    callback(false);
                }
            } catch (e) {
                console.log('❌ 解析失败');
                callback(false);
            }
        });
    });
    req.on('error', function(e) {
        console.log('❌ 请求失败: ' + e.message);
        callback(false);
    });
    req.write(postData);
    req.end();
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
    
    var events = loadEvents();
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
            var content = '## 重要提醒\n\n距离「**' + reminder.data.name + '**」还有 **' + reminder.daysUntil + '** 天！\n\n**日期：** ' + reminder.data.date + '\n' + (reminder.data.note ? '**备注：** ' + reminder.data.note + '\n' : '') + '\n请做好准备！💪\n\n---\n*来自云服务器自动提醒*';
            var emailContent = '重要提醒\n\n距离「' + reminder.data.name + '」还有 ' + reminder.daysUntil + ' 天！\n\n日期：' + reminder.data.date + '\n' + (reminder.data.note ? '备注：' + reminder.data.note + '\n' : '') + '\n请做好准备！💪\n\n---\n来自云服务器自动提醒';
            
            // 1. 发送微信通知
            sendWeChatNotification(title, content, function(wechatSuccess) {
                // 2. 发送邮件通知
                sendEmailNotification(title, emailContent, function(emailSuccess) {
                    console.log('📊 发送结果: 微信=' + (wechatSuccess ? '✅' : '❌') + ', 邮件=' + (emailSuccess ? '✅' : '❌'));
                    index++;
                    setTimeout(sendNext, 2000); // 等待2秒再发送下一条
                });
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

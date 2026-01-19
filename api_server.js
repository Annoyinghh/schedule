#!/usr/bin/env node

/**
 * 日程管理系统 - API服务器（兼容老版本Node.js）
 */

var http = require('http');
var fs = require('fs');
var path = require('path');
var notification = require('./notification.js');

// 配置
var CONFIG = {
    PORT: 3000,
    DATA_FILE: path.join(__dirname, 'events_data.json'),
    REMINDER_DAYS: [14, 7, 3, 1]
};

// 读取事件数据
function loadEvents() {
    try {
        if (fs.existsSync(CONFIG.DATA_FILE)) {
            var data = fs.readFileSync(CONFIG.DATA_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('读取数据失败:', e);
    }
    return {
        milestones: [],
        calendarEvents: {}
    };
}

// 保存事件数据
function saveEvents(data) {
    try {
        fs.writeFileSync(CONFIG.DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
        console.log('✅ 数据已保存');
        return true;
    } catch (e) {
        console.error('❌ 保存数据失败:', e);
        return false;
    }
}

// 计算日期差
function getDaysDiff(dateStr) {
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);
    return Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
}

// 检查并发送即时提醒
function checkAndSendInstantReminders(data) {
    console.log('🔍 检查是否需要即时提醒...');
    
    var reminders = [];
    var i, daysUntil;
    
    // 检查里程碑
    for (i = 0; i < data.milestones.length; i++) {
        var milestone = data.milestones[i];
        daysUntil = getDaysDiff(milestone.date);
        if (CONFIG.REMINDER_DAYS.indexOf(daysUntil) !== -1) {
            reminders.push({ type: 'milestone', data: milestone, daysUntil: daysUntil });
        }
    }
    
    // 检查月历事件
    for (var dateStr in data.calendarEvents) {
        var eventName = data.calendarEvents[dateStr];
        daysUntil = getDaysDiff(dateStr);
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
        console.log('📤 发现 ' + reminders.length + ' 条需要提醒的事件');
        var index = 0;
        function sendNext() {
            if (index >= reminders.length) {
                console.log('✅ 即时提醒发送完成');
                return;
            }
            var reminder = reminders[index];
            var title = '🔔 日程提醒 (' + reminder.daysUntil + '天后)';
            var content = '## 重要提醒\n\n距离「**' + reminder.data.name + '**」还有 **' + reminder.daysUntil + '** 天！\n\n**日期：** ' + reminder.data.date + '\n' + (reminder.data.note ? '**备注：** ' + reminder.data.note + '\n' : '') + '\n请做好准备！💪\n\n---\n*来自云服务器即时提醒*';
            
            notification.sendDualNotification(title, content, function() {
                index++;
                setTimeout(sendNext, 2000);
            });
        }
        sendNext();
    } else {
        console.log('✅ 暂无需要即时提醒的事件');
    }
}

// 处理CORS（已由Nginx处理，这里不再设置）
function setCORS(res) {
    // CORS由Nginx反向代理处理，这里不需要设置
}

// 发送响应
function sendResponse(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data));
}

// 创建HTTP服务器
var server = http.createServer(function(req, res) {
    setCORS(res);
    
    // 处理OPTIONS请求
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    var url = req.url;
    var method = req.method;
    
    console.log(method + ' ' + url);
    
    // 获取所有事件
    if (method === 'GET' && url === '/api/events') {
        var events = loadEvents();
        sendResponse(res, 200, { success: true, data: events });
        return;
    }
    
    // 同步所有事件
    if (method === 'POST' && url === '/api/events/sync') {
        var body = '';
        req.on('data', function(chunk) { body += chunk.toString(); });
        req.on('end', function() {
            try {
                var data = JSON.parse(body);
                if (saveEvents(data)) {
                    console.log('📥 收到事件同步:', {
                        milestones: data.milestones.length,
                        calendarEvents: Object.keys(data.calendarEvents).length
                    });
                    
                    // 立即检查并发送提醒
                    checkAndSendInstantReminders(data);
                    
                    sendResponse(res, 200, { success: true, message: '同步成功' });
                } else {
                    sendResponse(res, 500, { success: false, message: '保存失败' });
                }
            } catch (e) {
                console.error('❌ 解析数据失败:', e);
                sendResponse(res, 400, { success: false, message: '数据格式错误' });
            }
        });
        return;
    }
    
    // 添加单个里程碑
    if (method === 'POST' && url === '/api/milestones') {
        var body = '';
        req.on('data', function(chunk) { body += chunk.toString(); });
        req.on('end', function() {
            try {
                var milestone = JSON.parse(body);
                var events = loadEvents();
                events.milestones.push(milestone);
                events.milestones.sort(function(a, b) { 
                    return new Date(a.date) - new Date(b.date); 
                });
                if (saveEvents(events)) {
                    console.log('📥 添加里程碑:', milestone.name);
                    sendResponse(res, 200, { success: true, message: '添加成功' });
                } else {
                    sendResponse(res, 500, { success: false, message: '保存失败' });
                }
            } catch (e) {
                console.error('❌ 解析数据失败:', e);
                sendResponse(res, 400, { success: false, message: '数据格式错误' });
            }
        });
        return;
    }
    
    // 添加/更新月历事件
    if (method === 'POST' && url === '/api/calendar') {
        var body = '';
        req.on('data', function(chunk) { body += chunk.toString(); });
        req.on('end', function() {
            try {
                var parsed = JSON.parse(body);
                var date = parsed.date;
                var event = parsed.event;
                var events = loadEvents();
                if (event && event.trim()) {
                    events.calendarEvents[date] = event.trim();
                } else {
                    delete events.calendarEvents[date];
                }
                if (saveEvents(events)) {
                    console.log('📥 更新月历事件:', date, event);
                    sendResponse(res, 200, { success: true, message: '更新成功' });
                } else {
                    sendResponse(res, 500, { success: false, message: '保存失败' });
                }
            } catch (e) {
                console.error('❌ 解析数据失败:', e);
                sendResponse(res, 400, { success: false, message: '数据格式错误' });
            }
        });
        return;
    }
    
    // 健康检查
    if (method === 'GET' && url === '/api/health') {
        sendResponse(res, 200, { success: true, message: 'API服务运行正常' });
        return;
    }
    
    // 404
    sendResponse(res, 404, { success: false, message: '接口不存在' });
});

// 启动服务器
server.listen(CONFIG.PORT, '0.0.0.0', function() {
    console.log('========================================');
    console.log('📅 日程管理系统 - API服务器');
    console.log('========================================');
    console.log('✅ 服务器已启动: http://0.0.0.0:' + CONFIG.PORT);
    console.log('📂 数据文件: ' + CONFIG.DATA_FILE);
    console.log('');
    console.log('📋 可用接口:');
    console.log('  GET  /api/health          - 健康检查');
    console.log('  GET  /api/events          - 获取所有事件');
    console.log('  POST /api/events/sync     - 同步所有事件');
    console.log('  POST /api/milestones      - 添加里程碑');
    console.log('  POST /api/calendar        - 添加/更新月历事件');
    console.log('');
    console.log('按 Ctrl+C 停止服务器');
    console.log('========================================');
});

// 优雅退出
process.on('SIGINT', function() {
    console.log('\n\n👋 服务器正在关闭...');
    server.close(function() {
        console.log('✅ 服务器已关闭');
        process.exit(0);
    });
});

#!/usr/bin/env node

/**
 * 日程管理系统 - API服务器
 * 接收网页发送的事件，保存到本地，供提醒脚本使用
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
    PORT: 3000,
    DATA_FILE: path.join(__dirname, 'events_data.json'),
    SERVER_CHAN_KEY: 'SCT310265TyJ4D67VAfJfQTSj87381qEAY'
};

// 读取事件数据
function loadEvents() {
    try {
        if (fs.existsSync(CONFIG.DATA_FILE)) {
            const data = fs.readFileSync(CONFIG.DATA_FILE, 'utf8');
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

// 处理CORS
function setCORS(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// 发送响应
function sendResponse(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data));
}

// 创建HTTP服务器
const server = http.createServer((req, res) => {
    setCORS(res);
    
    // 处理OPTIONS请求（CORS预检）
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    const url = req.url;
    const method = req.method;
    
    console.log(`${method} ${url}`);
    
    // 获取所有事件
    if (method === 'GET' && url === '/api/events') {
        const events = loadEvents();
        sendResponse(res, 200, { success: true, data: events });
        return;
    }
    
    // 同步所有事件（网页发送完整数据）
    if (method === 'POST' && url === '/api/events/sync') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                if (saveEvents(data)) {
                    console.log('📥 收到事件同步:', {
                        milestones: data.milestones.length,
                        calendarEvents: Object.keys(data.calendarEvents).length
                    });
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
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const milestone = JSON.parse(body);
                const events = loadEvents();
                events.milestones.push(milestone);
                events.milestones.sort((a, b) => new Date(a.date) - new Date(b.date));
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
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const { date, event } = JSON.parse(body);
                const events = loadEvents();
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
server.listen(CONFIG.PORT, '0.0.0.0', () => {
    console.log('========================================');
    console.log('📅 日程管理系统 - API服务器');
    console.log('========================================');
    console.log(`✅ 服务器已启动: http://0.0.0.0:${CONFIG.PORT}`);
    console.log(`📂 数据文件: ${CONFIG.DATA_FILE}`);
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
process.on('SIGINT', () => {
    console.log('\n\n👋 服务器正在关闭...');
    server.close(() => {
        console.log('✅ 服务器已关闭');
        process.exit(0);
    });
});

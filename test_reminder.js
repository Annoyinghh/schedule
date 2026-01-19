#!/usr/bin/env node

/**
 * 测试脚本 - 发送测试通知（兼容老版本Node.js）
 */

var https = require('https');

var SERVER_CHAN_KEY = 'SCT310265TyJ4D67VAfJfQTSj87381qEAY';

function sendWeChatNotification(title, content, callback) {
    var postData = 'title=' + encodeURIComponent(title) + '&desp=' + encodeURIComponent(content);
    var options = {
        hostname: 'sctapi.ftqq.com',
        port: 443,
        path: '/' + SERVER_CHAN_KEY + '.send',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
        },
        rejectUnauthorized: false  // 禁用SSL证书验证（适用于老系统）
    };
    var req = https.request(options, function(res) {
        var data = '';
        res.on('data', function(chunk) { data += chunk; });
        res.on('end', function() {
            try {
                var result = JSON.parse(data);
                if (result.code === 0) {
                    console.log('✅ 测试通知发送成功！');
                    console.log('   PushID: ' + result.data.pushid);
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

console.log('========================================');
console.log('🧪 日程管理系统 - 测试通知');
console.log('========================================');
console.log('');
console.log('📤 正在发送测试通知到微信...');
console.log('');

var now = new Date();
var timeStr = now.toLocaleString('zh-CN');

var title = '🧪 测试通知 - 日程管理系统';
var content = '## 测试消息\n\n这是一条测试通知！\n\n**发送时间：** ' + timeStr + '\n\n### ✅ 系统状态\n- API服务器：运行正常\n- 提醒脚本：运行正常\n- Server酱：连接成功\n\n### 📋 功能说明\n系统会在以下情况自动发送通知：\n1. 重要事件提前 14/7/3/1 天提醒\n2. 每天早上 7:00 自动检查\n\n---\n*来自云服务器自动提醒系统*';

sendWeChatNotification(title, content, function(success) {
    console.log('');
    if (success) {
        console.log('========================================');
        console.log('✅ 测试成功！');
        console.log('========================================');
        console.log('');
        console.log('请查看微信「方糖服务号」');
        console.log('');
    } else {
        console.log('========================================');
        console.log('❌ 测试失败！');
        console.log('========================================');
        console.log('');
        console.log('请检查：');
        console.log('1. SendKey 是否正确');
        console.log('2. 网络连接是否正常');
        console.log('3. 是否关注了「方糖服务号」');
        console.log('');
    }
    process.exit(success ? 0 : 1);
});

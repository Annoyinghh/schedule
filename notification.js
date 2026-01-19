#!/usr/bin/env node

/**
 * 通知模块 - 发送微信和邮件通知
 */

var https = require('https');
var tls = require('tls');

// 配置
var CONFIG = {
    SERVER_CHAN_KEY: 'SCT310265TyJ4D67VAfJfQTSj87381qEAY',
    EMAIL: {
        from: '1875512848@qq.com',
        to: '1875512848@qq.com',
        password: 'ofntgkurlfujgbba',
        smtp: {
            host: 'smtp.qq.com',
            port: 465
        }
    }
};

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
                    console.log('✅ 微信通知成功: ' + title);
                    callback(true);
                } else {
                    console.log('❌ 微信通知失败: ' + result.message);
                    callback(false);
                }
            } catch (e) {
                console.log('❌ 解析失败');
                callback(false);
            }
        });
    });
    req.on('error', function(e) {
        console.log('❌ 微信请求失败: ' + e.message);
        callback(false);
    });
    req.write(postData);
    req.end();
}

// 发送邮件通知
function sendEmailNotification(subject, content, callback) {
    var socket = tls.connect(CONFIG.EMAIL.smtp.port, CONFIG.EMAIL.smtp.host, {
        rejectUnauthorized: false
    });
    
    var step = 0;
    var buffer = '';
    
    socket.on('data', function(data) {
        buffer += data.toString();
        var lines = buffer.split('\r\n');
        
        for (var i = 0; i < lines.length - 1; i++) {
            var line = lines[i];
            
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

// 发送双通道通知（微信+邮件）
function sendDualNotification(title, content, callback) {
    var emailContent = content.replace(/##/g, '').replace(/\*\*/g, '');
    
    sendWeChatNotification(title, content, function(wechatSuccess) {
        sendEmailNotification(title, emailContent, function(emailSuccess) {
            console.log('📊 通知结果: 微信=' + (wechatSuccess ? '✅' : '❌') + ', 邮件=' + (emailSuccess ? '✅' : '❌'));
            callback(wechatSuccess || emailSuccess);
        });
    });
}

module.exports = {
    sendWeChatNotification: sendWeChatNotification,
    sendEmailNotification: sendEmailNotification,
    sendDualNotification: sendDualNotification
};

#!/usr/bin/env node

/**
 * 测试邮件发送功能
 */

var tls = require('tls');

var CONFIG = {
    from: '1875512848@qq.com',
    to: '1875512848@qq.com',
    password: 'ofntgkurlfujgbba',
    smtp: {
        host: 'smtp.qq.com',
        port: 465
    }
};

function sendTestEmail() {
    console.log('========================================');
    console.log('📧 测试QQ邮箱发送功能');
    console.log('========================================');
    console.log('');
    console.log('📧 发件人: ' + CONFIG.from);
    console.log('📧 收件人: ' + CONFIG.to);
    console.log('📧 SMTP服务器: ' + CONFIG.smtp.host + ':' + CONFIG.smtp.port);
    console.log('');
    
    var subject = '🧪 日程管理系统 - 邮件测试';
    var content = '这是一封测试邮件\n\n发送时间：' + new Date().toLocaleString('zh-CN') + '\n\n如果你收到这封邮件，说明邮件通知功能配置成功！\n\n---\n来自日程管理系统';
    
    var socket = tls.connect(CONFIG.smtp.port, CONFIG.smtp.host, {
        rejectUnauthorized: false
    }, function() {
        console.log('✅ 已连接到SMTP服务器');
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
                console.log('> EHLO localhost');
                socket.write('EHLO localhost\r\n');
                step = 1;
            } else if (step === 1 && line.indexOf('250') === 0) {
                console.log('> AUTH LOGIN');
                socket.write('AUTH LOGIN\r\n');
                step = 2;
            } else if (step === 2 && line.indexOf('334') === 0) {
                console.log('> [发送用户名]');
                socket.write(Buffer.from(CONFIG.from).toString('base64') + '\r\n');
                step = 3;
            } else if (step === 3 && line.indexOf('334') === 0) {
                console.log('> [发送密码]');
                socket.write(Buffer.from(CONFIG.password).toString('base64') + '\r\n');
                step = 4;
            } else if (step === 4 && line.indexOf('235') === 0) {
                console.log('✅ 认证成功');
                console.log('> MAIL FROM:<' + CONFIG.from + '>');
                socket.write('MAIL FROM:<' + CONFIG.from + '>\r\n');
                step = 5;
            } else if (step === 5 && line.indexOf('250') === 0) {
                console.log('> RCPT TO:<' + CONFIG.to + '>');
                socket.write('RCPT TO:<' + CONFIG.to + '>\r\n');
                step = 6;
            } else if (step === 6 && line.indexOf('250') === 0) {
                console.log('> DATA');
                socket.write('DATA\r\n');
                step = 7;
            } else if (step === 7 && line.indexOf('354') === 0) {
                console.log('> [发送邮件内容]');
                var emailContent = 'From: ' + CONFIG.from + '\r\n' +
                    'To: ' + CONFIG.to + '\r\n' +
                    'Subject: =?UTF-8?B?' + Buffer.from(subject).toString('base64') + '?=\r\n' +
                    'Content-Type: text/plain; charset=UTF-8\r\n' +
                    '\r\n' +
                    content + '\r\n.\r\n';
                socket.write(emailContent);
                step = 8;
            } else if (step === 8 && line.indexOf('250') === 0) {
                console.log('');
                console.log('========================================');
                console.log('✅ 邮件发送成功！');
                console.log('========================================');
                console.log('');
                console.log('请检查你的QQ邮箱收件箱');
                console.log('');
                socket.write('QUIT\r\n');
                socket.end();
                process.exit(0);
            }
        }
        
        buffer = lines[lines.length - 1];
    });
    
    socket.on('error', function(err) {
        console.log('');
        console.log('========================================');
        console.error('❌ 邮件发送失败:', err.message);
        console.log('========================================');
        console.log('');
        console.log('可能的原因：');
        console.log('1. 授权码错误');
        console.log('2. 网络连接问题');
        console.log('3. SMTP服务器连接失败');
        console.log('');
        process.exit(1);
    });
    
    socket.setTimeout(30000, function() {
        console.error('❌ 连接超时');
        socket.end();
        process.exit(1);
    });
}

sendTestEmail();

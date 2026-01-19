#!/usr/bin/env node

/**
 * 日程管理系统 - 每日自动提醒脚本
 * 部署到云主机，每天自动检查并发送微信提醒
 */

const https = require('https');

// ========== 配置区域 ==========
const CONFIG = {
    SERVER_CHAN_KEY: 'SCT310265TyJ4D67VAfJfQTSj87381qEAY',
    PHONE: '15914969166',
    EMAIL: '1875512848@qq.com',
    REMINDER_DAYS: [14, 7, 3, 1], // 提前几天提醒
    
    // 里程碑事件
    MILESTONES: [
        { date: "2026-03-15", name: "春季大考 (预估)", note: "3月1日开始停止娱乐，全力冲刺" },
        { date: "2026-03-20", name: "求职+基础期开始", note: "重点处理春招和重学基础" },
        { date: "2026-06-01", name: "求职+基础期结束", note: "" },
        { date: "2026-11-27", name: "年度大考·国考 (参考)", note: "11月进入全真模拟模式" },
        { date: "2026-12-07", name: "年度大考·省考 (参考)", note: "考完即止，长假休息" }
    ],
    
    // 月历事件（从文件读取，如果有的话）
    CALENDAR_EVENTS: {}
};

// ========== 核心功能 ==========

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
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
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

// 计算日期差（天数）
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
    
    // 1. 检查里程碑事件
    console.log('\n📌 检查里程碑事件:');
    for (const milestone of CONFIG.MILESTONES) {
        const daysUntil = getDaysDiff(milestone.date);
        console.log(`  - ${milestone.name}: 还有 ${daysUntil} 天`);
        
        if (CONFIG.REMINDER_DAYS.includes(daysUntil)) {
            reminders.push({
                type: 'milestone',
                ...milestone,
                daysUntil
            });
        }
    }
    
    // 2. 检查月历事件
    console.log('\n📅 检查月历事件:');
    for (const [dateStr, eventName] of Object.entries(CONFIG.CALENDAR_EVENTS)) {
        const daysUntil = getDaysDiff(dateStr);
        console.log(`  - ${eventName}: 还有 ${daysUntil} 天`);
        
        if (CONFIG.REMINDER_DAYS.includes(daysUntil)) {
            reminders.push({
                type: 'calendar',
                date: dateStr,
                name: eventName,
                note: '来自月历',
                daysUntil
            });
        }
    }
    
    // 3. 发送提醒
    if (reminders.length > 0) {
        console.log(`\n📤 准备发送 ${reminders.length} 条提醒:`);
        
        for (const reminder of reminders) {
            const title = `🔔 日程提醒 (${reminder.daysUntil}天后)`;
            const content = `## 重要提醒

距离「**${reminder.name}**」还有 **${reminder.daysUntil}** 天！

**日期：** ${reminder.date}
${reminder.note ? `**备注：** ${reminder.note}\n` : ''}
请做好准备！💪

---
*来自日程管理系统自动提醒*`;
            
            try {
                await sendWeChatNotification(title, content);
                sentCount++;
                // 等待1秒，避免发送太快
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (e) {
                console.error(`❌ 发送失败: ${reminder.name}`, e);
            }
        }
    } else {
        console.log('\n✅ 今天没有需要提醒的事件');
    }
    
    // 4. 发送每日总结
    const summary = `## 📅 每日提醒检查完成

**检查时间：** ${new Date().toLocaleString('zh-CN')}
**发送提醒：** ${sentCount} 条

${reminders.length > 0 ? '### 今日提醒事件\n' + reminders.map(r => `- ${r.name} (${r.daysUntil}天后)`).join('\n') : '今天没有需要提醒的事件'}

---
*系统每天自动检查*`;
    
    await sendWeChatNotification('📅 日程系统每日报告', summary);
    
    console.log(`\n✅ 检查完成！共发送 ${sentCount} 条提醒\n`);
}

// ========== 主程序 ==========
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

// 运行
main();

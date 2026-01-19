/**
 * 通知服务模块
 * 支持多种通知方式：Server酱（微信）、浏览器通知、邮件、短信
 */

// ==================== Server酱（微信通知）====================
// 推荐使用！免费且简单
// 1. 访问 https://sct.ftqq.com/ 微信扫码登录
// 2. 获取你的 SendKey
// 3. 替换下面的 YOUR_SENDKEY

const SERVER_CHAN_KEY = 'SCT310265TyJ4D67VAfJfQTSj87381qEAY'; // 你的 SendKey（已配置）

async function sendWeChatNotification(title, content) {
    try {
        // Server酱 API 调用（使用 FormData 格式）
        const formData = new URLSearchParams();
        formData.append('title', title);
        formData.append('desp', content);
        
        const response = await fetch(`https://sctapi.ftqq.com/${SERVER_CHAN_KEY}.send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData
        });
        
        const result = await response.json();
        
        if (result.code === 0) {
            console.log('✅ 微信通知发送成功！PushID:', result.data.pushid);
            return true;
        } else {
            console.error('❌ 微信通知发送失败:', result.message);
            return false;
        }
    } catch (error) {
        console.error('❌ 微信通知发送异常:', error);
        return false;
    }
}

// ==================== 浏览器通知 ====================
function sendBrowserNotification(title, body) {
    if ('Notification' in window) {
        if (Notification.permission === 'granted') {
            new Notification(title, {
                body: body,
                icon: '📅',
                badge: '🔔'
            });
            return true;
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification(title, {
                        body: body,
                        icon: '📅'
                    });
                }
            });
        }
    }
    return false;
}

// ==================== EmailJS（邮件通知）====================
// 1. 访问 https://www.emailjs.com/ 注册账号
// 2. 创建邮件服务和模板
// 3. 获取 Service ID, Template ID, Public Key

const EMAILJS_CONFIG = {
    serviceId: 'YOUR_SERVICE_ID',
    templateId: 'YOUR_TEMPLATE_ID',
    publicKey: 'YOUR_PUBLIC_KEY'
};

async function sendEmailNotification(to, subject, message) {
    if (EMAILJS_CONFIG.serviceId === 'YOUR_SERVICE_ID') {
        console.log('请先配置 EmailJS');
        return false;
    }
    
    try {
        // 需要引入 EmailJS SDK
        // <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>
        
        if (typeof emailjs === 'undefined') {
            console.error('EmailJS SDK 未加载');
            return false;
        }
        
        const response = await emailjs.send(
            EMAILJS_CONFIG.serviceId,
            EMAILJS_CONFIG.templateId,
            {
                to_email: to,
                subject: subject,
                message: message
            },
            EMAILJS_CONFIG.publicKey
        );
        
        return response.status === 200;
    } catch (error) {
        console.error('邮件发送失败:', error);
        return false;
    }
}

// ==================== 阿里云短信（需要后端支持）====================
// 由于安全原因，短信API需要在后端调用
// 这里提供前端调用后端接口的示例

async function sendSMSNotification(phone, message) {
    try {
        // 需要自己搭建后端API
        const response = await fetch('YOUR_BACKEND_API/send-sms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phone: phone,
                message: message
            })
        });
        
        const result = await response.json();
        return result.success;
    } catch (error) {
        console.error('短信发送失败:', error);
        return false;
    }
}

// ==================== 统一通知接口 ====================
async function sendNotification(config) {
    const { title, message, phone, email } = config;
    
    const results = {
        wechat: false,
        browser: false,
        email: false,
        sms: false
    };
    
    // 1. 优先微信通知（已配置 Server酱）
    results.wechat = await sendWeChatNotification(title, message);
    
    // 2. 浏览器通知（备用）
    if (!results.wechat) {
        results.browser = sendBrowserNotification(title, message);
    }
    
    // 3. 邮件通知（可选）
    if (email) {
        results.email = await sendEmailNotification(email, title, message);
    }
    
    // 4. 短信通知（可选，需要后端）
    if (phone) {
        results.sms = await sendSMSNotification(phone, message);
    }
    
    console.log('📊 通知发送结果:', results);
    return results;
}

// ==================== 快速测试函数 ====================
async function testWeChatNotification() {
    const now = new Date();
    const timeStr = now.toLocaleString('zh-CN');
    
    const title = '📅 日程管理系统 - 测试通知';
    const content = `
## 测试消息

这是一条测试通知，发送时间：${timeStr}

### 系统信息
- ✅ Server酱配置成功
- ✅ 微信通知已启用
- ✅ 可以接收日程提醒

### 功能说明
系统会在以下情况自动发送通知：
1. 重要事件提前 14/7/3/1 天提醒
2. 每日早晨 8:00 发送今日计划
3. 临时插入事件时提醒

---
*来自日程管理系统*
    `;
    
    const success = await sendWeChatNotification(title, content);
    
    if (success) {
        alert('✅ 测试通知已发送！请查看你的微信「方糖服务号」');
    } else {
        alert('❌ 通知发送失败，请检查 SendKey 是否正确');
    }
    
    return success;
}

// ==================== 导出 ====================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        sendNotification,
        sendWeChatNotification,
        sendBrowserNotification,
        sendEmailNotification,
        sendSMSNotification
    };
}

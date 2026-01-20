# 智能日程管理系统

一个功能完整的日程管理系统，支持月历视图、时间轴管理、智能提醒等功能。

🔗 **在线访问**: [https://annoyinghh.github.io/schedule/](https://annoyinghh.github.io/schedule/)

## ✨ 主要功能

### 📅 日程管理
- **月历视图**: 直观的月历界面，支持添加/编辑事件
- **里程碑管理**: 管理重要日期节点，自动计算倒计时
- **时间轴系统**: 每日时间段管理与打卡功能
- **进度统计**: 实时显示任务完成进度

### 🔔 智能提醒系统
- **起床提醒**: 每天早上6:30固定提醒
- **日程提醒**: 提前14/7/3/1天提醒重要事件
- **打卡提醒**: 
  - 时间段开始时提醒一次（开始后10分钟内）
  - 距离结束≤30分钟时持续提醒（显示实际剩余时间）
- **即时提醒**: 添加事件后立即检查并发送提醒
- **双通道通知**: 微信（Server酱）+ QQ邮箱

### 🎨 界面特性
- **智能模式切换**: 自动根据时间切换日/夜间模式
- **响应式设计**: 适配各种屏幕尺寸
- **数据持久化**: 云端存储，多设备同步

## 📂 文件说明

### 网页端
- `index.html` - 完整的单页应用（包含HTML/CSS/JavaScript）

### 服务器端（需部署到云服务器）
- `api_server.js` - API服务器，处理数据存储和同步
- `notification.js` - 通知模块，支持微信和邮件通知
- `cloud_reminder.js` - 日程提醒脚本（每天7:00执行）
- `morning_reminder.js` - 起床提醒脚本（每天6:30执行）
- `checkin_reminder.js` - 打卡提醒脚本（每10分钟执行）
- `deploy.sh` - 一键部署脚本
- `setup_https.sh` - HTTPS反向代理配置脚本

### 文档
- `DEPLOY_INSTRUCTIONS.md` - 详细的服务器部署说明

## 🚀 快速开始

### 网页端使用
直接访问 [https://annoyinghh.github.io/schedule/](https://annoyinghh.github.io/schedule/) 即可使用。

### 服务器端部署

#### 前置要求
- Ubuntu服务器（已测试 Ubuntu 14.04）
- Node.js 环境
- Nginx（用于HTTPS反向代理）

#### 部署步骤

1. **上传文件到服务器**
```bash
# 将以下文件上传到服务器 ~/schedule-reminder/ 目录
api_server.js
notification.js
cloud_reminder.js
morning_reminder.js
checkin_reminder.js
deploy.sh
setup_https.sh
```

2. **执行部署脚本**
```bash
ssh root@your-server-ip
cd ~/schedule-reminder
chmod +x deploy.sh setup_https.sh
./deploy.sh
./setup_https.sh
```

3. **验证部署**
```bash
# 测试API服务
curl -k https://your-server-ip/api/health

# 测试提醒功能
node morning_reminder.js
node cloud_reminder.js
node checkin_reminder.js
```

## ⚙️ 配置说明

### Server酱配置
在 `notification.js` 中配置：
```javascript
SERVER_CHAN_KEY: 'your-sendkey-here'
```

### QQ邮箱配置
在 `notification.js` 中配置：
```javascript
EMAIL: {
    from: 'your-email@qq.com',
    to: 'your-email@qq.com',
    password: 'your-auth-code',  // QQ邮箱授权码
    smtp: {
        host: 'smtp.qq.com',
        port: 465
    }
}
```

### 网页端API配置
在 `index.html` 中配置服务器地址：
```javascript
const API_BASE_URL = 'https://your-server-ip';
```

## 📋 定时任务

部署后会自动设置以下定时任务：

| 时间 | 脚本 | 功能 |
|------|------|------|
| 每天 06:30 | `morning_reminder.js` | 起床提醒 |
| 每天 07:00 | `cloud_reminder.js` | 日程提醒（14/7/3/1天） |
| 每10分钟 | `checkin_reminder.js` | 打卡提醒（开始+结束前30分钟） |

### 打卡提醒详细说明

打卡提醒系统有两种提醒模式：

#### 1. 开始提醒 🎯
- **触发时机**：时间段开始后10分钟内
- **条件**：未打卡 且 当天该时间段还没发过开始提醒
- **内容**：提醒时间段已开始，显示持续时间
- **频率**：每个时间段每天只提醒一次

#### 2. 结束提醒 ⏰
- **触发时机**：距离结束时间≤30分钟
- **条件**：未打卡
- **内容**：提醒即将结束，显示实际剩余时间（动态计算）
- **频率**：每10分钟检查一次，会多次提醒

#### 示例场景
以"实战"时间段（13:30-16:30）为例：
- **13:30-13:40**：发送开始提醒 → "实战时间段已开始！持续180分钟"
- **16:00**：发送结束提醒 → "还剩30分钟"
- **16:10**：发送结束提醒 → "还剩20分钟"
- **16:20**：发送结束提醒 → "还剩10分钟"

## 🔧 常用命令

```bash
# 查看API日志
tail -f ~/schedule-reminder/api.log

# 查看提醒日志
tail -f ~/schedule-reminder/reminder.log

# 查看定时任务
crontab -l

# 重启API服务器
pkill -f api_server.js
cd ~/schedule-reminder && nohup node api_server.js > api.log 2>&1 &

# 手动测试提醒
node morning_reminder.js    # 起床提醒
node cloud_reminder.js      # 日程提醒
node checkin_reminder.js    # 打卡提醒
```

## 📊 数据存储

- `events_data.json` - 事件和里程碑数据
- `checkin_data.json` - 打卡记录数据
- `start_reminder_sent.json` - 开始提醒记录（避免重复提醒）

## 🎯 时间轴配置

默认时间段：
- 06:30-07:30 唤醒（起床、洗漱、早餐）
- 07:30-11:30 高能（学习黄金时段）
- 11:30-13:30 充电（午餐、午休）
- 13:30-16:30 实战（下午学习）
- 16:30-17:30 运动（锻炼身体）
- 17:30-19:30 生活（晚餐、休息）
- 19:30-22:30 复盘（总结、规划）
- 22:30-23:00 洗漱（准备睡觉）
- 23:00-24:00 必做（睡前必做事项）

## 📝 更新日志

### v2.1 (2026-01-20)
- ✨ 新增打卡开始提醒（时间段开始时提醒一次）
- ✨ 优化打卡结束提醒（显示动态剩余时间）
- 🐛 修复打卡提醒时间计算逻辑

### v2.0 (2026-01-20)
- ✨ 新增云服务器支持
- ✨ 新增双通道通知（微信+邮件）
- ✨ 新增4种智能提醒模式
- ✨ 新增打卡系统
- 🐛 修复日期计算错误
- 🐛 修复CORS问题

### v1.0 (2026-01-19)
- 🎉 初始版本发布
- ✨ 月历视图
- ✨ 里程碑管理
- ✨ 时间轴系统
- ✨ 本地存储

## 📄 许可证

MIT License

## 👤 作者

联系方式：1875512848@qq.com

---

⭐ 如果这个项目对你有帮助，欢迎 Star！

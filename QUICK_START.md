# 🚀 快速开始指南

## ✅ 已完成配置

### 1. Server酱（微信通知）
- ✅ SendKey 已配置：`SCT310265TyJ4D67VAfJfQTSj87381qEAY`
- ✅ 通知接收：微信「方糖服务号」
- ✅ 功能状态：已启用

### 2. 联系方式
- 📱 手机：15914969166
- 📧 邮箱：1875512848@qq.com

---

## 🧪 立即测试通知

### 方法1：使用测试页面（推荐）
1. 用浏览器打开 `test_notification.html`
2. 点击「发送测试通知」按钮
3. 查看你的微信「方糖服务号」

### 方法2：在主程序中测试
1. 打开 `schedule_manager.html`
2. 按 F12 打开控制台
3. 输入以下代码：
```javascript
sendWeChatNotification('测试通知', '这是一条测试消息');
```
4. 查看你的微信

---

## 📱 部署到 GitHub（手机访问）

### 步骤1：创建 GitHub 仓库
1. 访问 https://github.com/new
2. 仓库名称：`schedule-manager`
3. 设置为 Public
4. 点击 Create repository

### 步骤2：上传代码
在当前目录运行：
```bash
git init
git add .
git commit -m "初始化日程管理系统"
git remote add origin https://github.com/你的用户名/schedule-manager.git
git branch -M main
git push -u origin main
```

或者直接双击运行 `deploy.bat`

### 步骤3：启用 GitHub Pages
1. 进入仓库的 Settings
2. 找到左侧的 Pages 选项
3. Source 选择 `main` 分支
4. 点击 Save
5. 等待 2-3 分钟

### 步骤4：访问你的网站
```
https://你的用户名.github.io/schedule-manager/schedule_manager.html
```

### 步骤5：手机使用
1. 在手机浏览器输入上面的网址
2. 点击浏览器菜单 > 添加到主屏幕
3. 像APP一样使用

---

## 🔔 自动提醒设置

### 当前提醒规则
系统会在以下情况自动发送微信通知：

1. **重要事件提醒**
   - 提前 14 天
   - 提前 7 天
   - 提前 3 天
   - 提前 1 天

2. **每日计划提醒**（需要配置）
   - 每天早上 8:00
   - 发送今日时间轴

3. **临时事件提醒**
   - 插入临时事件时立即通知

### 启用每日自动提醒

#### 方法1：使用 GitHub Actions（推荐）

1. 在仓库中创建文件 `.github/workflows/daily-reminder.yml`：

```yaml
name: Daily Reminder

on:
  schedule:
    - cron: '0 0 * * *'  # 每天 UTC 00:00 (北京时间 08:00)

jobs:
  remind:
    runs-on: ubuntu-latest
    steps:
      - name: Send Daily Reminder
        run: |
          TITLE="📅 每日提醒 - $(date +%Y-%m-%d)"
          CONTENT="## 今日计划%0A%0A记得查看你的日程安排！%0A%0A- 07:30-11:30 高能时段%0A- 13:30-17:30 实战时段%0A- 19:00-22:30 复盘时段%0A- 23:00-24:00 必做时段"
          
          curl -X POST "https://sctapi.ftqq.com/SCT310265TyJ4D67VAfJfQTSj87381qEAY.send" \
            -d "title=${TITLE}" \
            -d "desp=${CONTENT}"
```

2. 提交并推送到 GitHub
3. 每天早上 8:00 自动发送提醒

#### 方法2：使用云函数（腾讯云/阿里云）

免费额度足够个人使用，可以设置更灵活的定时任务。

---

## 📋 功能清单

### ✅ 已实现
- [x] 月历视图（区分兴趣周/冲刺周）
- [x] 今日时间轴（8个时间段）
- [x] 智能模式切换（5种模式）
- [x] 临时插入事件
- [x] 本地数据存储
- [x] 微信通知（Server酱）
- [x] 浏览器通知
- [x] 重要事件倒计时
- [x] 自动提醒检测

### 🚧 可扩展功能
- [ ] 数据云端同步
- [ ] 多设备数据共享
- [ ] 邮件通知
- [ ] 短信通知
- [ ] 统计报表
- [ ] 导出PDF
- [ ] 语音提醒

---

## ❓ 常见问题

### Q1: 收不到微信通知？
**A:** 检查以下几点：
1. SendKey 是否正确配置
2. 是否关注了「方糖服务号」
3. 在 Server酱 网站查看推送记录
4. 检查浏览器控制台是否有错误

### Q2: 手机上数据会丢失吗？
**A:** 不会，数据保存在浏览器本地存储中。但建议：
- 定期导出笔记备份
- 不要清除浏览器数据
- 重要内容记录在笔记中

### Q3: 可以多设备同步吗？
**A:** 目前不支持自动同步。每个设备独立存储数据。
如需同步，可以考虑：
- 使用同一个浏览器账号同步
- 接入云数据库（需要开发）

### Q4: 如何修改提醒时间？
**A:** 编辑 GitHub Actions 的 cron 表达式：
- `0 0 * * *` = 每天 08:00（北京时间）
- `0 12 * * *` = 每天 20:00（北京时间）
- `0 22 * * *` = 每天 06:00（北京时间）

### Q5: 通知会收费吗？
**A:** Server酱免费版：
- 每天 5 条免费通知
- 超出后需要升级（9.9元/月）
- 对个人使用完全够用

---

## 📞 技术支持

如有问题，可以：
1. 查看 `deploy_guide.md` 详细文档
2. 访问 Server酱官网：https://sct.ftqq.com/
3. 查看 GitHub Issues

---

## 🎉 开始使用

1. ✅ 打开 `test_notification.html` 测试通知
2. ✅ 打开 `schedule_manager.html` 开始使用
3. ✅ 运行 `deploy.bat` 部署到 GitHub
4. ✅ 手机访问你的网站

**祝你使用愉快！📅**

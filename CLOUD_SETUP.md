# 云主机部署指南

## 📋 云主机信息
- **公网IP**: 171.80.9.175
- **操作系统**: Ubuntu 14.04 amd64
- **配置**: 4核CPU / 4G内存 / 20G SSD
- **到期时间**: 2026-01-20 20:58:08

## 🚀 快速部署（3步完成）

### 步骤1: 连接云主机
```bash
ssh root@171.80.9.175
```

### 步骤2: 下载并运行部署脚本
```bash
# 下载部署脚本
wget https://raw.githubusercontent.com/Annoyinghh/schedule/main/setup_cloud.sh

# 或者手动创建脚本（如果 wget 失败）
nano setup_cloud.sh
# 复制 setup_cloud.sh 的内容，粘贴，保存（Ctrl+X, Y, Enter）

# 添加执行权限
chmod +x setup_cloud.sh

# 运行部署脚本
./setup_cloud.sh
```

### 步骤3: 测试运行
```bash
cd ~/schedule-reminder
node daily_reminder.js
```

如果看到微信收到通知，说明部署成功！✅

## 📅 自动运行时间
系统会在**每天早上 8:00** 自动检查并发送提醒。

## 🔧 常用命令

### 查看日志
```bash
tail -f ~/schedule-reminder/reminder.log
```

### 手动运行一次
```bash
cd ~/schedule-reminder && node daily_reminder.js
```

### 修改配置
```bash
nano ~/schedule-reminder/daily_reminder.js
```

修改后保存即可，下次自动运行时会使用新配置。

### 查看定时任务
```bash
crontab -l
```

### 修改运行时间
```bash
crontab -e
```

修改这一行：
```
0 8 * * * cd ~/schedule-reminder && /usr/bin/node daily_reminder.js >> ~/schedule-reminder/reminder.log 2>&1
```

时间格式说明：
- `0 8 * * *` = 每天 8:00
- `0 20 * * *` = 每天 20:00
- `0 8,20 * * *` = 每天 8:00 和 20:00
- `0 */6 * * *` = 每 6 小时一次

## 📝 添加新事件

### 方法1: 在网页上添加（推荐）
打开 https://annoyinghh.github.io/schedule/，在月历上添加事件。

### 方法2: 直接修改脚本
```bash
nano ~/schedule-reminder/daily_reminder.js
```

找到 `CALENDAR_EVENTS` 部分，添加新事件：
```javascript
CALENDAR_EVENTS: {
    "2026-01-20": "xzx",
    "2026-02-15": "新事件名称"  // 添加这一行
}
```

保存后，下次自动运行时会包含新事件。

## ⚠️ 注意事项

1. **云主机到期时间**: 2026-01-20 20:58:08
   - 记得续费，否则服务会停止

2. **同步事件**:
   - 网页上添加的事件需要手动同步到云主机脚本
   - 或者每次在网页添加事件后，也在云主机脚本中添加

3. **时区设置**:
   - 脚本使用服务器时区
   - 如果时间不对，可能需要调整服务器时区

## 🆘 故障排查

### 问题1: 没有收到提醒
```bash
# 查看日志
tail -50 ~/schedule-reminder/reminder.log

# 手动运行测试
cd ~/schedule-reminder && node daily_reminder.js
```

### 问题2: Node.js 未安装
```bash
# 安装 Node.js
curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 问题3: 定时任务未运行
```bash
# 检查 cron 服务
sudo service cron status

# 重启 cron 服务
sudo service cron restart
```

## 📞 联系方式
- 手机: 15914969166
- 邮箱: 1875512848@qq.com
- Server酱: 方糖服务号

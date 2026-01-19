# 云服务器部署指南

## 服务器信息
- **IP地址**: 171.80.9.175
- **操作系统**: Ubuntu 14.04 amd64
- **到期时间**: 2026-01-20 20:58:08

## 部署步骤

### 1. 上传文件到服务器

```bash
# 在本地执行（从 schedule-manager 目录）
scp api_server.js root@171.80.9.175:~/schedule-reminder/
scp cloud_reminder.js root@171.80.9.175:~/schedule-reminder/
scp test_reminder.js root@171.80.9.175:~/schedule-reminder/
scp setup_https.sh root@171.80.9.175:~/schedule-reminder/
scp deploy.sh root@171.80.9.175:~/schedule-reminder/
```

### 2. 登录服务器

```bash
ssh root@171.80.9.175
```

### 3. 执行部署脚本

```bash
cd ~/schedule-reminder
chmod +x deploy.sh setup_https.sh
./deploy.sh
```

### 4. 配置HTTPS反向代理

```bash
chmod +x setup_https.sh
./setup_https.sh
```

### 5. 测试服务

```bash
# 测试API服务器（HTTP）
curl http://localhost:3000/api/health

# 测试HTTPS反向代理
curl -k https://171.80.9.175/api/health

# 测试提醒功能
node test_reminder.js
```

### 6. 设置定时任务

```bash
# 编辑crontab
crontab -e

# 添加以下行（每天早上7:00执行）
0 7 * * * cd ~/schedule-reminder && /usr/bin/node cloud_reminder.js >> ~/schedule-reminder/reminder.log 2>&1
```

## 服务管理

### 查看API服务器状态
```bash
ps aux | grep api_server.js
```

### 停止API服务器
```bash
pkill -f api_server.js
```

### 启动API服务器
```bash
cd ~/schedule-reminder
nohup node api_server.js > api.log 2>&1 &
```

### 查看日志
```bash
# API服务器日志
tail -f ~/schedule-reminder/api.log

# 提醒脚本日志
tail -f ~/schedule-reminder/reminder.log
```

### 重启Nginx
```bash
sudo service nginx restart
```

### 查看Nginx状态
```bash
sudo service nginx status
```

## 故障排查

### 问题1: Mixed Content错误
**症状**: 网页控制台显示 "Mixed Content: The page at 'https://...' was loaded over HTTPS, but requested an insecure resource 'http://...'"

**原因**: GitHub Pages使用HTTPS，但API服务器使用HTTP

**解决方案**: 已通过Nginx配置HTTPS反向代理解决

### 问题2: API连接失败
**检查步骤**:
1. 确认API服务器运行: `ps aux | grep api_server.js`
2. 确认端口监听: `netstat -tlnp | grep 3000`
3. 确认Nginx运行: `sudo service nginx status`
4. 测试本地连接: `curl http://localhost:3000/api/health`
5. 测试HTTPS: `curl -k https://171.80.9.175/api/health`

### 问题3: 提醒未发送
**检查步骤**:
1. 查看提醒日志: `tail -f ~/schedule-reminder/reminder.log`
2. 手动测试: `node test_reminder.js`
3. 检查crontab: `crontab -l`
4. 检查数据文件: `cat ~/schedule-reminder/events_data.json`

## 网页配置

确保 `index.html` 中的API配置正确:

```javascript
const API_CONFIG = {
    enabled: true,
    baseURL: 'https://171.80.9.175/api'  // 使用HTTPS
};
```

## 测试流程

1. **测试API连接**
   - 在网页添加一个里程碑事件
   - 检查浏览器控制台是否有错误
   - 在服务器查看 `events_data.json` 是否更新

2. **测试提醒功能**
   - 运行 `node test_reminder.js`
   - 检查微信是否收到测试通知

3. **测试定时任务**
   - 修改crontab为1分钟后执行
   - 等待并检查是否收到通知
   - 改回每天7:00

## 重要提示

- 服务器将于 **2026-01-20 20:58:08** 到期，请及时续费
- 自签名SSL证书会导致浏览器警告，这是正常的
- 数据文件位于 `~/schedule-reminder/events_data.json`
- 所有日志文件都在 `~/schedule-reminder/` 目录下

# Web SSH Demo

一个基于 Web 的 SSH 终端客户端，支持通过浏览器连接和管理远程服务器。

## 功能特性

- 🌐 基于 Web 的 SSH 终端界面
- 🔐 魔术密码功能：设置一个通用密码，自动填充所有 SSH 连接
- 💻 完整的终端交互体验（支持命令输入、输出显示）
- 📱 响应式设计，自动适应窗口大小
- 🎨 现代化的深色主题界面

## 技术栈

- **后端**: Node.js + Express + Socket.IO + ssh2
- **前端**: React + xterm.js

## 安装和运行

### 1. 安装依赖

```bash
npm install
```

### 2. 构建并启动生产服务

```bash
npm run start:prod
```

这将：
1. 构建 React 应用（生成 `build` 目录）
2. 启动统一服务器（默认端口 4000）
   - 提供静态文件服务（前端页面）
   - 提供 Socket.IO 服务（SSH 连接）

### 3. 使用说明

1. 打开浏览器访问 `http://localhost:4000`（或您的服务器 IP:4000）
2. 点击"⚙️ 设置魔术密码"按钮，设置一个通用密码（可选）
3. 填写 SSH 连接信息：
   - 主机地址
   - 端口（默认 22）
   - 用户名
   - 密码（如果启用了魔术密码，会自动填充）
4. 点击"连接"按钮开始使用

## 魔术密码功能

魔术密码功能允许您设置一个通用密码，所有 SSH 连接的密码字段都会自动使用这个密码：

1. 点击连接表单右上角的"⚙️ 设置魔术密码"按钮
2. 输入您想要设置的魔术密码
3. 勾选"启用魔术密码"
4. 点击"保存"
5. 之后所有连接的密码字段都会自动填充为魔术密码

您也可以在连接表单中随时切换是否使用魔术密码。

## 项目结构

```
web-ssh-demo/
├── server.js          # 后端服务器（Socket.IO + SSH2 + Express）
├── src/               # React 源代码
│   ├── WebTerminal.js  # 终端组件
│   └── App.js
├── public/            # 静态资源
├── package.json       # 所有依赖（前后端）
├── build/             # 生产构建输出（运行build后生成）
├── .gitignore
└── README.md
```

## 生产环境部署

### 使用 PM2 持久运行（推荐）

```bash
# 1. 安装 PM2
npm install -g pm2

# 2. 构建项目
npm run build

# 3. 启动服务
NODE_ENV=production pm2 start server.js --name "web-ssh-demo"

# 4. 设置开机自启
pm2 startup
pm2 save

# 5. 查看状态和日志
pm2 status
pm2 logs web-ssh-demo
```

### 使用 systemd（可选）

创建 `/etc/systemd/system/web-ssh-demo.service`：

```ini
[Unit]
Description=Web SSH Demo Application
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/web-ssh-demo
Environment=NODE_ENV=production
Environment=PORT=4000
ExecStart=/usr/bin/node /path/to/web-ssh-demo/server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

然后启用并启动：
```bash
sudo systemctl daemon-reload
sudo systemctl enable web-ssh-demo
sudo systemctl start web-ssh-demo
```

## 注意事项

- 生产模式下，Express 服务器同时提供静态文件服务和 Socket.IO 服务
- 默认端口为 4000，可通过环境变量 `PORT` 修改
- 魔术密码保存在浏览器的 localStorage 中，仅本地有效
- 请确保您有权限访问目标 SSH 服务器
- 建议使用 Nginx 反向代理并配置 HTTPS

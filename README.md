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

### 2. 启动服务

**开发模式**：
```bash
npm start
```
这将同时启动：
- React 开发服务器（`http://localhost:3000`）
- Socket.IO 服务器（`http://localhost:4000`）

**生产模式**：
```bash
npm run start:prod
```
这将构建 React 应用并启动统一服务器（默认端口 4000）

### 3. 使用说明

1. 打开浏览器访问 `http://localhost:3000`（开发模式）或 `http://localhost:4000`（生产模式）
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

## 注意事项

- 开发模式下，React 开发服务器和 Socket.IO 服务器会同时启动
- 生产模式下，Express 服务器会同时提供静态文件服务和 Socket.IO 服务
- 魔术密码保存在浏览器的 localStorage 中，仅本地有效
- 请确保您有权限访问目标 SSH 服务器

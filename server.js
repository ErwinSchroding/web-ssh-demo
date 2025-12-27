// server.js
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const { Client } = require('ssh2');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 4000;
const isProduction = process.env.NODE_ENV === 'production';

// 生产模式下serve静态文件
if (isProduction) {
  app.use(express.static(path.join(__dirname, 'build')));
  app.use((req, res, next) => {
    // 排除 Socket.IO 路径
    if (req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

// Socket.IO配置
const io = new Server(server, {
  cors: {
    origin: isProduction ? false : ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  const conn = new Client();

  // 1. 监听前端发来的连接请求（包含服务器IP、账号、密码）
  socket.on('initSSH', (config) => {
    conn.on('ready', () => {
      console.log('SSH Connection :: ready');
      socket.emit('status', 'SSH 连接成功\r\n');

      // 打开 shell
      conn.shell((err, stream) => {
        if (err) return socket.emit('output', '\r\n*** SSH Shell Error: ' + err.message + ' ***\r\n');

        // 2. 将 SSH 的输出流 (数据) 发送给前端
        stream.on('data', (data) => {
          socket.emit('output', data.toString('utf-8'));
        });

        stream.on('close', () => {
          conn.end();
          socket.disconnect();
        });

        // 3. 将前端的输入 (键盘敲击) 写入 SSH 流
        socket.on('input', (data) => {
          stream.write(data);
        });
        
        // 可选：处理终端大小调整
        socket.on('resize', ({ rows, cols }) => {
            stream.setWindow(rows, cols);
        });
      });
    }).on('error', (err) => {
       console.error('SSH Connect Error:', err);
       socket.emit('output', '\r\n*** SSH Connection Error: ' + err.message + ' ***\r\n');
    }).connect({
      host: config.host,
      port: config.port || 22,
      username: config.username,
      password: config.password
      // privateKey: ... 如果需要密钥登录
    });
  });

  socket.on('disconnect', () => {
    conn.end();
    console.log('Client disconnected');
  });
});

server.listen(PORT, () => {
  if (isProduction) {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
  } else {
    console.log(`Socket Server listening on port ${PORT}`);
  }
});
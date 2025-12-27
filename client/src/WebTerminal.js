import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import io from 'socket.io-client';
import 'xterm/css/xterm.css';

const MAGIC_PASSWORD_KEY = 'web-ssh-magic-password';
const USE_MAGIC_PASSWORD_KEY = 'web-ssh-use-magic-password';

const WebTerminal = () => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const socketRef = useRef(null);
  const resizeHandlerRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [magicPassword, setMagicPassword] = useState(() => {
    return localStorage.getItem(MAGIC_PASSWORD_KEY) || '';
  });
  const [useMagicPassword, setUseMagicPassword] = useState(() => {
    return localStorage.getItem(USE_MAGIC_PASSWORD_KEY) === 'true';
  });
  const [formData, setFormData] = useState(() => {
    const savedMagicPassword = localStorage.getItem(MAGIC_PASSWORD_KEY) || '';
    const useMagic = localStorage.getItem(USE_MAGIC_PASSWORD_KEY) === 'true';
    return {
      host: '',
      port: '22',
      username: '',
      password: useMagic && savedMagicPassword ? savedMagicPassword : ''
    };
  });

  // 当启用魔术密码时，自动填充密码
  useEffect(() => {
    if (useMagicPassword && magicPassword) {
      setFormData(prev => ({ ...prev, password: magicPassword }));
    } else if (!useMagicPassword) {
      setFormData(prev => ({ ...prev, password: '' }));
    }
  }, [useMagicPassword, magicPassword]);

  const handleConnect = () => {
    if (!formData.host || !formData.username || !formData.password) {
      alert('请填写完整的连接信息');
      return;
    }

    setShowForm(false);
    setIsConnected(false);

    // 创建新的 socket 连接
    const socket = io('http://localhost:4000');
    socketRef.current = socket;

    // 创建 xterm 实例
    if (xtermRef.current) {
      xtermRef.current.dispose();
    }

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#ffffff',
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    if (terminalRef.current) {
      term.open(terminalRef.current);
    }

    xtermRef.current = term;

    setTimeout(() => {
      try {
        fitAddon.fit();
      } catch (e) {
        console.error('Terminal fit failed', e);
      }
    }, 100);

    // Socket 事件处理
    socket.on('connect', () => {
      term.write('\r\n*** 连接到服务器，正在认证... ***\r\n');
      setIsConnected(true);
      
      socket.emit('initSSH', {
        host: formData.host,
        port: parseInt(formData.port) || 22,
        username: formData.username,
        password: formData.password
      });
    });

    socket.on('output', (data) => {
      term.write(data);
    });

    socket.on('status', (data) => {
      term.write(data);
    });

    socket.on('disconnect', () => {
      term.write('\r\n*** 连接已断开 ***\r\n');
      setIsConnected(false);
    });

    term.onData((data) => {
      if (socket.connected) {
        socket.emit('input', data);
      }
    });

    // 窗口大小改变时重新 fit
    const handleResize = () => {
      try {
        fitAddon.fit();
        if (socket.connected) {
          socket.emit('resize', { 
            cols: term.cols, 
            rows: term.rows 
          });
        }
      } catch (e) {
        console.log('Resize error', e);
      }
    };
    window.addEventListener('resize', handleResize);
    resizeHandlerRef.current = handleResize;
  };

  const handleDisconnect = () => {
    if (resizeHandlerRef.current) {
      window.removeEventListener('resize', resizeHandlerRef.current);
      resizeHandlerRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    if (xtermRef.current) {
      xtermRef.current.dispose();
      xtermRef.current = null;
    }
    setIsConnected(false);
    setShowForm(true);
  };

  const handleSaveMagicPassword = () => {
    localStorage.setItem(MAGIC_PASSWORD_KEY, magicPassword);
    localStorage.setItem(USE_MAGIC_PASSWORD_KEY, useMagicPassword.toString());
    if (useMagicPassword && magicPassword) {
      setFormData(prev => ({ ...prev, password: magicPassword }));
    }
    setShowSettings(false);
    alert('设置已保存！');
  };

  const handleToggleMagicPassword = (checked) => {
    setUseMagicPassword(checked);
    localStorage.setItem(USE_MAGIC_PASSWORD_KEY, checked.toString());
    if (checked && magicPassword) {
      setFormData(prev => ({ ...prev, password: magicPassword }));
    } else if (!checked) {
      setFormData(prev => ({ ...prev, password: '' }));
    }
  };

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (xtermRef.current) {
        xtermRef.current.dispose();
      }
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', background: '#000' }}>
      {/* 设置模态框 */}
      {showSettings && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowSettings(false)}>
          <div style={{
            background: '#1e1e1e',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '90%',
            border: '1px solid #444',
            color: '#fff'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 20px 0', color: '#fff' }}>魔术密码设置</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>
                  魔术密码:
                </label>
                <input
                  type="password"
                  value={magicPassword}
                  onChange={(e) => setMagicPassword(e.target.value)}
                  placeholder="设置一个通用密码"
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#2d2d2d',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                />
                <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#888' }}>
                  设置后，所有SSH连接的密码将自动使用此密码
                </p>
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={useMagicPassword}
                    onChange={(e) => handleToggleMagicPassword(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ color: '#ccc' }}>启用魔术密码</span>
                </label>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowSettings(false)}
                  style={{
                    padding: '8px 20px',
                    background: '#444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  取消
                </button>
                <button
                  onClick={handleSaveMagicPassword}
                  style={{
                    padding: '8px 20px',
                    background: '#007acc',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div style={{
          padding: '20px',
          background: '#1e1e1e',
          borderBottom: '1px solid #333',
          color: '#fff',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, color: '#fff' }}>SSH 连接配置</h2>
            <button
              onClick={() => setShowSettings(true)}
              style={{
                padding: '8px 15px',
                background: '#444',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ⚙️ 设置魔术密码
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '500px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>主机地址:</label>
              <input
                type="text"
                value={formData.host}
                onChange={(e) => setFormData({...formData, host: e.target.value})}
                placeholder="例如: 192.168.1.100"
                style={{
                  width: '100%',
                  padding: '8px',
                  background: '#2d2d2d',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  color: '#fff',
                  fontSize: '14px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>端口:</label>
              <input
                type="text"
                value={formData.port}
                onChange={(e) => setFormData({...formData, port: e.target.value})}
                placeholder="22"
                style={{
                  width: '100%',
                  padding: '8px',
                  background: '#2d2d2d',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  color: '#fff',
                  fontSize: '14px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>用户名:</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                placeholder="例如: root"
                style={{
                  width: '100%',
                  padding: '8px',
                  background: '#2d2d2d',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  color: '#fff',
                  fontSize: '14px'
                }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <label style={{ display: 'block', color: '#ccc' }}>密码:</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={useMagicPassword}
                    onChange={(e) => handleToggleMagicPassword(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '12px', color: '#888' }}>使用魔术密码</span>
                </label>
              </div>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder={useMagicPassword ? "已使用魔术密码" : "输入密码"}
                disabled={useMagicPassword && magicPassword ? true : false}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: useMagicPassword && magicPassword ? '#1a1a1a' : '#2d2d2d',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  color: useMagicPassword && magicPassword ? '#888' : '#fff',
                  fontSize: '14px',
                  cursor: useMagicPassword && magicPassword ? 'not-allowed' : 'text'
                }}
              />
              {useMagicPassword && magicPassword && (
                <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#4caf50' }}>
                  ✓ 正在使用魔术密码
                </p>
              )}
            </div>
            <button
              onClick={handleConnect}
              style={{
                padding: '10px 20px',
                background: '#007acc',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              连接
            </button>
          </div>
        </div>
      )}

      {!showForm && (
        <div style={{
          padding: '10px',
          background: '#1e1e1e',
          borderBottom: '1px solid #333',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ color: '#fff' }}>
            <strong>已连接:</strong> {formData.username}@{formData.host}:{formData.port}
            {isConnected && <span style={{ color: '#4caf50', marginLeft: '10px' }}>●</span>}
          </div>
          <button
            onClick={handleDisconnect}
            style={{
              padding: '6px 15px',
              background: '#d32f2f',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            断开连接
          </button>
        </div>
      )}

      <div 
        ref={terminalRef} 
        style={{ 
          flex: 1, 
          width: '100%', 
          padding: '10px',
          minHeight: 0
        }} 
      />
    </div>
  );
};

export default WebTerminal;
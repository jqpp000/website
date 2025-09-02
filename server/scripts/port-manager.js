const net = require('net');
const { spawn } = require('child_process');

// 检查端口是否可用
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => {
        resolve(true);
      });
      server.close();
    });
    
    server.on('error', () => {
      resolve(false);
    });
  });
}

// 查找可用端口
async function findAvailablePort(startPort = 3003, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    const available = await isPortAvailable(port);
    
    if (available) {
      return port;
    }
    
    console.log(`端口 ${port} 已被占用，尝试下一个端口...`);
  }
  
  throw new Error(`在端口 ${startPort} 到 ${startPort + maxAttempts - 1} 范围内没有找到可用端口`);
}

// 终止占用指定端口的进程
async function killProcessOnPort(port) {
  return new Promise((resolve) => {
    const platform = process.platform;
    
    if (platform === 'win32') {
      // Windows
      const cmd = spawn('cmd', ['/c', `netstat -ano | findstr :${port}`]);
      let output = '';
      
      cmd.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      cmd.on('close', () => {
        const lines = output.trim().split('\n');
        lines.forEach(line => {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 5) {
            const pid = parts[parts.length - 1];
            if (pid && !isNaN(pid)) {
              console.log(`终止进程 ${pid} (端口 ${port})`);
              spawn('taskkill', ['/PID', pid, '/F']);
            }
          }
        });
        resolve();
      });
    } else {
      // Linux/macOS
      const cmd = spawn('lsof', ['-ti', `:${port}`]);
      let output = '';
      
      cmd.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      cmd.on('close', () => {
        const pids = output.trim().split('\n').filter(pid => pid && !isNaN(pid));
        pids.forEach(pid => {
          console.log(`终止进程 ${pid} (端口 ${port})`);
          spawn('kill', ['-9', pid]);
        });
        resolve();
      });
    }
  });
}

// 主函数
async function main() {
  try {
    console.log('🔍 检查端口占用情况...');
    
    // 首先尝试清理端口3003
    await killProcessOnPort(3003);
    
    // 等待一下让进程完全终止
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 检查端口3003是否可用
    const port = await findAvailablePort(3003, 5);
    
    if (port === 3003) {
      console.log('✅ 端口3003可用，可以正常启动服务');
    } else {
      console.log(`⚠️  端口3003被占用，建议使用端口 ${port}`);
      console.log('请更新环境配置文件中的PORT设置');
    }
    
    console.log(`🎯 推荐使用端口: ${port}`);
    
  } catch (error) {
    console.error('❌ 端口检查失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  isPortAvailable,
  findAvailablePort,
  killProcessOnPort
};

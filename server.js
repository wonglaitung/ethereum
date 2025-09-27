/**
 * Web3钱包地址验证服务
 * 
 * 本服务用于银行验证客户是否真正持有其提供的Web3钱包地址
 * 实现了挑战-响应机制，确保地址有效且客户确实拥有私钥
 * 
 * 使用方法:
 * 1. 安装依赖: npm install express ethers
 * 2. 运行服务: node server.js
 * 3. 访问: http://localhost:3000
 * 
 * @author Web3验证系统
 * @version 1.0.0
 */

// 导入必要的模块
const express = require('express');
const crypto = require('crypto');
const { ethers } = require('ethers');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件设置
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * 生成随机字符串
 * @param {number} length - 字符串长度
 * @returns {string} 随机字符串
 */
function generateRandomString(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * 验证以太坊地址格式
 * @param {string} address - 要验证的地址
 * @returns {boolean} 地址是否有效
 */
function isValidEthAddress(address) {
  try {
    // 使用ethers.js验证地址格式
    return ethers.isAddress(address);
    //return true;
  } catch (error) {
    return false;
  }
}

// 挑战消息存储（生产环境应使用Redis）
const challenges = new Map();

// 静态文件服务 - 提供前端界面
app.use(express.static(path.join(__dirname, 'public')));

// 根路径重定向到index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/**
 * API端点：生成挑战消息
 * 客户端调用此API获取验证挑战
 */
app.post('/api/generate-challenge', (req, res) => {
  const { address } = req.body;
  
  // 验证地址参数
  if (!address) {
    return res.status(400).json({ 
      success: false, 
      message: '缺少钱包地址参数' 
    });
  }
  
  // 验证地址格式
  if (!isValidEthAddress(address)) {
    return res.status(400).json({ 
      success: false, 
      message: '无效的以太坊地址格式，请检查地址是否正确' 
    });
  }
  
  try {
    // 生成唯一挑战ID
    const challengeId = generateRandomString(16);
    const nonce = generateRandomString(8);
    const timestamp = Date.now();
    const expiresIn = 5 * 60 * 1000; // 5分钟有效期
    
    // 构建挑战消息
    const message = `请签名以验证您的钱包所有权。\n\n`
      + `挑战ID: ${challengeId}\n`
      + `时间戳: ${new Date(timestamp).toISOString()}\n`
      + `有效期: 5分钟\n`
      + `银行ID: BANK_ABC\n`
      + `随机数: ${nonce}`;
    
    // 存储挑战
    challenges.set(challengeId, {
      address,
      message,
      timestamp,
      expiresIn,
      used: false
    });
    
    res.json({
      success: true,
      challengeId,
      message,
      expiresAt: timestamp + expiresIn
    });
  } catch (error) {
    console.error('生成挑战时出错:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误' 
    });
  }
});

/**
 * API端点：验证签名
 * 客户端提交签名后，调用此API验证签名
 */
app.post('/api/verify-signature', (req, res) => {
  const { challengeId, address, signature } = req.body;
  
  // 验证必要参数
  if (!challengeId || !address || !signature) {
    return res.status(400).json({ 
      success: false, 
      message: '缺少必要参数' 
    });
  }
  
  // 验证地址格式
  if (!isValidEthAddress(address)) {
    return res.status(400).json({ 
      success: false, 
      message: '无效的以太坊地址格式' 
    });
  }
  
  // 检查挑战是否存在
  const challenge = challenges.get(challengeId);
  if (!challenge) {
    return res.status(400).json({ 
      success: false, 
      message: '挑战ID无效或已过期' 
    });
  }
  
  // 检查挑战是否已使用
  if (challenge.used) {
    return res.status(400).json({ 
      success: false, 
      message: '挑战ID已被使用' 
    });
  }
  
  // 检查挑战是否过期
  const now = Date.now();
  if (now > challenge.timestamp + challenge.expiresIn) {
    challenges.delete(challengeId);
    return res.status(400).json({ 
      success: false, 
      message: '挑战ID已过期' 
    });
  }
  
  // 验证签名
  try {
    // 使用ethers.js验证签名
    const recoveredAddress = ethers.verifyMessage(challenge.message, signature);
    
    // 比较恢复的地址与提供的地址（考虑大小写问题）
    const isAddressMatch = ethers.getAddress(recoveredAddress) === ethers.getAddress(address);
    
    if (isAddressMatch) {
      // 标记挑战为已使用
      challenges.set(challengeId, { ...challenge, used: true });
      
      // 实际应用中，这里可以存储验证成功的记录
      console.log(`钱包地址验证成功: ${address}`);
      
      return res.json({
        success: true,
        message: '钱包地址验证成功',
        address: address
      });
    } else {
      return res.status(400).json({
        success: false,
        message: '签名验证失败：签名与提供的地址不匹配'
      });
    }
  } catch (error) {
    console.error('签名验证错误:', error);
    return res.status(400).json({
      success: false,
      message: '签名验证失败：无效的签名格式'
    });
  }
});

/**
 * 定期清理过期挑战
 * 每分钟检查一次，删除过期挑战
 */
setInterval(() => {
  const now = Date.now();
  let expiredCount = 0;
  
  for (const [challengeId, challenge] of challenges) {
    if (now > challenge.timestamp + challenge.expiresIn) {
      challenges.delete(challengeId);
      expiredCount++;
    }
  }
  
  if (expiredCount > 0) {
    console.log(`清理了 ${expiredCount} 个过期的挑战`);
  }
}, 60 * 1000); // 每分钟检查一次

/**
 * 错误处理中间件
 * 捕获所有未处理的错误
 */
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误，请稍后重试'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`银行Web3钱包验证服务已启动`);
  console.log(`服务地址: http://localhost:${PORT}`);
  console.log(`==================================================`);
  console.log(`\n使用说明:`);
  console.log(`1. 确保已安装MetaMask等Web3钱包`);
  console.log(`2. 访问 http://localhost:${PORT} 进行钱包验证`);
  console.log(`3. 输入钱包地址并按照提示完成签名验证`);
  console.log(`\n注意: 此服务仅供开发测试使用，生产环境应部署在HTTPS服务器上`);
  console.log(`生产环境中绝对不要硬编码私钥，需完善错误处理机制`); // [[4]]
  console.log(`==================================================\n`);
});

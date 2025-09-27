# 项目概述

这是一个包含多个以太坊相关组件的综合性项目，主要涉及Web3钱包验证服务、稳定币合约、可升级合约示例以及多签钱包等区块链应用。该项目专为初学者设计，提供了一个功能丰富的区块链开发学习平台。

## 项目结构

```
ethereum/
├── Web3钱包验证服务 (根目录)
├── 稳定币合约 (stablecoin/)
├── 智能合约示例 (smart_contracts/)
└── 多签钱包 (multisigwallet/)
```

## 核心组件

### 1. Web3钱包验证服务
位于项目根目录，是一个基于Express.js的Web服务，用于验证用户是否真正持有其提供的Web3钱包地址。

特性：
- 实现了挑战-响应机制确保地址有效性
- 使用ethers.js库进行地址验证和签名验证
- 提供RESTful API接口
- 包含前端界面用于用户交互
- 支持命令行验证工具

主要文件：
- `server.js`: 后端服务实现
- `public/index.html`: 前端验证界面
- `cli_web3.js`: 命令行验证工具

### 2. 稳定币合约 (stablecoin/)
基于Solidity的ERC20标准稳定币实现，包含以下特性：
- 标准ERC20功能（转账、授权等）
- 所有权管理机制
- 铸造和销毁功能
- approveAndCall扩展功能

主要文件：
- `contracts/TokenERC20.sol`: 稳定币合约实现
- `scripts/deploy.js`: 部署脚本

### 3. 智能合约示例 (smart_contracts/)
包含可升级合约的示例实现：
- `Counter.sol`: 基础可升级计数器合约
- `CounterV2.sol`: 升级版计数器合约，添加了重置功能

主要文件：
- `contracts/Counter.sol`: 基础可升级计数器合约
- `contracts/CounterV2.sol`: 升级版计数器合约
- `scripts/deploy.js`: 部署脚本
- `scripts/upgrade.js`: 升级脚本
- `test/Counter.test.js`: 测试文件

### 4. 多签钱包 (multisigwallet/)
实现了一个基础的多签钱包合约，允许多个签名者共同管理资金。

主要文件：
- `contracts/MultiSigWallet.sol`: 多签钱包合约实现
- `scripts/deploy.js`: 部署脚本
- `scripts/execute.js`: 执行脚本

## 技术栈

- 后端: Node.js, Express.js
- 区块链: Solidity, Hardhat
- Web3库: ethers.js, web3.js
- 前端: HTML, JavaScript
- 测试框架: Hardhat内置测试工具
- 安全合约库: OpenZeppelin

## 构建和运行

### Web3钱包验证服务
1. 安装依赖: `npm install`
2. 运行服务: `node server.js`
3. 访问服务: `http://localhost:3000`

### 稳定币合约
1. 进入目录: `cd stablecoin`
2. 安装依赖: `npm install`
3. 编译合约: `npx hardhat compile`
4. 部署合约: `npx hardhat run scripts/deploy.js --network local`

### 可升级合约示例
1. 进入目录: `cd smart_contracts`
2. 安装依赖: `npm install`
3. 编译合约: `npx hardhat compile`
4. 部署合约: `npx hardhat run scripts/deploy.js --network local`
5. 升级合约: `npx hardhat run scripts/upgrade.js --network local`

### 多签钱包
1. 进入目录: `cd multisigwallet`
2. 安装依赖: `npm install`
3. 编译合约: `npx hardhat compile`
4. 部署合约: `npx hardhat run scripts/deploy.js --network local`
5. 执行交易: `npx hardhat run scripts/execute.js --network local`

## 开发约定

- 使用Hardhat作为以太坊开发环境
- 合约遵循Solidity编码规范
- 使用OpenZeppelin库增强合约安全性
- 后端服务遵循RESTful API设计原则
- 使用ethers.js作为主要的Web3库
- 合约升级采用UUPS模式实现
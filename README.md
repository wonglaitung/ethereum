# Ethereum Development Toolkit

一个综合性的以太坊开发工具包，包含Web3钱包验证服务、稳定币合约和多签钱包合约等组件，用于学习和开发区块链应用。

## 项目概述

本项目是一个功能丰富的以太坊开发工具包，主要包含以下核心组件：

1. **Web3钱包验证服务** - 一个基于Express.js的Web服务，用于验证用户是否真正持有其提供的Web3钱包地址，采用挑战-响应机制确保地址有效且用户拥有私钥。
2. **稳定币合约** - 基于Solidity的ERC20标准稳定币实现，具备铸造、销毁、所有权管理等特性。
3. **智能合约示例** - 包含可升级合约的示例实现(Counter和CounterV2)。
4. **多签钱包合约** - 实现了一个基础的多签钱包合约，允许多个签名者共同管理资金。

## 安装说明

### 环境要求

- Node.js (版本14或更高)
- npm (通常随Node.js一起安装)
- Git

### 安装步骤

1. 克隆项目仓库:
   ```bash
   git clone <repository-url>
   cd ethereum
   ```

2. 安装项目依赖:
   ```bash
   npm install
   ```

3. 对于各个智能合约子项目(如stablecoin、smart_contracts、multisigwallet)，也需要分别安装依赖:
   ```bash
   cd stablecoin && npm install && cd ..
   cd smart_contracts && npm install && cd ..
   cd multisigwallet && npm install && cd ..
   ```

## 使用方法

### 启动Web3钱包验证服务

1. 运行服务:
   ```bash
   node server.js
   ```

2. 在浏览器中访问 `http://localhost:3000` 使用Web界面进行钱包验证。

3. 或者使用命令行工具:
   ```bash
   node cli_web3.js
   ```

### 智能合约开发与部署

1. 编译合约:
   ```bash
   npx hardhat compile
   ```
   (需要在相应合约目录下执行)

2. 运行测试:
   ```bash
   npx hardhat test
   ```

3. 部署合约:
   ```bash
   npx hardhat ignition deploy ./ignition/modules/Lock.js
   ```

## 项目结构

```
ethereum/
├── server.js                  # Web3钱包验证服务后端
├── cli_web3.js                # 命令行验证工具
├── public/                    # Web前端静态资源
│   └── index.html             # Web3钱包验证前端界面
├── stablecoin/                # 稳定币合约
│   ├── contracts/
│   │   └── TokenERC20.sol     # 稳定币合约实现
│   └── scripts/
│       └── deploy.js          # 部署脚本
├── smart_contracts/           # 智能合约示例
│   ├── contracts/
│   │   ├── Counter.sol        # 基础可升级计数器合约
│   │   └── CounterV2.sol      # 升级版计数器合约
│   └── scripts/
│       ├── deploy.js          # 部署脚本
│       └── upgrade.js         # 升级脚本
└── multisigwallet/            # 多签钱包合约
    └── contracts/
        └── MultiSigWallet.sol # 多签钱包合约实现
```

## 技术栈

- **后端**: Node.js, Express.js
- **区块链开发**: Solidity, Hardhat
- **Web3库**: ethers.js, web3.js
- **前端**: HTML, JavaScript
- **测试框架**: Hardhat内置测试工具
- **安全合约库**: OpenZeppelin

## 合约功能说明

### 稳定币合约 (TokenERC20.sol)

- 标准ERC20功能（转账、授权等）
- 所有权管理机制
- 铸造和销毁功能
- approveAndCall扩展功能

### 可升级合约示例

- Counter.sol: 基础可升级计数器合约
- CounterV2.sol: 升级版计数器合约，添加了重置功能

### 多签钱包合约 (MultiSigWallet.sol)

- 多签地址管理
- 交易提案和确认机制
- 交易执行功能

## Web3验证服务说明

本服务实现了挑战-响应机制来验证钱包所有权:

1. 用户提供钱包地址
2. 服务生成唯一的挑战消息
3. 用户使用钱包对挑战消息进行签名
4. 服务验证签名的有效性

该机制确保用户不仅知道钱包地址，还拥有对应私钥。

## 许可证

本项目采用MIT许可证。详情请见 [LICENSE](LICENSE) 文件。
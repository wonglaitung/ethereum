# 多签钱包合约 (MultiSig Wallet Contract)

实现了一个基础的多签钱包合约，允许多个签名者共同管理资金。该合约是学习多签机制和钱包安全的优秀案例。

## 功能特性

- 多重签名验证：交易需要多个签名者确认才能执行
- 交易提交、确认和执行：完整的交易生命周期管理
- 所有者管理：支持添加/删除签名者和修改确认阈值
- 防重放攻击：每个交易只能执行一次
- 防重入攻击：安全的外部调用处理
- 事件日志：完整的操作记录

## 合约文件

- `contracts/MultiSigWallet.sol`: 多签钱包合约实现

## 部署和使用

1. 安装依赖:
   ```bash
   npm install
   ```

2. 编译合约:
   ```bash
   npx hardhat compile
   ```

3. 部署合约:
   ```bash
   npx hardhat run scripts/deploy.js --network local
   ```

4. 执行多签交易:
   ```bash
   npx hardhat run scripts/execute.js --network local
   ```

## 技术栈

- Solidity ^0.8.0
- Hardhat开发环境

## 使用说明

多签钱包的工作流程：
1. 部署时指定初始签名者列表和所需确认数
2. 向钱包充值ETH或其他代币
3. 任一签名者提交交易（转账或其他操作）
4. 其他签名者确认交易
5. 当确认数达到阈值时，交易自动执行
6. 支持撤销未执行的确认
7. 支持修改签名者列表和确认阈值
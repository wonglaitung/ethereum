# 稳定币合约 (Stablecoin Contract)

这是一个基于Solidity的ERC20标准稳定币实现，具备完整的代币功能。该合约可以作为学习ERC20代币开发的示例。

## 功能特性

- 标准ERC20功能（转账、授权等）
- 所有权管理机制
- 铸造和销毁功能
- approveAndCall扩展功能

## 合约文件

- `contracts/TokenERC20.sol`: 稳定币合约实现

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

4. 使用stablecoin.html界面与合约交互

## 技术栈

- Solidity ^0.8.0
- Hardhat开发环境
- OpenZeppelin库增强安全性

## 使用说明

部署成功后，可以使用项目根目录下的`stablecoin.html`文件与合约进行交互，支持以下功能：
- 查询代币名称、符号、精度和总供应量
- 查询指定地址的余额
- 代币转账
- 授权其他地址使用代币
- 从授权地址转账
- 销毁代币
- 从指定地址销毁代币
# 可升级合约示例 (Upgradeable Contracts Example)

本示例展示了如何实现可升级的智能合约，这是生产环境中非常重要的技术。通过使用OpenZeppelin的UUPS（Universal Upgradeable Proxy Standard）模式，可以在不迁移数据的情况下升级合约逻辑。

## 组件说明

- `Counter.sol`: 基础可升级计数器合约，实现了计数器的基本功能（增加和减少）
- `CounterV2.sol`: 升级版计数器合约，在基础功能上增加了重置计数器和获取版本号的功能

## 升级流程

1. 安装依赖:
   ```bash
   npm install
   ```

2. 编译合约:
   ```bash
   npx hardhat compile
   ```

3. 部署基础合约:
   ```bash
   npx hardhat run scripts/deploy.js --network local
   ```

4. 升级到V2版本:
   ```bash
   npx hardhat run scripts/upgrade.js --network local
   ```

## 测试

运行测试:
```bash
npx hardhat test
```

## 技术栈

- Solidity ^0.8.22
- Hardhat开发环境
- OpenZeppelin库实现可升级合约
- UUPS升级模式

## 使用说明

该示例演示了智能合约升级的核心概念：
1. 使用代理模式分离合约存储和逻辑
2. 通过UUPS标准实现安全升级
3. 保留升级前后合约的状态数据
4. 提供升级后的新增功能
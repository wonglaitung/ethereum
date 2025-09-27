// scripts/check-implementation.js
const { ethers } = require("ethers");

// 配置 Sepolia 网络
const SEPOLIA_RPC = "https://sepolia.infura.io/v3/b8f04500aab44a6c86f5fd95c0df8a61"; // 或使用 Infura/Alchemy
const PROXY_ADDRESS = "0x93722F89Aa401006051cb549A89e403319948E35"; // 替换为您的代理合约地址

// EIP-1967 标准存储槽 (implementation address)
const IMPLEMENTATION_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";

async function checkImplementation() {
  console.log("🔍 正在验证 Sepolia 上的代理合约实现地址...");
  console.log("Proxy Address:", PROXY_ADDRESS);
  console.log("--------------------------------------------------");

  try {
    // 1. 创建 Sepolia 提供者
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
    
    // 2. 获取原始存储值
    console.log("⏳ 查询 EIP-1967 存储槽 (slot 0)...");
    const implRaw = await provider.getStorage(PROXY_ADDRESS, IMPLEMENTATION_SLOT);
    
    // 3. 解析逻辑地址
    const implAddress = `0x${implRaw.slice(26)}`.toLowerCase();
    console.log("\n📦 原始存储值 (32 bytes):", implRaw);
    console.log("✅ 解析出的逻辑地址:", implAddress);

    // 4. 验证地址有效性
    if (implAddress === "0x0000000000000000000000000000000000000000") {
      console.error("\n🔥 错误：逻辑地址为空！代理合约未正确初始化");
      console.log("可能原因：");
      console.log("- 代理合约部署失败");
      console.log("- 升级操作未实际执行");
      process.exit(1);
    }

    // 5. 检查地址是否为合约
    const code = await provider.getCode(implAddress);
    if (code === "0x") {
      console.error("\n🔥 错误：逻辑地址不是有效合约！");
      console.log("可能原因：");
      console.log("- 逻辑合约部署失败");
      console.log("- 升级时指定了错误的地址");
      process.exit(1);
    }

    // 6. 高级诊断
    console.log("\n🔍 高级诊断信息:");
    console.log(`- 逻辑合约字节码长度: ${code.length/2 - 1} 字节`);
    
    // 检查是否包含 UUPS upgradeTo 函数 (0x095ea7b3)
    const hasUpgradeTo = code.includes("0x095ea7b3");
    console.log(`- 包含 upgradeTo 函数: ${hasUpgradeTo ? "✅ 是" : "❌ 否"}`);
    
    // 7. 最终结论
    console.log("\n--------------------------------------------------");
    console.log("✅ 验证完成！当前逻辑合约地址:");
    console.log(implAddress);
    console.log("--------------------------------------------------");
    
    // 8. 建议操作
    console.log("\n💡 建议下一步操作:");
    console.log(`1. 在 Etherscan 查看逻辑合约: https://sepolia.etherscan.io/address/${implAddress}`);
    console.log("2. 调用新函数验证: npx hardhat verify --network sepolia", implAddress);
    console.log("3. 如果地址未更新，请检查升级脚本是否包含 { kind: 'uups' } 参数");

  } catch (error) {
    console.error("\n❌ 验证失败:", error.message);
    console.error("可能原因:");
    console.error("- 无效的代理合约地址");
    console.error("- 网络连接问题");
    console.error("- Sepolia RPC 服务不可用");
    process.exit(1);
  }
}

// 执行验证
checkImplementation();

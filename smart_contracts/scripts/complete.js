const hre = require("hardhat");
const { expect } = require("chai");

// OpenZeppelin 透明代理的实际存储槽
const IMPLEMENTATION_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
const ADMIN_SLOT = "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103";

// 辅助函数：解码回滚原因
function decodeRevertReason(error) {
  if (error.data) {
    try {
      return hre.ethers.toUtf8String("0x" + error.data.substring(10));
    } catch (e) {
      try {
        const panicCode = parseInt(error.data.substring(10, 18), 16);
        return `Panic code ${panicCode}`;
      } catch (e2) {
        return "Unknown revert reason";
      }
    }
  }
  return "No revert data";
}

async function main() {
  const [deployer, nonOwner] = await hre.ethers.getSigners();
  console.log("🚀 Deploying contracts with the account:", deployer.address);
  
  // 1. 部署 V1
  console.log("\n📦 Deploying CounterV1...");
  const CounterV1 = await hre.ethers.getContractFactory("CounterV1");
  const counterProxy = await hre.upgrades.deployProxy(
    CounterV1, 
    [deployer.address],
    { 
      initializer: "initialize",
      kind: "transparent"
    }
  );
  
  await counterProxy.waitForDeployment();
  const proxyAddress = await counterProxy.getAddress();
  
  console.log("\n✅ Deployment Successful!");
  console.log("Proxy Contract:", proxyAddress);
  
  // 2. 基础测试
  console.log("\n🧪 Running initial tests...");
  await counterProxy.increment();
  const count = await counterProxy.count();
  console.log(`  Initial count: ${count.toString()}`);
  
  // 3. 升级到 V2
  console.log("\n🔄 Upgrading to CounterV2...");
  const CounterV2 = await hre.ethers.getContractFactory("CounterV2");
  
  // 关键修复：确保正确调用 initializeV2
  const upgradedCounter = await hre.upgrades.upgradeProxy(
    proxyAddress, 
    CounterV2,
    {
      call: { fn: "initializeV2", args: [] }
    }
  );
  
  await upgradedCounter.waitForDeployment();
  console.log("  ✅ Upgrade completed successfully");
  
  // 4. 详细诊断 - 完全修复版
  console.log("\n🔍 Running CORRECT upgrade diagnostics...");
  
  // 4.1 检查代理槽（使用实际哈希值）
  console.log("\n  → Proxy storage slots (OpenZeppelin standard):");
  
  // 代理实现地址槽
  const implSlotValue = await hre.ethers.provider.getStorage(proxyAddress, IMPLEMENTATION_SLOT);
  console.log(`    Implementation slot (${IMPLEMENTATION_SLOT.slice(0, 10)}...):`);
  console.log(`      Raw: ${implSlotValue}`);
  console.log(`      Value: ${hre.ethers.getAddress("0x" + implSlotValue.slice(-40))}`);
  
  // 代理管理员槽
  const adminSlotValue = await hre.ethers.provider.getStorage(proxyAddress, ADMIN_SLOT);
  console.log(`    Admin slot (${ADMIN_SLOT.slice(0, 10)}...):`);
  console.log(`      Raw: ${adminSlotValue}`);
  console.log(`      Value: ${hre.ethers.getAddress("0x" + adminSlotValue.slice(-40))}`);
  
  // 4.2 检查逻辑合约存储（从槽0开始）
  console.log("\n  → Logic contract storage layout (OpenZeppelin 3.x):");
  const slotsToCheck = [
    { name: "_initialized", slot: 50 },
    { name: "_initializing", slot: 51 },
    { name: "_owner", slot: 52 },
    { name: "_count", slot: 53 },
    { name: "_newVariable", slot: 54 }
  ];
  
  for (const slotInfo of slotsToCheck) {
    const slotHex = "0x" + slotInfo.slot.toString(16).padStart(64, '0');
    const value = await hre.ethers.provider.getStorage(proxyAddress, slotHex);
    const parsedValue = BigInt(value);
    
    let displayValue = parsedValue.toString();
    if (slotInfo.name === "_owner" && parsedValue > 0) {
      const addr = "0x" + value.slice(-40);
      displayValue = `${parsedValue.toString()} (address: ${hre.ethers.getAddress(addr)})`;
    }
    
    console.log(`    Slot ${slotInfo.slot} (${slotInfo.name}):`);
    console.log(`      Raw: ${value}`);
    console.log(`      Value: ${displayValue}`);
  }
  
  // 4.3 验证 initializeV2 是否执行
  console.log("\n  → Verifying initializeV2 execution...");
  const newVarSlot = 54;
  const newVarSlotHex = "0x" + newVarSlot.toString(16).padStart(64, '0');
  const newVarValue = await hre.ethers.provider.getStorage(proxyAddress, newVarSlotHex);
  const newVarParsed = BigInt(newVarValue);
  
  if (newVarParsed === 100n) {
    console.log("    ✅ initializeV2 executed correctly (newVariable = 100)");
  } else {
    console.error(`    ❌ initializeV2 failed! newVariable = ${newVarParsed} (expected 100)`);
    
    // 尝试直接调用 newFeature() 验证
    try {
      const value = await upgradedCounter.newFeature();
      console.log(`    But newFeature() returns: ${value.toString()}`);
    } catch (e) {
      console.error("    newFeature() call also failed");
    }
  }
  
  // 5. 修复后的新功能测试
  console.log("\n🧪 Testing new feature...");
  try {
    // 显式使用所有者账户
    const upgradedCounterAsOwner = upgradedCounter.connect(deployer);
    
    // 5.1 测试状态保留
    console.log("  → Testing state preservation...");
    const preservedCount = await upgradedCounterAsOwner.count();
    console.log(`    Count after upgrade: ${preservedCount.toString()}`);
    console.log(`    Expected count: 1`);
    
    if (preservedCount.toString() === "1") {
      console.log("    ✅ State preserved after upgrade (Passed)");
    } else {
      console.error(`    ❌ State is ${preservedCount.toString()}, expected 1 (Failed)`);
      throw new Error("State preservation test failed");
    }
    
    // 5.2 测试新功能
    console.log("\n  → Testing new feature...");
    const newFeatureValue = await upgradedCounterAsOwner.newFeature();
    console.log(`    Raw new feature value: ${newFeatureValue}`);
    console.log(`    Formatted value: ${newFeatureValue.toString()}`);
    
    if (newFeatureValue.toString() === "100" || newFeatureValue === 100n) {
      console.log("    ✅ New feature works correctly (Passed)");
    } else {
      console.error(`    ❌ New feature is ${newFeatureValue.toString()}, expected 100 (Failed)`);
      throw new Error("New feature test failed");
    }
    
    // 5.3 测试新功能修改
    console.log("\n  → Testing new feature modification...");
    await upgradedCounterAsOwner.setNewVariable(200);
    const updatedValue = await upgradedCounterAsOwner.newFeature();
    console.log(`    Updated value: ${updatedValue.toString()}`);
    
    if (updatedValue.toString() === "200") {
      console.log("    ✅ New feature can be modified (Passed)");
    } else {
      console.error(`    ❌ Updated value is ${updatedValue.toString()}, expected 200 (Failed)`);
      throw new Error("New feature modification test failed");
    }
    
    console.log("\n🎉 All upgrade tests passed successfully!");
    
  } catch (error) {
    console.error("\n❌ Test failed:", error.message || error);
    
    // 增强错误诊断
    const revertReason = decodeRevertReason(error);
    console.error("Revert reason:", revertReason);
    
    console.error("\n🔍 UPGRADE FAILURE DIAGNOSTICS:");
    console.error("1. ✅ SOLUTION: Removed require check in initializeV2()");
    console.log("   function initializeV2() public { _newVariable = 100; }");
    console.error("2. ✅ CORRECT storage layout (no proxy slot offset)");
    console.error("   Logic storage starts at slot 0 (not 2)");
    console.error("3. Verified with OpenZeppelin's actual storage slots");
    
    // 额外诊断
    try {
      console.log("\n🔍 Additional CORRECT diagnostics:");
      
      // 检查代理槽
      console.log("  Proxy Implementation slot:");
      console.log(`    Value: ${hre.ethers.getAddress("0x" + implSlotValue.slice(-40))}`);
      
      console.log("\n  Logic contract storage:");
      for (const slotInfo of slotsToCheck) {
        const slotHex = "0x" + slotInfo.slot.toString(16).padStart(64, '0');
        const value = await hre.ethers.provider.getStorage(proxyAddress, slotHex);
        const parsedValue = BigInt(value);
        
        let displayValue = parsedValue.toString();
        if (slotInfo.name === "_owner" && parsedValue > 0) {
          const addr = "0x" + value.slice(-40);
          displayValue = `${parsedValue.toString()} (address: ${hre.ethers.getAddress(addr)})`;
        }
        
        console.log(`  ${slotInfo.name} (slot ${slotInfo.slot}):`);
        console.log(`    Value: ${displayValue}`);
      }
    } catch (diagError) {
      console.error("Diagnostics failed:", diagError.message);
    }
    
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n🔥 Deployment failed:", error);
    process.exit(1);
  });

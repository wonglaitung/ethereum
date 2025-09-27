// scripts/deploy.js
const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  // 获取合约工厂
  const MyToken = await hre.ethers.getContractFactory("TokenERC20");

  // 部署合约，初始供应量为 1,000,000 个代币
  const myToken = await MyToken.deploy(1000000, "MarcoWongToken", "MWTK");

  // 等待部署完成（至少5个区块确认）
  console.log("Waiting for 5 block confirmations...");
  await myToken.waitForDeployment();
  const receipt = await ethers.provider.getTransactionReceipt(myToken.deploymentTransaction().hash);
  const currentBlock = await ethers.provider.getBlockNumber();
  
  // 确保至少5个区块确认
  const confirmationsNeeded = 5;
  if (currentBlock - receipt.blockNumber < confirmationsNeeded) {
    console.log(`Current confirmations: ${currentBlock - receipt.blockNumber}. Waiting for ${confirmationsNeeded} confirmations...`);
    await new Promise(resolve => setTimeout(resolve, 30000)); // 等待30秒
  }

  // 获取合约地址
  const address = await myToken.getAddress();
  console.log("MyToken deployed to:", address);

  // 验证前等待额外时间（关键修复）
  console.log("Waiting 60 seconds for Etherscan to index the contract...");
  await new Promise(resolve => setTimeout(resolve, 60000));

  // 尝试验证（带重试机制）
  let verificationAttempts = 0;
  const maxAttempts = 3;
  
  while (verificationAttempts < maxAttempts) {
    try {
      console.log(`Attempt ${verificationAttempts + 1} of ${maxAttempts} to verify contract...`);
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: [1000000, "MarcoWongToken", "MWTK"],
      });
      console.log("Contract verified successfully!");
      break;
    } catch (error) {
      verificationAttempts++;
      if (verificationAttempts >= maxAttempts) {
        console.error("Max verification attempts reached. You may need to verify manually later.");
        console.error("Error details:", error.message);
      } else {
        console.log(`Verification failed. Waiting 30 seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }
  }
}

// 执行部署
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });

const { ethers } = require("hardhat");

async function main() {
  console.log("Starting MultiSigWallet deployment...");

  // 获取部署者账户
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 检查余额
  // const balance = await deployer.getBalance();
  // console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");

  // 部署参数
  const owners = [
    "0x0BA2759Afc86266ECedfb89f17A232ebEbfD54fa", // Hardhat测试账户1
    "0xd2d4Aa06777a7450f324e61aB02c3919147618d5", // Hardhat测试账户2
    "0x49Fc631703978D72f408D2FBc8Cd07E81aB532c7"  // Hardhat测试账户3
  ];
  const numConfirmationsRequired = 2;

  console.log("\nDeploying MultiSigWallet with parameters:");
  console.log("Owners:", owners);
  console.log("Required confirmations:", numConfirmationsRequired);

  // 部署合约
  const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
  const multiSigWallet = await MultiSigWallet.deploy(owners, numConfirmationsRequired);

  await multiSigWallet.waitForDeployment();
  const address = await multiSigWallet.getAddress();
  console.log("\nMultiSigWallet deployed to:", address);

  // 保存部署地址到文件（供后续脚本使用）
  const fs = require('fs');
  const deploymentData = {
    address: address,
    owners: owners,
    numConfirmationsRequired: numConfirmationsRequired,
    deployedAt: new Date().toISOString()
  };

  fs.writeFileSync('deployment.json', JSON.stringify(deploymentData, null, 2));
  console.log("Deployment data saved to deployment.json");

  // 验证合约（可选）
  console.log("\nVerifying contract on Etherscan...");
  await new Promise(resolve => setTimeout(resolve, 30000)); // 等待区块确认

  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: [owners, numConfirmationsRequired],
    });
    console.log("Contract verified successfully");
  } catch (error) {
    console.log("Verification failed (this is normal on testnets):", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


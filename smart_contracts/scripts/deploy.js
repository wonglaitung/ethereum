const { upgrades } = require("hardhat");

async function main() {
  const Counter = await ethers.getContractFactory("Counter");

  console.log("Deploying Counter (UUPS Proxy)...");

  // 部署代理合约
  const counter = await upgrades.deployProxy(Counter, [], {
    kind: "uups",
  });

  await counter.waitForDeployment();
  const address = await counter.getAddress();

  console.log("Counter proxy deployed to:", address);
  console.log("Implementation address:", await upgrades.erc1967.getImplementationAddress(address));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

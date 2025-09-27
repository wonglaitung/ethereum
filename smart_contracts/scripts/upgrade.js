const { upgrades } = require("hardhat");

async function main() {
  const proxyAddress = "0x3488F65F98ab639770f581f553366C3457823f78"; // 替换为实际地址

  const CounterV2 = await ethers.getContractFactory("CounterV2");
  console.log("Upgrading Counter to V2...");

  const counterV2 = await upgrades.upgradeProxy(proxyAddress, CounterV2);
  await counterV2.waitForDeployment();

  console.log("Counter upgraded to V2!");
  console.log("New implementation address:", await upgrades.erc1967.getImplementationAddress(proxyAddress));
}

main().catch(console.error);

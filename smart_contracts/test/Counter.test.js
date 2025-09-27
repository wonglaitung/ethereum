const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { keccak256 } = require("ethers");

describe("Counter", function () {
  let counter;
  let owner;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();

    const Counter = await ethers.getContractFactory("Counter");
    counter = await upgrades.deployProxy(Counter, [], { kind: "uups" });
    await counter.waitForDeployment();
  });

  it("should start with count 0", async function () {
    expect(await counter.count()).to.equal(0);
  });

  it("should increment count", async function () {
    await (await counter.increment()).wait();
    expect(await counter.count()).to.equal(1);
  });

  it("should upgrade to V2 and reset", async function () {
    await (await counter.increment()).wait();
    expect(await counter.count()).to.equal(1);

    const proxyAddress = await counter.getAddress();
    console.log("\nProxy address:", proxyAddress);

    const oldImpl = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log("Old implementation:", oldImpl); 
    
    console.log("Upgrading to CounterV2...");
    const CounterV2 = await ethers.getContractFactory("CounterV2");
    //const upgraded = await upgrades.upgradeProxy(proxyAddress, CounterV2);
    // ✅ 关键修复：显式指定 kind: "uups"
    const upgraded = await upgrades.upgradeProxy(proxyAddress, CounterV2, { 
      kind: "uups" 
    });
    await upgraded.waitForDeployment();

    console.log("Waited 60s");
    const delay = ms => new Promise(res => setTimeout(res, ms));
    await delay(60000);

    const newImpl = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log("New implementation:", newImpl);

    // ✅ 确保实现地址已更新
    expect(newImpl).to.not.equal(oldImpl);

    // 用新 ABI + signer 重新连接
    const counterV2 = CounterV2.connect(owner).attach(proxyAddress);

    // ✅ 确保升级后状态不变
    expect(await counterV2.count()).to.equal(1);

    // 调用 reset
    await (await counterV2.reset()).wait();
    expect(await counterV2.count()).to.equal(0);

    // 调用新函数
    expect(await counterV2.getVersion()).to.equal("V2");
  });
});

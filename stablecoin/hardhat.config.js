require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.0",
  mocha: {
    timeout: 240000 // 将超时时间增加到 120 秒
  },
  sourcify: {
    enabled: true
  },
  networks: {
    local: {
      url: "http://localhost:8545",
      accounts: ["1f959b047457de0f56b957f66bca32cc6d2af0751588eddecf625c2e2ea2830b","42eafe2e3a2e9a11eb0f0751f388ed41e56bdc8f24f24603f666a29ad8dd1e0a"],
      chainId: 1234567,
    },
    sepolia: {
      url: "https://sepolia.infura.io/v3/b8f04500aab44a6c86f5fd95c0df8a61",
      accounts: ["14b9d626ab779237668a1f548cac41e6aa929a270e811d71d88cba4617bfff32"],
    },
  },
  paths: {
    sources: "./contracts",
  },
  etherscan: {
    apiKey: "H2KTW79RD468SUTFEIN1KW1HZBT6PAQK41",
    timeout: 20000,
    apiV2: true
  }
};

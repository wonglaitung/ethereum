const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  console.log("Starting MultiSigWallet transaction execution with multiple signers...");
  
  // 检查部署数据
  let deploymentData;
  try {
    deploymentData = JSON.parse(fs.readFileSync('deployment.json', 'utf8'));
    console.log("Using deployed contract at:", deploymentData.address);
  } catch (error) {
    throw new Error("No deployment data found. Please run deploy.js first.");
  }

  // 获取三个独立的signer（钱包）
  const [signer1, signer2, signer3] = await ethers.getSigners();
  console.log("\nAvailable signers:");
  console.log(`Signer 1: ${signer1.address}`);
  console.log(`Signer 2: ${signer2.address}`);
  console.log(`Signer 3: ${signer3.address}`);
  
  // 验证这些signer是否在合约的owners列表中
  const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
  const multiSigWallet = MultiSigWallet.attach(deploymentData.address);
  
  // 检查owners列表
  const owners = [];
  for (let i = 0; i < deploymentData.owners.length; i++) {
    owners.push(await multiSigWallet.owners(i));
  }
  
  console.log("\nContract owners:");
  for (let i = 0; i < owners.length; i++) {
    console.log(`Owner ${i+1}: ${owners[i]}`);
  }
  
  // 验证signer是否在owners列表中
  const verifySignerInOwners = (signerAddress) => {
    const isInOwners = owners.some(owner => 
      owner.toLowerCase() === signerAddress.toLowerCase()
    );
    if (!isInOwners) {
      console.warn(`WARNING: ${signerAddress} is not in the contract's owners list!`);
    }
    return isInOwners;
  };
  
  verifySignerInOwners(signer1.address);
  verifySignerInOwners(signer2.address);
  verifySignerInOwners(signer3.address);


  // === 确保合约有足够的ETH ===
  console.log("\n⚠️ Funding multisig wallet with 0.003 ETH...");
  const fundingAmount = ethers.parseEther("0.003");
  const currentBalance = await ethers.provider.getBalance(multiSigWallet.target);
  console.log(`Current contract ${multiSigWallet.target} balance: ${ethers.formatEther(currentBalance)} ETH`);

  if (currentBalance < fundingAmount) {
    const fundTx = await signer1.sendTransaction({
      to: multiSigWallet.target,
      value: fundingAmount
    });
    await fundTx.wait();
    console.log(`✅ Funded contract. New balance: ${ethers.formatEther(await ethers.provider.getBalance(multiSigWallet.target))} ETH`);
  } else {
    console.log("✅ Contract already has sufficient balance");
  }
  // === 充值结束 ===

  // 1. 使用Signer1提交新交易
  console.log("\nStep 1: Signer1 is submitting a new transaction...");
  const multiSigWallet1 = multiSigWallet.connect(signer1);
  
  const recipient = signer2.address;
  const amount = ethers.parseEther("0.001");
  
  const submitTx = await multiSigWallet1.submitTransaction(
    recipient, 
    amount, 
    "0x"
  );
  await submitTx.wait();
  console.log("Transaction submitted by Signer1. Hash:", submitTx.hash);
  
  // 获取最新交易索引
  const txCount = await multiSigWallet1.getTransactionCount();
  const txIndex = txCount - 1n;
  console.log("New transaction index:", txIndex.toString());

  // 2. 使用Signer2进行第一次确认
  console.log("\nStep 2: Signer2 is confirming the transaction...");
  const multiSigWallet2 = multiSigWallet.connect(signer2);
  
  try {
    const tx = await multiSigWallet2.confirmTransaction.populateTransaction(txIndex);
    const txResponse = await signer2.sendTransaction({
      to: tx.to,
      data: tx.data,
      gasLimit: 1000000
    });
    await txResponse.wait();
    console.log("Signer2 confirmation transaction sent. Hash:", txResponse.hash);
  } catch (error) {
    console.error("Signer2 confirmation failed:", error.message);
    throw error;
  }
  
  // 验证确认是否添加
  const isConfirmedBySigner2 = await multiSigWallet.isConfirmed(txIndex, signer2.address);
  console.log("Is confirmed by Signer2:", isConfirmedBySigner2);
  if (!isConfirmedBySigner2) {
    throw new Error("Signer2 confirmation did not persist!");
  }

  // 3. 使用Signer3进行第二次确认
  console.log("\nStep 3: Signer3 is confirming the transaction...");
  const multiSigWallet3 = multiSigWallet.connect(signer3);
  
  try {
    const tx = await multiSigWallet3.confirmTransaction.populateTransaction(txIndex);
    const txResponse = await signer3.sendTransaction({
      to: tx.to,
      data: tx.data,
      gasLimit: 1000000
    });
    await txResponse.wait();
    console.log("Signer3 confirmation transaction sent. Hash:", txResponse.hash);
  } catch (error) {
    console.error("Signer3 confirmation failed:", error.message);
    throw error;
  }
  
  // 验证确认状态
  const isConfirmedBySigner3 = await multiSigWallet.isConfirmed(txIndex, signer3.address);
  console.log("Is confirmed by Signer3:", isConfirmedBySigner3);
  
  const finalConfirmations = await multiSigWallet.getConfirmationCount(txIndex);
  console.log(`\nFinal confirmations count: ${finalConfirmations}`);
  console.log("Required confirmations:", deploymentData.numConfirmationsRequired);
  
  if (finalConfirmations < deploymentData.numConfirmationsRequired) {
    throw new Error(`Not enough confirmations! Have ${finalConfirmations}, need ${deploymentData.numConfirmationsRequired}`);
  }

  // === 修复关键点：检查交易是否已被自动执行 ===
  const transaction = await multiSigWallet.transactions(txIndex);
  console.log(`\nAfter confirmations, transaction executed status: ${transaction.executed}`);
  
  if (transaction.executed) {
    console.log("✅ Transaction already executed automatically by the last confirmation.");
    
    // 验证资金是否转移
    const recipientBalance = await ethers.provider.getBalance(recipient);
    console.log(`Recipient balance: ${ethers.formatEther(recipientBalance)} ETH`);
    console.log("✅ Transaction completed successfully without manual execution!");
  } else {
    // 仅当未执行时才手动执行
    console.log("\nStep 4: Explicitly executing transaction (not auto-executed)...");
    try {
      const tx = await multiSigWallet1.executeTransaction.populateTransaction(txIndex);
      const txResponse = await signer1.sendTransaction({
        to: tx.to,
        data: tx.data,
        gasLimit: 1000000
      });
      await txResponse.wait();
      console.log("Transaction executed successfully. Hash:", txResponse.hash);
      
      // 检查交易状态
      const updatedTransaction = await multiSigWallet.transactions(txIndex);
      console.log("Transaction executed status:", updatedTransaction.executed);
      
      // 验证资金是否转移
      const recipientBalance = await ethers.provider.getBalance(recipient);
      console.log(`Recipient balance: ${ethers.formatEther(recipientBalance)} ETH`);
    } catch (error) {
      console.error("Failed to execute transaction:", error.message);
      
      // 附加诊断信息
      const updatedTransaction = await multiSigWallet.transactions(txIndex);
      console.log("Transaction details:", {
        to: updatedTransaction.to,
        value: ethers.formatEther(updatedTransaction.value),
        executed: updatedTransaction.executed
      });
      
      const confirmations = await multiSigWallet.getConfirmationCount(txIndex);
      console.log(`Current confirmations: ${confirmations}, Required: ${deploymentData.numConfirmationsRequired}`);
      
      process.exit(1);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ ERROR:", error.message);
    process.exit(1);
  });


const hre = require("hardhat");

async function main() {
  const portalAddress = "0x127815A42eF31D8796B21d07531E6D1c0B1AAe28";
  const subscriptionId = 6383;

  console.log(`Setting Subscription ID ${subscriptionId} on contract ${portalAddress}...`);

  const InsurancePortal = await hre.ethers.getContractFactory("InsurancePortal");
  const portal = await InsurancePortal.attach(portalAddress);

  const tx = await portal.setSubscriptionId(subscriptionId);
  console.log("Transaction hash:", tx.hash);

  await tx.wait();
  console.log("Subscription ID updated successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

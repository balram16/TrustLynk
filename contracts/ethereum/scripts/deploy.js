const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying InsurancePortal to", network.name, "...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy InsurancePortal
  const InsurancePortal = await ethers.getContractFactory("InsurancePortal");
  const portal = await InsurancePortal.deploy();
  await portal.waitForDeployment();

  const contractAddress = await portal.getAddress();
  console.log("📋 InsurancePortal deployed to:", contractAddress);

  // Initialize the contract
  console.log("\n⚙️  Initializing contract...");
  const initTx = await portal.initialize(deployer.address);
  await initTx.wait();
  console.log("✅ Contract initialized with admin:", deployer.address);

  // Verify initialization
  const isInit = await portal.isInitialized();
  const adminCheck = await portal.checkAdminStatus(deployer.address);
  console.log("   - Is Initialized:", isInit);
  console.log("   - Admin Status:", adminCheck);

  // Fund the contract with some ETH for claims payouts
  if (network.name === "localhost" || network.name === "hardhat") {
    console.log("\n💰 Funding contract treasury for claims...");
    const fundTx = await deployer.sendTransaction({
      to: contractAddress,
      value: ethers.parseEther("10.0"),
    });
    await fundTx.wait();
    const treasury = await portal.getTreasury();
    console.log("   - Treasury balance:", ethers.formatEther(treasury), "ETH");

    // Create sample policies for testing
    console.log("\n📝 Creating sample policies...");

    await (await portal.createPolicy({
      title: "Health Shield Basic",
      description: "Comprehensive health coverage for individuals and families with cashless hospitalization",
      policyType: 1,
      monthlyPremium: ethers.parseEther("0.002"),
      yearlyPremium: ethers.parseEther("0.024"),
      coverageAmount: ethers.parseEther("2.0"),
      minAge: 18, maxAge: 65, durationDays: 365, waitingPeriodDays: 30,
    })).wait();
    console.log("   ✓ Created: Health Shield Basic");

    await (await portal.createPolicy({
      title: "Life Secure Premium",
      description: "Life insurance with guaranteed returns and family protection",
      policyType: 2,
      monthlyPremium: ethers.parseEther("0.005"),
      yearlyPremium: ethers.parseEther("0.06"),
      coverageAmount: ethers.parseEther("5.0"),
      minAge: 21, maxAge: 55, durationDays: 730, waitingPeriodDays: 90,
    })).wait();
    console.log("   ✓ Created: Life Secure Premium");

    await (await portal.createPolicy({
      title: "Auto Guard Plus",
      description: "Complete vehicle insurance with roadside assistance and zero depreciation",
      policyType: 3,
      monthlyPremium: ethers.parseEther("0.001"),
      yearlyPremium: ethers.parseEther("0.012"),
      coverageAmount: ethers.parseEther("1.0"),
      minAge: 18, maxAge: 70, durationDays: 365, waitingPeriodDays: 0,
    })).wait();
    console.log("   ✓ Created: Auto Guard Plus");

    await (await portal.createPolicy({
      title: "Travel Safe International",
      description: "Worldwide travel insurance with medical emergency coverage and trip cancellation protection",
      policyType: 5,
      monthlyPremium: ethers.parseEther("0.0005"),
      yearlyPremium: ethers.parseEther("0.006"),
      coverageAmount: ethers.parseEther("0.5"),
      minAge: 1, maxAge: 80, durationDays: 180, waitingPeriodDays: 0,
    })).wait();
    console.log("   ✓ Created: Travel Safe International");
  }

  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("Network:          ", network.name);
  console.log("Contract Address: ", contractAddress);
  console.log("Admin:            ", deployer.address);
  console.log("=".repeat(60));
  console.log("\n⚡ Update your frontend .env.local with:");
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);
  console.log(`NEXT_PUBLIC_CHAIN_ID=${network.config.chainId}`);

  // Save deployment info
  const fs = require("fs");
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    contractAddress: contractAddress,
    admin: deployer.address,
    deployedAt: new Date().toISOString(),
    abi: "artifacts/contracts/InsurancePortal.sol/InsurancePortal.json",
  };

  const deployDir = "./deployments";
  if (!fs.existsSync(deployDir)) {
    fs.mkdirSync(deployDir, { recursive: true });
  }
  fs.writeFileSync(
    `${deployDir}/${network.name}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log(`\n📄 Deployment info saved to ${deployDir}/${network.name}.json`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

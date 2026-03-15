const { ethers } = require("hardhat");

async function main() {
    const CONTRACT_ADDRESS = "0xC83D30cBF0B9066A1c215e401fD73116753475b4";
    
    const [deployer] = await ethers.getSigners();
    console.log("Checking with address:", deployer.address);

    const balance = await ethers.provider.getBalance(CONTRACT_ADDRESS);
    console.log(`\n💰 Contract Balance: ${ethers.formatEther(balance)} ETH`);

    // Fetch claim details using the contract instance
    const InsurancePortal = await ethers.getContractFactory("InsurancePortal");
    const contract = InsurancePortal.attach(CONTRACT_ADDRESS);

    try {
        const claims = await contract.getAllClaims();
        console.log(`\n📋 Found ${claims.length} claims on blockchain:`);
        
        let hasPending = false;
        let totalPendingWei = 0n;

        for (let i = 0; i < claims.length; i++) {
            const c = claims[i];
            const statusStr = c.status === 0 ? "APPROVED" : c.status === 1 ? "PENDING" : "REJECTED";
            console.log(`  - Claim #${c.claimId} | Status: ${statusStr} | Amount: ${ethers.formatEther(c.claimAmount)} ETH`);
            
            if (c.status === 1) { // PENDING
                hasPending = true;
                totalPendingWei += c.claimAmount;
            }
        }

        if (hasPending) {
            console.log(`\n📊 Total PENDING Claim Amount: ${ethers.formatEther(totalPendingWei)} ETH`);
            if (balance < totalPendingWei) {
                console.log(`\n❌ ERROR: Contract balance (${ethers.formatEther(balance)} ETH) is LESS than the total pending claims.`);
                console.log(`👉 FIX: Send at least ${ethers.formatEther(totalPendingWei - balance)} ETH to the contract address (${CONTRACT_ADDRESS}).`);
            } else {
                console.log(`\n✅ Contract has enough balance to approve ALL pending claims.`);
            }
        } else {
            console.log(`\nℹ️ No PENDING claims found to check.`);
        }
    } catch (err) {
        console.error("Error fetching claims:", err.message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

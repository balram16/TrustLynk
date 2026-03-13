const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("InsurancePortal", function () {
  let portal;
  let admin, user1, user2;

  beforeEach(async function () {
    [admin, user1, user2] = await ethers.getSigners();

    const InsurancePortal = await ethers.getContractFactory("InsurancePortal");
    portal = await InsurancePortal.deploy();
    await portal.waitForDeployment();

    // Initialize
    await portal.initialize(admin.address);
  });

  describe("Initialization", function () {
    it("Should initialize correctly", async function () {
      expect(await portal.isInitialized()).to.be.true;
      expect(await portal.admin()).to.equal(admin.address);
    });

    it("Should not allow double initialization", async function () {
      await expect(portal.initialize(admin.address)).to.be.revertedWith("Already initialized");
    });

    it("Admin should be registered", async function () {
      const role = await portal.getUserRole(admin.address);
      expect(role).to.equal(2); // ROLE_ADMIN
    });
  });

  describe("User Registration", function () {
    it("Should register a policyholder", async function () {
      await portal.connect(user1).registerUser(user1.address, 1);
      const role = await portal.getUserRole(user1.address);
      expect(role).to.equal(1); // ROLE_POLICYHOLDER
    });

    it("Should register an admin", async function () {
      await portal.connect(user2).registerUser(user2.address, 2);
      const role = await portal.getUserRole(user2.address);
      expect(role).to.equal(2); // ROLE_ADMIN
    });

    it("Should not allow double registration", async function () {
      await portal.connect(user1).registerUser(user1.address, 1);
      await expect(portal.connect(user1).registerUser(user1.address, 1))
        .to.be.revertedWith("Already registered");
    });

    it("Should emit UserRegistered event", async function () {
      await expect(portal.connect(user1).registerUser(user1.address, 1))
        .to.emit(portal, "UserRegistered")
        .withArgs(user1.address, 1);
    });
  });

  describe("Policy Management", function () {
    it("Admin should create a policy", async function () {
      const policyParams = {
        title: "Health Basic",
        description: "Basic health insurance",
        policyType: 1,
        monthlyPremium: ethers.parseEther("0.01"),
        yearlyPremium: ethers.parseEther("0.12"),
        coverageAmount: ethers.parseEther("1.0"),
        minAge: 18,
        maxAge: 65,
        durationDays: 365,
        waitingPeriodDays: 30,
      };

      const tx = await portal.createPolicy(policyParams);
      await expect(tx).to.emit(portal, "PolicyCreated");

      const allPolicies = await portal.getAllPolicies();
      expect(allPolicies.length).to.equal(1);
      expect(allPolicies[0].title).to.equal("Health Basic");
    });

    it("Non-admin should not create policy", async function () {
      await portal.connect(user1).registerUser(user1.address, 1);
      const policyParams = {
        title: "Test", description: "Test", policyType: 1,
        monthlyPremium: ethers.parseEther("0.01"),
        yearlyPremium: ethers.parseEther("0.12"),
        coverageAmount: ethers.parseEther("1.0"),
        minAge: 18, maxAge: 65, durationDays: 365, waitingPeriodDays: 30,
      };
      await expect(portal.connect(user1).createPolicy(policyParams))
        .to.be.revertedWith("Not admin");
    });
  });

  describe("Policy Purchase", function () {
    beforeEach(async function () {
      await portal.connect(user1).registerUser(user1.address, 1);

      await portal.createPolicy({
        title: "Health Plus",
        description: "Premium health insurance",
        policyType: 1,
        monthlyPremium: ethers.parseEther("0.01"),
        yearlyPremium: ethers.parseEther("0.12"),
        coverageAmount: ethers.parseEther("1.0"),
        minAge: 18, maxAge: 65, durationDays: 365, waitingPeriodDays: 30,
      });
    });

    it("Should purchase policy with ETH payment", async function () {
      const purchaseParams = {
        policyId: 1,
        metadataUri: "ipfs://metadata-uri",
        holderName: "Test User",
        holderAge: 25,
        holderGender: "Male",
        holderBloodGroup: "O+",
      };

      const tx = await portal.connect(user1).purchasePolicy(purchaseParams, {
        value: ethers.parseEther("0.01"),
      });

      await expect(tx).to.emit(portal, "PolicyPurchased");

      const myPolicies = await portal.getMyPolicies(user1.address);
      expect(myPolicies.length).to.equal(1);
      expect(myPolicies[0].active).to.be.true;
    });

    it("Should reject insufficient payment", async function () {
      const purchaseParams = {
        policyId: 1,
        metadataUri: "ipfs://test",
        holderName: "Test",
        holderAge: 25,
        holderGender: "Male",
        holderBloodGroup: "O+",
      };
      await expect(
        portal.connect(user1).purchasePolicy(purchaseParams, {
          value: ethers.parseEther("0.001"),
        })
      ).to.be.revertedWith("Insufficient payment");
    });
  });

  describe("Claims", function () {
    beforeEach(async function () {
      await portal.connect(user1).registerUser(user1.address, 1);
      await portal.createPolicy({
        title: "Health Plus", description: "Premium health insurance", policyType: 1,
        monthlyPremium: ethers.parseEther("0.01"),
        yearlyPremium: ethers.parseEther("0.12"),
        coverageAmount: ethers.parseEther("1.0"),
        minAge: 18, maxAge: 65, durationDays: 365, waitingPeriodDays: 30,
      });
      await portal.connect(user1).purchasePolicy({
        policyId: 1, metadataUri: "ipfs://meta",
        holderName: "Test User", holderAge: 25, holderGender: "Male", holderBloodGroup: "O+",
      }, { value: ethers.parseEther("0.01") });

      // Fund contract for payouts
      await admin.sendTransaction({
        to: await portal.getAddress(),
        value: ethers.parseEther("5.0"),
      });
    });

    it("Should submit claim with low score (auto-approve)", async function () {
      await portal.connect(user1).claimPolicy({
        policyId: 1, aggregateScore: 20,
        abhaId: "ABHA123", ipfsCid: "QmTestCID", oracleRequestId: "REQ_001",
        claimDescription: "Hospitalization", hospitalName: "Apollo Hospital",
      });

      const userClaimsResult = await portal.getUserClaims(user1.address);
      expect(userClaimsResult.length).to.equal(1);
      expect(userClaimsResult[0].status).to.equal(1); // APPROVED
    });

    it("Should submit claim with medium score (pending)", async function () {
      await portal.connect(user1).claimPolicy({
        policyId: 1, aggregateScore: 50,
        abhaId: "ABHA123", ipfsCid: "QmTestCID", oracleRequestId: "REQ_002",
        claimDescription: "Surgery", hospitalName: "Max Hospital",
      });

      const userClaimsResult = await portal.getUserClaims(user1.address);
      expect(userClaimsResult[0].status).to.equal(2); // PENDING
    });

    it("Should submit claim with high score (rejected)", async function () {
      await portal.connect(user1).claimPolicy({
        policyId: 1, aggregateScore: 80,
        abhaId: "ABHA123", ipfsCid: "QmTestCID", oracleRequestId: "REQ_003",
        claimDescription: "Suspicious claim", hospitalName: "Unknown Hospital",
      });

      const userClaimsResult = await portal.getUserClaims(user1.address);
      expect(userClaimsResult[0].status).to.equal(3); // REJECTED
    });

    it("Admin should approve pending claim", async function () {
      await portal.connect(user1).claimPolicy({
        policyId: 1, aggregateScore: 50,
        abhaId: "ABHA123", ipfsCid: "QmTestCID", oracleRequestId: "REQ_004",
        claimDescription: "Surgery", hospitalName: "AIIMS",
      });

      await portal.approveClaim(1);

      const claimDetails = await portal.getClaimDetails(1);
      expect(claimDetails.status).to.equal(1); // APPROVED
    });

    it("Admin should reject pending claim", async function () {
      await portal.connect(user1).claimPolicy({
        policyId: 1, aggregateScore: 50,
        abhaId: "ABHA123", ipfsCid: "QmTestCID", oracleRequestId: "REQ_005",
        claimDescription: "Surgery", hospitalName: "AIIMS",
      });

      await portal.rejectClaim(1);

      const claimDetails = await portal.getClaimDetails(1);
      expect(claimDetails.status).to.equal(3); // REJECTED
    });
  });

  describe("Treasury", function () {
    it("Should accept ETH deposits", async function () {
      await admin.sendTransaction({
        to: await portal.getAddress(),
        value: ethers.parseEther("1.0"),
      });

      const treasury = await portal.getTreasury();
      expect(treasury).to.equal(ethers.parseEther("1.0"));
    });
  });

  describe("NFT Tokens", function () {
    beforeEach(async function () {
      await portal.connect(user1).registerUser(user1.address, 1);
      await portal.createPolicy({
        title: "Health Plus", description: "Premium health insurance", policyType: 1,
        monthlyPremium: ethers.parseEther("0.01"),
        yearlyPremium: ethers.parseEther("0.12"),
        coverageAmount: ethers.parseEther("1.0"),
        minAge: 18, maxAge: 65, durationDays: 365, waitingPeriodDays: 30,
      });
      await portal.connect(user1).purchasePolicy({
        policyId: 1, metadataUri: "ipfs://meta",
        holderName: "Test User", holderAge: 25, holderGender: "Male", holderBloodGroup: "O+",
      }, { value: ethers.parseEther("0.01") });
    });

    it("Should track user tokens", async function () {
      const tokens = await portal.getUserTokensList(user1.address);
      expect(tokens.length).to.equal(1);
      expect(tokens[0]).to.equal("POLICY_1");
    });

    it("Should track total tokens", async function () {
      expect(await portal.getTotalTokens()).to.equal(1);
    });

    it("Should store NFT metadata", async function () {
      const metadata = await portal.getNFTMetadata("POLICY_1");
      expect(metadata.name).to.equal("Policy NFT");
      expect(metadata.holderName).to.equal("Test User");
    });
  });
});

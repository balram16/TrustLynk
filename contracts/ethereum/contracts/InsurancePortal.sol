// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title InsurancePortal
 * @dev Decentralized insurance platform on Ethereum
 * Converted from Soroban/Rust smart contract for TrustLynk
 */
contract InsurancePortal {
    // ==========================================
    // Constants
    // ==========================================
    uint32 public constant ROLE_UNREGISTERED = 0;
    uint32 public constant ROLE_POLICYHOLDER = 1;
    uint32 public constant ROLE_ADMIN = 2;

    uint32 public constant POLICY_TYPE_HEALTH = 1;
    uint32 public constant POLICY_TYPE_LIFE = 2;
    uint32 public constant POLICY_TYPE_AUTO = 3;
    uint32 public constant POLICY_TYPE_HOME = 4;
    uint32 public constant POLICY_TYPE_TRAVEL = 5;

    uint32 public constant CLAIM_STATUS_APPROVED = 1;
    uint32 public constant CLAIM_STATUS_PENDING = 2;
    uint32 public constant CLAIM_STATUS_REJECTED = 3;

    uint256 public constant ESCROW_DURATION_SECONDS = 2592000; // 30 days

    // ==========================================
    // Data Structures
    // ==========================================
    struct User {
        address wallet;
        uint32 role;
        bool registered;
        string name;
        string location;
        string contact;
        uint256 registeredAt;
    }

    struct Policy {
        uint256 policyId;
        string title;
        string description;
        uint32 policyType;
        uint256 monthlyPremium;
        uint256 yearlyPremium;
        uint256 coverageAmount;
        uint256 minAge;
        uint256 maxAge;
        uint256 durationDays;
        uint256 waitingPeriodDays;
        uint256 createdAt;
        address createdBy;
    }

    struct UserPolicy {
        uint256 policyId;
        address userAddress;
        uint256 purchaseDate;
        uint256 expiryDate;
        uint256 premiumPaidWei;
        uint256 monthlyPremiumWei;
        bool active;
        uint256 tokenId;
        string metadataUri;
        uint256 escrowId;
        string holderName;
        uint256 holderAge;
        string holderGender;
        string holderBloodGroup;
    }

    struct PolicyNFTMetadata {
        string name;
        string description;
        string imageUri;
        uint256 coverageAmount;
        uint256 validityStart;
        uint256 validityEnd;
        uint256 premiumAmount;
        uint32 policyType;
        string holderName;
        uint256 holderAge;
        string holderGender;
        string holderBloodGroup;
    }

    struct PaymentEscrow {
        address userAddress;
        uint256 policyId;
        uint256 monthlyPremiumWei;
        uint256 nextPaymentDue;
        uint256 paymentsMade;
        uint256 totalPaymentsRequired;
        uint256 escrowBalance;
        bool active;
    }

    struct PolicyClaim {
        uint256 claimId;
        uint256 policyId;
        address userAddress;
        uint256 claimAmount;
        uint32 aggregateScore;
        uint32 status;
        uint256 claimedAt;
        uint256 processedAt;
        string abhaId;
        string ipfsCid;
        string oracleRequestId;
        string claimDescription;
        string hospitalName;
    }

    struct OracleRequestData {
        string requestId;
        uint256 claimId;
        string abhaId;
        string ipfsCid;
        uint256 requestedAt;
        uint32 status;
    }

    // Param structs to avoid stack too deep
    struct PolicyParams {
        string title;
        string description;
        uint32 policyType;
        uint256 monthlyPremium;
        uint256 yearlyPremium;
        uint256 coverageAmount;
        uint256 minAge;
        uint256 maxAge;
        uint256 durationDays;
        uint256 waitingPeriodDays;
    }

    struct PurchaseParams {
        uint256 policyId;
        string metadataUri;
        string holderName;
        uint256 holderAge;
        string holderGender;
        string holderBloodGroup;
    }

    struct ClaimParams {
        uint256 policyId;
        uint32 aggregateScore;
        string abhaId;
        string ipfsCid;
        string oracleRequestId;
        string claimDescription;
        string hospitalName;
    }

    // ==========================================
    // State Variables
    // ==========================================
    address public admin;
    bool public initialized;

    uint256 public policyCounter;
    uint256 public tokenCounter;
    uint256 public escrowCounter;
    uint256 public claimCounter;
    uint256 public treasury;

    mapping(address => User) private _users;
    address[] public adminList;

    mapping(uint256 => Policy) private _policies;
    mapping(address => UserPolicy[]) private _userPolicies;

    mapping(uint256 => UserPolicy[]) private _allUserPolicies; // Reference for numeric lookups

    mapping(uint256 => PolicyNFTMetadata) private _nftMetadata;
    mapping(uint256 => uint256[]) private _policyTokens;
    mapping(address => uint256[]) private _userTokens;

    // ERC721 Mappings
    mapping(uint256 => address) private _tokenOwners;
    mapping(address => uint256) private _balances;

    mapping(uint256 => PaymentEscrow) private _escrows;
    mapping(address => uint256[]) private _userEscrows;

    mapping(uint256 => PolicyClaim) private _claims;
    mapping(address => uint256[]) private _userClaims;

    mapping(string => OracleRequestData) private _oracleRequests;

    // ==========================================
    // Events
    // ==========================================
    event UserRegistered(address indexed user, uint32 role);
    event PolicyCreated(uint256 indexed policyId, string title, address indexed creator);
    event PolicyPurchased(uint256 indexed policyId, address indexed buyer, uint256 paymentAmount, string tokenId, uint256 escrowId);
    event ClaimSubmitted(uint256 indexed claimId, uint256 indexed policyId, address indexed user, uint32 aggregateScore, uint32 status);
    event ClaimApproved(uint256 indexed claimId, address indexed user, uint256 claimAmount);
    event ClaimRejected(uint256 indexed claimId, address indexed admin);
    event OracleRequestStored(string requestId, uint256 claimId);
    event OracleStatusUpdated(string requestId, uint32 status);
    event ContractInitialized(address indexed admin);

    // ==========================================
    // Modifiers
    // ==========================================
    modifier onlyAdmin() {
        require(_isAdmin(msg.sender), "Not admin");
        _;
    }

    modifier onlyInitialized() {
        require(initialized, "Contract not initialized");
        _;
    }

    // ==========================================
    // Constructor / Initialization
    // ==========================================
    constructor() {}

    function initialize(address _admin) external {
        require(!initialized, "Already initialized");
        require(_admin != address(0), "Invalid admin address");

        admin = _admin;
        initialized = true;
        policyCounter = 0;
        tokenCounter = 0;
        escrowCounter = 0;
        claimCounter = 0;
        treasury = 0;

        _users[_admin] = User({
            wallet: _admin,
            role: ROLE_ADMIN,
            registered: true,
            name: "Contract Admin",
            location: "",
            contact: "",
            registeredAt: block.timestamp
        });

        adminList.push(_admin);
        emit ContractInitialized(_admin);
        emit UserRegistered(_admin, ROLE_ADMIN);
    }

    // ==========================================
    // User Management
    // ==========================================

    function registerUser(address _user, uint32 _role) external onlyInitialized {
        require(_user == msg.sender, "Can only register self");
        require(_role == ROLE_POLICYHOLDER || _role == ROLE_ADMIN, "Invalid role");
        require(!_users[_user].registered, "Already registered");

        _users[_user] = User({
            wallet: _user,
            role: _role,
            registered: true,
            name: "",
            location: "",
            contact: "",
            registeredAt: block.timestamp
        });

        if (_role == ROLE_ADMIN) {
            adminList.push(_user);
        }

        emit UserRegistered(_user, _role);
    }

    function getUserRole(address _userAddress) external view returns (uint32) {
        if (_users[_userAddress].registered) {
            return _users[_userAddress].role;
        }
        return ROLE_UNREGISTERED;
    }

    function _isAdmin(address _user) internal view returns (bool) {
        if (_user == admin) return true;
        return _users[_user].registered && _users[_user].role == ROLE_ADMIN;
    }

    function checkAdminStatus(address _user) external view returns (bool) {
        return _isAdmin(_user);
    }

    function getUserInfo(address _userAddress) external view returns (User memory) {
        return _users[_userAddress];
    }

    // ==========================================
    // Policy Management
    // ==========================================

    function createPolicy(PolicyParams calldata params) external onlyInitialized onlyAdmin returns (uint256) {
        policyCounter++;

        _policies[policyCounter] = Policy({
            policyId: policyCounter,
            title: params.title,
            description: params.description,
            policyType: params.policyType,
            monthlyPremium: params.monthlyPremium,
            yearlyPremium: params.yearlyPremium,
            coverageAmount: params.coverageAmount,
            minAge: params.minAge,
            maxAge: params.maxAge,
            durationDays: params.durationDays,
            waitingPeriodDays: params.waitingPeriodDays,
            createdAt: block.timestamp,
            createdBy: msg.sender
        });

        emit PolicyCreated(policyCounter, params.title, msg.sender);
        return policyCounter;
    }

    function getAllPolicies() external view returns (Policy[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= policyCounter; i++) {
            if (_policies[i].policyId != 0) count++;
        }

        Policy[] memory result = new Policy[](count);
        uint256 idx = 0;
        for (uint256 i = 1; i <= policyCounter; i++) {
            if (_policies[i].policyId != 0) {
                result[idx] = _policies[i];
                idx++;
            }
        }
        return result;
    }

    function getPolicy(uint256 _policyId) external view returns (Policy memory) {
        require(_policies[_policyId].policyId != 0, "Policy not found");
        return _policies[_policyId];
    }

    // ==========================================
    // Policy Purchase
    // ==========================================

    function purchasePolicy(PurchaseParams calldata params) external payable onlyInitialized {
        require(_users[msg.sender].registered, "User not registered");
        require(_users[msg.sender].role == ROLE_POLICYHOLDER, "Not policyholder");

        Policy storage policy = _policies[params.policyId];
        require(policy.policyId != 0, "Policy not found");
        require(msg.value >= policy.monthlyPremium, "Insufficient payment");

        treasury += msg.value;

        // Create escrow
        escrowCounter++;
        _escrows[escrowCounter] = PaymentEscrow({
            userAddress: msg.sender,
            policyId: params.policyId,
            monthlyPremiumWei: msg.value,
            nextPaymentDue: block.timestamp + ESCROW_DURATION_SECONDS,
            paymentsMade: 1,
            totalPaymentsRequired: policy.durationDays / 30,
            escrowBalance: 0,
            active: true
        });
        _userEscrows[msg.sender].push(escrowCounter);

        // Generate token
        tokenCounter++;
        uint256 tId = tokenCounter;

        uint256 expiryTime = block.timestamp + (policy.durationDays * 1 days);

        // Store NFT metadata
        _nftMetadata[tId] = PolicyNFTMetadata({
            name: "TrustLynk Insurance Policy",
            description: policy.description,
            imageUri: params.metadataUri,
            coverageAmount: policy.coverageAmount,
            validityStart: block.timestamp,
            validityEnd: expiryTime,
            premiumAmount: policy.yearlyPremium,
            policyType: policy.policyType,
            holderName: params.holderName,
            holderAge: params.holderAge,
            holderGender: params.holderGender,
            holderBloodGroup: params.holderBloodGroup
        });

        // Create user policy
        UserPolicy memory up = UserPolicy({
            policyId: params.policyId,
            userAddress: msg.sender,
            purchaseDate: block.timestamp,
            expiryDate: expiryTime,
            premiumPaidWei: msg.value,
            monthlyPremiumWei: msg.value,
            active: true,
            tokenId: tId,
            metadataUri: params.metadataUri,
            escrowId: escrowCounter,
            holderName: params.holderName,
            holderAge: params.holderAge,
            holderGender: params.holderGender,
            holderBloodGroup: params.holderBloodGroup
        });

        _userPolicies[msg.sender].push(up);
        
        // ERC721 Minting logic
        _tokenOwners[tId] = msg.sender;
        _balances[msg.sender]++;

        _policyTokens[params.policyId].push(tId);
        _userTokens[msg.sender].push(tId);

        emit PolicyPurchased(params.policyId, msg.sender, msg.value, _uint2str(tId), escrowCounter);
    }

    function getMyPolicies(address _userAddress) external view returns (UserPolicy[] memory) {
        require(_users[_userAddress].registered, "User not registered");
        return _userPolicies[_userAddress];
    }

    // ==========================================
    // Claims Management
    // ==========================================

    function claimPolicy(ClaimParams calldata params) external onlyInitialized {
        require(_users[msg.sender].registered, "User not registered");
        require(_users[msg.sender].role == ROLE_POLICYHOLDER, "Not policyholder");

        Policy storage policy = _policies[params.policyId];
        require(policy.policyId != 0, "Policy not found");

        // Check if user has active policy
        bool hasPolicy = false;
        UserPolicy[] storage ups = _userPolicies[msg.sender];
        for (uint256 i = 0; i < ups.length; i++) {
            if (ups[i].policyId == params.policyId && ups[i].active) {
                hasPolicy = true;
                break;
            }
        }
        require(hasPolicy, "User does not have this active policy");

        claimCounter++;

        uint32 status;
        if (params.aggregateScore <= 30) {
            status = CLAIM_STATUS_APPROVED;
        } else if (params.aggregateScore <= 70) {
            status = CLAIM_STATUS_PENDING;
        } else {
            status = CLAIM_STATUS_REJECTED;
        }

        _claims[claimCounter] = PolicyClaim({
            claimId: claimCounter,
            policyId: params.policyId,
            userAddress: msg.sender,
            claimAmount: policy.coverageAmount,
            aggregateScore: params.aggregateScore,
            status: status,
            claimedAt: block.timestamp,
            processedAt: block.timestamp,
            abhaId: params.abhaId,
            ipfsCid: params.ipfsCid,
            oracleRequestId: params.oracleRequestId,
            claimDescription: params.claimDescription,
            hospitalName: params.hospitalName
        });

        _userClaims[msg.sender].push(claimCounter);

        if (status == CLAIM_STATUS_APPROVED) {
            require(address(this).balance >= policy.coverageAmount, "Insufficient contract balance");
            (bool sent, ) = payable(msg.sender).call{value: policy.coverageAmount}("");
            require(sent, "ETH transfer failed");
        }

        emit ClaimSubmitted(claimCounter, params.policyId, msg.sender, params.aggregateScore, status);
    }

    function approveClaim(uint256 _claimId) external onlyInitialized onlyAdmin {
        PolicyClaim storage claim = _claims[_claimId];
        require(claim.claimId != 0, "Claim not found");
        require(claim.status == CLAIM_STATUS_PENDING, "Claim not pending");

        claim.status = CLAIM_STATUS_APPROVED;
        claim.processedAt = block.timestamp;

        require(address(this).balance >= claim.claimAmount, "Insufficient contract balance");
        (bool sent, ) = payable(claim.userAddress).call{value: claim.claimAmount}("");
        require(sent, "ETH transfer failed");

        emit ClaimApproved(_claimId, claim.userAddress, claim.claimAmount);
    }

    function rejectClaim(uint256 _claimId) external onlyInitialized onlyAdmin {
        PolicyClaim storage claim = _claims[_claimId];
        require(claim.claimId != 0, "Claim not found");
        require(claim.status == CLAIM_STATUS_PENDING, "Claim not pending");

        claim.status = CLAIM_STATUS_REJECTED;
        claim.processedAt = block.timestamp;

        emit ClaimRejected(_claimId, msg.sender);
    }

    // ==========================================
    // Oracle/DON Integration
    // ==========================================

    function storeOracleRequest(string calldata _requestId, uint256 _claimId, string calldata _abhaId, string calldata _ipfsCid) external onlyInitialized {
        _oracleRequests[_requestId] = OracleRequestData({
            requestId: _requestId,
            claimId: _claimId,
            abhaId: _abhaId,
            ipfsCid: _ipfsCid,
            requestedAt: block.timestamp,
            status: 0
        });
        emit OracleRequestStored(_requestId, _claimId);
    }

    function updateOracleRequestStatus(string calldata _requestId, uint32 _status) external onlyInitialized {
        OracleRequestData storage req = _oracleRequests[_requestId];
        require(req.requestedAt != 0, "Oracle request not found");
        req.status = _status;
        emit OracleStatusUpdated(_requestId, _status);
    }

    // ==========================================
    // View Functions
    // ==========================================

    function isInitialized() external view returns (bool) {
        return initialized;
    }

    function getClaimStatus(uint256 _claimId) external view returns (uint32, uint256, uint32) {
        PolicyClaim storage claim = _claims[_claimId];
        require(claim.claimId != 0, "Claim not found");
        return (claim.status, claim.claimAmount, claim.aggregateScore);
    }

    function getClaimDetails(uint256 _claimId) external view returns (PolicyClaim memory) {
        require(_claims[_claimId].claimId != 0, "Claim not found");
        return _claims[_claimId];
    }

    function getAllClaims() external view returns (PolicyClaim[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= claimCounter; i++) {
            if (_claims[i].claimId != 0) count++;
        }

        PolicyClaim[] memory result = new PolicyClaim[](count);
        uint256 idx = 0;
        for (uint256 i = 1; i <= claimCounter; i++) {
            if (_claims[i].claimId != 0) {
                result[idx] = _claims[i];
                idx++;
            }
        }
        return result;
    }

    function getUserClaims(address _userAddress) external view returns (PolicyClaim[] memory) {
        uint256[] storage claimIds = _userClaims[_userAddress];
        PolicyClaim[] memory result = new PolicyClaim[](claimIds.length);
        for (uint256 i = 0; i < claimIds.length; i++) {
            result[i] = _claims[claimIds[i]];
        }
        return result;
    }

    function getUserTokensList(address _userAddress) external view returns (uint256[] memory) {
        return _userTokens[_userAddress];
    }

    function getPolicyTokensList(uint256 _policyId) external view returns (uint256[] memory) {
        return _policyTokens[_policyId];
    }

    function getTotalTokens() external view returns (uint256) {
        return tokenCounter;
    }

    function getTreasury() external view returns (uint256) {
        return treasury;
    }

    function getNFTMetadata(uint256 _tokenId) external view returns (PolicyNFTMetadata memory) {
        require(_tokenOwners[_tokenId] != address(0), "Token does not exist");
        return _nftMetadata[_tokenId];
    }

    // ==========================================
    // ERC721 Interface Functions
    // ==========================================

    function name() external pure returns (string memory) {
        return "TrustLynk Insurance Policy";
    }

    function symbol() external pure returns (string memory) {
        return "TLINS";
    }

    function balanceOf(address _owner) external view returns (uint256) {
        require(_owner != address(0), "Zero address");
        return _balances[_owner];
    }

    function ownerOf(uint256 _tokenId) external view returns (address) {
        address owner = _tokenOwners[_tokenId];
        require(owner != address(0), "Token does not exist");
        return owner;
    }

    function tokenURI(uint256 _tokenId) external view returns (string memory) {
        require(_tokenOwners[_tokenId] != address(0), "Token does not exist");
        
        // Find metadataUri from user policies
        address owner = _tokenOwners[_tokenId];
        UserPolicy[] storage policies = _userPolicies[owner];
        for(uint i = 0; i < policies.length; i++) {
            if (policies[i].tokenId == _tokenId) {
                return policies[i].metadataUri;
            }
        }
        return "";
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == 0x80ac58cd // IERC721
            || interfaceId == 0x5b5e139f // IERC721Metadata
            || interfaceId == 0x01ffc9a7; // ERC165
    }

    function getOracleRequest(string calldata _requestId) external view returns (OracleRequestData memory) {
        return _oracleRequests[_requestId];
    }

    function verifyIpfsCidInClaim(string calldata _ipfsCid) external view returns (bool) {
        bytes32 target = keccak256(bytes(_ipfsCid));
        for (uint256 i = 1; i <= claimCounter; i++) {
            if (_claims[i].claimId != 0 && keccak256(bytes(_claims[i].ipfsCid)) == target) {
                return true;
            }
        }
        return false;
    }

    function getClaimsByAbhaId(string calldata _abhaId) external view returns (PolicyClaim[] memory) {
        bytes32 target = keccak256(bytes(_abhaId));
        uint256 count = 0;
        for (uint256 i = 1; i <= claimCounter; i++) {
            if (_claims[i].claimId != 0 && keccak256(bytes(_claims[i].abhaId)) == target) {
                count++;
            }
        }

        PolicyClaim[] memory result = new PolicyClaim[](count);
        uint256 idx = 0;
        for (uint256 i = 1; i <= claimCounter; i++) {
            if (_claims[i].claimId != 0 && keccak256(bytes(_claims[i].abhaId)) == target) {
                result[idx] = _claims[i];
                idx++;
            }
        }
        return result;
    }

    // ==========================================
    // Utility Functions
    // ==========================================

    function _uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) return "0";
        uint256 j = _i;
        uint256 length;
        while (j != 0) { length++; j /= 10; }
        bytes memory bstr = new bytes(length);
        uint256 k = length;
        while (_i != 0) {
            k = k - 1;
            bstr[k] = bytes1(uint8(48 + _i % 10));
            _i /= 10;
        }
        return string(bstr);
    }

    receive() external payable {
        treasury += msg.value;
    }

    fallback() external payable {
        treasury += msg.value;
    }
}

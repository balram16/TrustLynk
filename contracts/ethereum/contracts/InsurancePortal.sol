// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";

/**
 * @title InsurancePortal
 * @dev Decentralized insurance platform on Ethereum with Chainlink Functions integration
 */
contract InsurancePortal is FunctionsClient {
    using FunctionsRequest for FunctionsRequest.Request;
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
        address userAddress;
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

    // Chainlink Functions variables
    bytes32 public lastRequestId;
    bytes public lastResponse;
    bytes public lastError;
    uint64 public subscriptionId;
    bytes32 public donId;

    mapping(bytes32 => ClaimParams) private _pendingOracleClaims;

    mapping(address => User) private _users;
    address[] public adminList;

    mapping(uint256 => Policy) private _policies;
    mapping(address => UserPolicy[]) private _userPolicies;

    mapping(uint256 => UserPolicy[]) private _allUserPolicies; // Reference for numeric lookups
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
    event OCRRequestSent(bytes32 indexed requestId);
    event OCRResponseReceived(bytes32 indexed requestId, bytes response, bytes err);

    // ==========================================
    // Modifiers
    // ==========================================
    modifier onlyAdmin() {
        require(_isAdmin(msg.sender), "E1");
        _;
    }

    modifier onlyInitialized() {
        require(initialized, "E2");
        _;
    }

    // ==========================================
    // Constructor / Initialization
    // ==========================================
    constructor(address router, bytes32 _donId) FunctionsClient(router) {
        donId = _donId;
    }

    function initialize(address _admin, uint64 _subscriptionId) external {
        require(!initialized, "E3");
        require(_admin != address(0), "E4");

        admin = _admin;
        initialized = true;
        subscriptionId = _subscriptionId;
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

    function setSubscriptionId(uint64 _subscriptionId) external onlyAdmin {
        subscriptionId = _subscriptionId;
    }

    // ==========================================
    // User Management
    // ==========================================

    function registerUser(address _user, uint32 _role) external onlyInitialized {
        require(_user == msg.sender, "E5");
        require(_role == ROLE_POLICYHOLDER || _role == ROLE_ADMIN, "E6");
        require(!_users[_user].registered, "E7");

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


    function getPolicy(uint256 _policyId) external view returns (Policy memory) {
        require(_policies[_policyId].policyId != 0, "E8");
        return _policies[_policyId];
    }

    // ==========================================
    // Policy Purchase
    // ==========================================

    function purchasePolicy(PurchaseParams calldata params) external payable onlyInitialized {
        require(_users[msg.sender].registered, "E9");
        require(_users[msg.sender].role == ROLE_POLICYHOLDER, "E10");

        Policy storage policy = _policies[params.policyId];
        require(policy.policyId != 0, "E11");
        require(msg.value >= policy.monthlyPremium, "E12");

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

    function getUserPolicies(address _userAddress) external view returns (UserPolicy[] memory) {
        return _userPolicies[_userAddress];
    }

    // ==========================================
    // Claims Management
    // ==========================================

    function claimPolicy(ClaimParams calldata params) external onlyInitialized {
        require(_users[msg.sender].registered, "E14");
        require(_users[msg.sender].role == ROLE_POLICYHOLDER, "E15");

        Policy storage policy = _policies[params.policyId];
        require(policy.policyId != 0, "E16");

        // Check if user has active policy
        bool hasPolicy = false;
        UserPolicy[] storage ups = _userPolicies[msg.sender];
        for (uint256 i = 0; i < ups.length; i++) {
            if (ups[i].policyId == params.policyId && ups[i].active) {
                hasPolicy = true;
                break;
            }
        }
        require(hasPolicy, "E17");

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
            require(address(this).balance >= policy.coverageAmount, "E18");
            (bool sent, ) = payable(msg.sender).call{value: policy.coverageAmount}("");
            require(sent, "E19");
        }

        emit ClaimSubmitted(claimCounter, params.policyId, msg.sender, params.aggregateScore, status);
    }

    function approveClaim(uint256 _claimId) external onlyInitialized onlyAdmin {
        PolicyClaim storage claim = _claims[_claimId];
        require(claim.claimId != 0, "E20");
        require(claim.status == CLAIM_STATUS_PENDING, "E21");

        claim.status = CLAIM_STATUS_APPROVED;
        claim.processedAt = block.timestamp;

        require(address(this).balance >= claim.claimAmount, "E22");
        (bool sent, ) = payable(claim.userAddress).call{value: claim.claimAmount}("");
        require(sent, "E23");

        emit ClaimApproved(_claimId, claim.userAddress, claim.claimAmount);
    }

    function rejectClaim(uint256 _claimId) external onlyInitialized onlyAdmin {
        PolicyClaim storage claim = _claims[_claimId];
        require(claim.claimId != 0, "E24");
        require(claim.status == CLAIM_STATUS_PENDING, "E25");

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
        require(req.requestedAt != 0, "E26");
        req.status = _status;
        emit OracleStatusUpdated(_requestId, _status);
    }

     /**
     * @notice Sends a request to the Chainlink DON
     * @param source JavaScript source code
     * @param encryptedSecretsReference Encrypted secrets reference
     * @param donHostedSecretsSlotID Don hosted secrets slot ID
     * @param donHostedSecretsVersion Don hosted secrets version
     * @param args Arguments for the script
     * @param callbackGasLimit Gas limit for the callback
     * @param claimParams The claim data to process after fulfillment
     */
    function sendOCRRequest(
        string calldata source,
        bytes calldata encryptedSecretsReference,
        uint8 donHostedSecretsSlotID,
        uint64 donHostedSecretsVersion,
        string[] calldata args,
        uint32 callbackGasLimit,
        ClaimParams calldata claimParams
    ) external onlyInitialized returns (bytes32 requestId) {
        require(_users[msg.sender].registered, "E14");
        require(msg.sender == claimParams.userAddress, "Unauthorized");

        bool hasPolicy = false;
        UserPolicy[] storage ups = _userPolicies[msg.sender];
        for (uint256 i = 0; i < ups.length; i++) {
            if (ups[i].policyId == claimParams.policyId && ups[i].active) {
                hasPolicy = true;
                break;
            }
        }
        require(hasPolicy, "E17");

        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(source);
        if (encryptedSecretsReference.length > 0) req.addSecretsReference(encryptedSecretsReference);
        if (donHostedSecretsVersion > 0) req.addDONHostedSecrets(donHostedSecretsSlotID, donHostedSecretsVersion);
        if (args.length > 0) req.setArgs(args);
        
        requestId = _sendRequest(req.encodeCBOR(), subscriptionId, callbackGasLimit, donId);
        _pendingOracleClaims[requestId] = claimParams;
        lastRequestId = requestId;
        
        emit OCRRequestSent(requestId);
    }

    /**
     * @notice Callback that DON calls
     */
    function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) internal override {
        lastResponse = response;
        lastError = err;
        
        if (err.length == 0 && response.length > 0) {
            // Success: Finalize the claim with the score returned from DON
            ClaimParams memory params = _pendingOracleClaims[requestId];
            if (params.policyId != 0) {
                // Read score from response (assuming first 32 bytes is uint256 score)
                uint256 score = abi.decode(response, (uint256));
                params.aggregateScore = uint32(score);
                _finalizeClaim(params);
            }
        }
        
        emit OCRResponseReceived(requestId, response, err);
    }

    function _finalizeClaim(ClaimParams memory params) internal {
        Policy storage policy = _policies[params.policyId];
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
            userAddress: params.userAddress, // Ensure userAddress is added to ClaimParams struct
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

        _userClaims[params.userAddress].push(claimCounter);
        
        if (status == CLAIM_STATUS_APPROVED) {
            if (treasury >= policy.coverageAmount) {
                treasury -= policy.coverageAmount;
                (bool sent, ) = payable(params.userAddress).call{value: policy.coverageAmount}("");
                require(sent, "E27");
                emit ClaimApproved(claimCounter, params.userAddress, policy.coverageAmount);
            }
        } else {
            emit ClaimSubmitted(claimCounter, params.policyId, params.userAddress, params.aggregateScore, status);
        }
    }

    // ==========================================
    // View Functions
    // ==========================================

    function isInitialized() external view returns (bool) {
        return initialized;
    }

    function getClaimStatus(uint256 _claimId) external view returns (uint32, uint256, uint32) {
        PolicyClaim storage claim = _claims[_claimId];
        require(claim.claimId != 0, "E28");
        return (claim.status, claim.claimAmount, claim.aggregateScore);
    }

    function getClaimDetails(uint256 _claimId) external view returns (PolicyClaim memory) {
        require(_claims[_claimId].claimId != 0, "E29");
        return _claims[_claimId];
    }

    function getUserClaimIds(address _userAddress) external view returns (uint256[] memory) {
        return _userClaims[_userAddress];
    }





    function getTotalTokens() external view returns (uint256) {
        return tokenCounter;
    }

    function getTreasury() external view returns (uint256) {
        return treasury;
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
        require(_owner != address(0), "E31");
        return _balances[_owner];
    }

    function ownerOf(uint256 _tokenId) external view returns (address) {
        address owner = _tokenOwners[_tokenId];
        require(owner != address(0), "E32");
        return owner;
    }

    function tokenURI(uint256 _tokenId) external view returns (string memory) {
        require(_tokenOwners[_tokenId] != address(0), "E33");
        
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

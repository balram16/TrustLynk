// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./InsurancePortal.sol";

/**
 * @title InsuranceViews
 * @dev Helper contract to fetch and aggregate data from InsurancePortal
 * Created to reduce the bytecode size of the main InsurancePortal contract
 */
contract InsuranceViews {
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

    InsurancePortal public portal;

    constructor(address _portalAddress) {
        portal = InsurancePortal(payable(_portalAddress));
    }

    function getAllPolicies() external view returns (InsurancePortal.Policy[] memory) {
        uint256 counter = portal.policyCounter();
        uint256 count = 0;
        for (uint256 i = 1; i <= counter; i++) {
            if (portal.getPolicy(i).policyId != 0) count++;
        }

        InsurancePortal.Policy[] memory result = new InsurancePortal.Policy[](count);
        uint256 idx = 0;
        for (uint256 i = 1; i <= counter; i++) {
            InsurancePortal.Policy memory p = portal.getPolicy(i);
            if (p.policyId != 0) {
                result[idx] = p;
                idx++;
            }
        }
        return result;
    }

    function getMyPolicies(address _userAddress) external view returns (InsurancePortal.UserPolicy[] memory) {
        return portal.getUserPolicies(_userAddress);
    }

    function getAllClaims() external view returns (InsurancePortal.PolicyClaim[] memory) {
        uint256 counter = portal.claimCounter();
        uint256 count = 0;
        for (uint256 i = 1; i <= counter; i++) {
            if (portal.getClaimDetails(i).claimId != 0) count++;
        }

        InsurancePortal.PolicyClaim[] memory result = new InsurancePortal.PolicyClaim[](count);
        uint256 idx = 0;
        for (uint256 i = 1; i <= counter; i++) {
            InsurancePortal.PolicyClaim memory claim = portal.getClaimDetails(i);
            if (claim.claimId != 0) {
                result[idx] = claim;
                idx++;
            }
        }
        return result;
    }

    function getUserClaims(address _userAddress) external view returns (InsurancePortal.PolicyClaim[] memory) {
        uint256[] memory claimIds = portal.getUserClaimIds(_userAddress);
        InsurancePortal.PolicyClaim[] memory result = new InsurancePortal.PolicyClaim[](claimIds.length);
        for (uint256 i = 0; i < claimIds.length; i++) {
            result[i] = portal.getClaimDetails(claimIds[i]);
        }
        return result;
    }

    function getClaimsByAbhaId(string calldata _abhaId) external view returns (InsurancePortal.PolicyClaim[] memory) {
        bytes32 target = keccak256(bytes(_abhaId));
        uint256 counter = portal.claimCounter();
        uint256 count = 0;

        for (uint256 i = 1; i <= counter; i++) {
            InsurancePortal.PolicyClaim memory claim = portal.getClaimDetails(i);
            if (claim.claimId != 0 && keccak256(bytes(claim.abhaId)) == target) {
                count++;
            }
        }

        InsurancePortal.PolicyClaim[] memory result = new InsurancePortal.PolicyClaim[](count);
        uint256 idx = 0;
        for (uint256 i = 1; i <= counter; i++) {
            InsurancePortal.PolicyClaim memory claim = portal.getClaimDetails(i);
            if (claim.claimId != 0 && keccak256(bytes(claim.abhaId)) == target) {
                result[idx] = claim;
                idx++;
            }
        }
        return result;
    }

    function verifyIpfsCidInClaim(string calldata _ipfsCid) external view returns (bool) {
        bytes32 target = keccak256(bytes(_ipfsCid));
        uint256 counter = portal.claimCounter();
        for (uint256 i = 1; i <= counter; i++) {
            InsurancePortal.PolicyClaim memory claim = portal.getClaimDetails(i);
            if (claim.claimId != 0 && keccak256(bytes(claim.ipfsCid)) == target) {
                return true;
            }
        }
        return false;
    }

    function getNFTMetadata(uint256 _tokenId) external view returns (PolicyNFTMetadata memory) {
        address owner = portal.ownerOf(_tokenId);
        require(owner != address(0), "Non-existent token");
        
        InsurancePortal.UserPolicy[] memory policies = portal.getUserPolicies(owner);
        InsurancePortal.UserPolicy memory activePolicy;
        bool found = false;
        
        for (uint i = 0; i < policies.length; i++) {
            if (policies[i].tokenId == _tokenId) {
                activePolicy = policies[i];
                found = true;
                break;
            }
        }
        require(found, "Policy not found for token");
        
        InsurancePortal.Policy memory policyDef = portal.getPolicy(activePolicy.policyId);
        
        return PolicyNFTMetadata({
            name: "TrustLynk Insurance Policy",
            description: policyDef.description,
            imageUri: activePolicy.metadataUri,
            coverageAmount: policyDef.coverageAmount,
            validityStart: activePolicy.purchaseDate,
            validityEnd: activePolicy.expiryDate,
            premiumAmount: policyDef.yearlyPremium,
            policyType: policyDef.policyType,
            holderName: activePolicy.holderName,
            holderAge: activePolicy.holderAge,
            holderGender: activePolicy.holderGender,
            holderBloodGroup: activePolicy.holderBloodGroup
        });
    }
}

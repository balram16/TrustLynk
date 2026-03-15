// This source code is executed by the Chainlink DON nodes.
// It fetches the claim analysis from our Python API.

const abhaId = args[0];
const ipfsHash = args[1];
const apiUrl = args[2]; // e.g. https://your-ngrok-url.ngrok-free.app/verify-claim/

// Make the HTTP request to our Python API
const apiRequest = Functions.makeHttpRequest({
  url: apiUrl,
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true"
  },
  data: {
    ipfs_hash: ipfsHash,
    abha_identifier: abhaId,
  },
  timeout: 10000,
});

// Execute the request
const apiResponse = await apiRequest;

if (apiResponse.error) {
  console.error(apiResponse.error);
  throw Error("API Request failed");
}

const data = apiResponse.data;
console.log("API Response:", data);

// The aggregate_score is what the smart contract expects back.
// We encode it as a uint256 (32 bytes).
const score = data.aggregate_score;

return Functions.encodeUint256(Math.round(score));

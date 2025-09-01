import { ethers } from 'ethers';
import { createHash } from 'crypto';

async function verifySignature(message, signature, expectedAddress) {

    try {
        // Recover address from the signature
        const recoveredAddress = ethers.verifyMessage(message, signature);
        
        // Compare with expected address (case-insensitive)
        const isValid = recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
        
        console.log("\n\nSIGNATURE VERIFICATION RESULTS")
        console.log('--------------------------------')
        console.log("Expected address:", expectedAddress);
        console.log("Recovered address:", recoveredAddress);
        console.log("Signature valid:", isValid);
        console.log('--------------------------------')
        
        return isValid;
    } catch (error) {
        console.error("Error verifying signature:", error);

        return false;
    }
}

function sha256sum(data) {
    return createHash('sha256').update(data, 'utf8').digest('hex');
}

/**
 * Validate input/output hashes against signature text
 * @param {string} signatureText - The signature text containing "requestHash:responseHash"
 * @param {string} expectedRequestHash - The expected request hash
 * @param {string} expectedResponseHash - The expected response hash
 * @returns {Object} Validation result with details
 */
function validateHashes(signatureText, expectedRequestHash, expectedResponseHash) {
  try {
    // Split signature text by colon separator
    const hashParts = signatureText.split(':');
    
    if (hashParts.length !== 2) {
      return {
        valid: false,
        error: `Expected 2 hash parts separated by ':', got ${hashParts.length}`,
        signatureText,
        expectedRequestHash,
        expectedResponseHash
      };
    }

    const [signedRequestHash, signedResponseHash] = hashParts;

    // Validate both hashes
    const requestHashMatch = signedRequestHash === expectedRequestHash;
    const responseHashMatch = signedResponseHash === expectedResponseHash;
    const bothValid = requestHashMatch && responseHashMatch;

    console.log('\n REQUEST/RESPONSE HASH VALIDATION');
    console.log('------------------------');
    console.log(`   Request Hash Match:  ${requestHashMatch ? '✅ VALID' : '❌ INVALID'}`);
    console.log(`   Signed:    ${signedRequestHash}`);
    console.log(`   Expected:  ${expectedRequestHash}`);
    console.log(`   Response Hash Match: ${responseHashMatch ? '✅ VALID' : '❌ INVALID'}`);
    console.log(`   Signed:    ${signedResponseHash}`);
    console.log(`   Expected:  ${expectedResponseHash}`);
    console.log(`   Overall Result:      ${bothValid ? '✅ HASHES VALID' : '❌ HASHES INVALID'}`);
    console.log('------------------------\n');

    return {
      valid: bothValid,
      requestHashMatch,
      responseHashMatch,
      signedRequestHash,
      signedResponseHash,
      expectedRequestHash,
      expectedResponseHash,
      signatureText
    };

  } catch (error) {
    return {
      valid: false,
      error: `Error validating hashes: ${error.message}`,
      signatureText,
      expectedRequestHash,
      expectedResponseHash
    };
  }
}
export { validateHashes, verifySignature, sha256sum };
import { ethers } from 'ethers';
import { createHash } from 'crypto';

async function verifySignature(message, signature, expectedAddress) {

    try {
        // Recover address from the signature
        const recoveredAddress = ethers.verifyMessage(message, signature);
        
        // Compare with expected address (case-insensitive)
        const isValid = recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
        
        console.log("Text:", message);
        console.log("Expected address:", expectedAddress);
        console.log("Recovered address:", recoveredAddress);
        console.log("Signature valid:", isValid);
        
        return isValid;
    } catch (error) {
        console.error("Error verifying signature:", error);

        return false;
    }
}

function sha256sum(data) {
    return createHash('sha256').update(data, 'utf8').digest('hex');
}

export { verifySignature, sha256sum };
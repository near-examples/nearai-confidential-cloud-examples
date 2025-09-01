import { ethers } from 'ethers';

async function verifySignature(text, signature, expectedAddress) {
    const text = "65b0adb47d0450971803dfb18d0ce4af4a64d27420a43d5aad4066ebf10b81b5:e508d818744d175a62aae1a9fb3f373c075460cbe50bf962a88ac008c843dff1";
    const signature = "0xf28f537325c337fd96ae6e156783c904ca708dcd38fb8a476d1280dfc72dc88e4fcb5c3941bdd4f8fe5238a2253b975c6b02ea6a0a450b5b0f9296ab54cf24181b";
    const expectedAddress = "0xc51268C9b46140619CBC066A34441a6ca51F85f9";

    try {
        // Recover the address from the signature
        const recoveredAddress = ethers.verifyMessage(text, signature);
        
        // Compare with expected address (case-insensitive)
        const isValid = recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
        
        console.log("Text:", text);
        console.log("Expected address:", expectedAddress);
        console.log("Recovered address:", recoveredAddress);
        console.log("Signature valid:", isValid);
        
        return isValid;
    } catch (error) {
        console.error("Error verifying signature:", error);

        return false;
    }
}

verifySignature(text, signature, expectedAddress);
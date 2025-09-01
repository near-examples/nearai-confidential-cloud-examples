#!/usr/bin/env node
import dotenv from "dotenv";
import { sendChatMessageRequest, getChatMessageSignature } from './near-ai-cloud-api.js';
import { sha256sum, validateHashes, verifySignature } from './signature-utils.js';

dotenv.config();

async function sendAndVerifyChatMessage(chatContent, modelId) {

const requestBody = JSON.stringify({
  "messages": [
    {
      "content": chatContent,
      "role": "user"
    }
  ],
  "stream": true,
  "model": modelId
});

try {
// Step 1: Send chat message request
const response = await sendChatMessageRequest(requestBody);

// Step 2: Hash request and response
const requestHash = sha256sum(requestBody);
const responseHash = sha256sum(response.responseText);

// Step 3: Get signature
const signature = await getChatMessageSignature(response.chatId, modelId);

// Step 4: Validate hashes returned by NEAR AI Confidential Cloud
validateHashes(signature.text, requestHash, responseHash);

// Step 5: Verify signature returned by NEAR AI Confidential Cloud
await verifySignature(signature.text, signature.signature, signature.signing_address);
} catch (error) {
  console.error("Error sending and verifying chat message:", error);
}
}
export { sendAndVerifyChatMessage };
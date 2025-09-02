#!/usr/bin/env node
import dotenv from "dotenv";
import { sendChatMessageRequest, getChatMessageSignature } from './api.js';
import { sha256sum, compareHashes, verifySignature } from './verification-helpers.js';

dotenv.config();

async function sendAndVerifyChatMessage(chatContent, modelId, expectedAddress) {
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
    const hashValidation = compareHashes(signature.text, requestHash, responseHash);

    // Step 5: Verify signature returned by NEAR AI Confidential Cloud
    const signatureValidation = await verifySignature(signature.text, signature.signature, expectedAddress);

    return {
      chatContent,
      modelId,
      requestBody,
      response,
      requestHash,
      responseHash,
      signature,
      hashValidation,
      signatureValidation
    };
  } catch (error) {
    throw new Error(`Error sending and verifying chat message: ${error.message}`);
  }
}
export { sendAndVerifyChatMessage };
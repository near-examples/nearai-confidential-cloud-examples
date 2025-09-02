#!/usr/bin/env node
import dotenv from "dotenv";

dotenv.config();

/**
 * Extract the ID from streaming chat completion response
 * @param {string} responseText - The streaming response text
 * @returns {string|null} The chat completion ID or null if not found
 */
function extractChatCompletionId(responseText) {
  try {
    const firstDataLine = responseText
      .split("\n")
      .find((line) => line.startsWith("data: {"));
    if (firstDataLine) {
      const json = JSON.parse(firstDataLine.substring(6));
      return json.id || null;
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Send a Chat Message Request to NEAR AI Confidential Cloud
 * @param {string} requestBody - The request body to send
 * @returns {Promise<{response: Response, id: string|null}>} The response and extracted ID
 */
async function sendChatMessageRequest(requestBody) {
  try {
    const response = await fetch(
      "https://cloud-api.near.ai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEARAI_CLOUD_API_KEY}`,
        },
        body: requestBody,
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Extract the chat ID from the response
    const responseText = await response.text();
    const chatId = extractChatCompletionId(responseText);

    return { response, responseText, chatId };
  } catch (error) {
    console.error("❌ Error calling NEAR AI:", error);
    throw error;
  }
}

/**
 * Get signature for a chat message from NEAR AI Confidential Cloud
 * @param {string} chatId - The chat completion ID
 * @param {string} modelId - The model ID
 * @returns {Promise<{response: Response, signature: Object}>} The response with signature data
 */
async function getChatMessageSignature(chatId, modelId) {
  try {
    const response = await fetch(
      `https://cloud-api.near.ai/v1/signature/${chatId}?model=${modelId}&signing_algo=ecdsa`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${process.env.NEARAI_CLOUD_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const signatureData = await response.json();
    return signatureData;
  } catch (error) {
    console.error("❌ Error getting chat message signature:", error);
    throw error;
  }
}

/**
 * Get model attestation report from NEAR AI Cloud
 * @param {string} modelName - Name of the model to get attestation for
 * @returns {Promise<Object>} Attestation report containing signing addresses and TEE proofs
 */
async function getModelAttestation(modelName) {
  const response = await fetch(
    `https://cloud-api.near.ai/v1/attestation/report?model=${modelName}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.NEARAI_CLOUD_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Attestation request failed: ${response.status} ${response.statusText}`
    );
  }

  return await response.json();
}

/**
 * Verify NVIDIA GPU attestation using NVIDIA's attestation service
 * @param {string} nvidiaPayload - The nvidia_payload from attestation report
 * @returns {Promise<Object>} Verification result from NVIDIA service with decoded tokens
 */
async function getGpuAttestation(nvidiaPayload) {
  const response = await fetch(
    "https://nras.attestation.nvidia.com/v3/attest/gpu",
    {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: nvidiaPayload,
    }
  );

  if (!response.ok) {
    throw new Error(`GPU attestation verification failed: ${response.status}`);
  }
  return await response.json();
}

export {
  sendChatMessageRequest,
  extractChatCompletionId,
  getChatMessageSignature,
  getModelAttestation,
  getGpuAttestation,
};

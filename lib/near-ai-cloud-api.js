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
    const firstDataLine = responseText.split('\n').find(line => line.startsWith('data: {'));
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

    // Read the response body to extract the ID
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
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const signatureData = await response.json();
    console.log('\n\nSIGNATURE DATA for ChatId:', chatId, 'and model:', modelId)
    console.log('--------------------------------')
    console.log('TEXT:', signatureData.text);
    console.log('SIGNING ADDRESS:', signatureData.signing_address);
    console.log('SIGNATURE:', signatureData.signature);
    console.log('--------------------------------')
    return signatureData;
  } catch (error) {
    console.error("❌ Error getting chat message signature:", error);
    throw error;
  }
} 


export { sendChatMessageRequest, extractChatCompletionId, getChatMessageSignature };


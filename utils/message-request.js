#!/usr/bin/env node
import dotenv from "dotenv";

dotenv.config();

/**
 * Send a Chat Message Request to NEAR AI Confidential Cloud
 * @param {string} requestBody - The request body to send
 * @returns {Promise<string>} The response body
 */
async function callNearAI(requestBody) {
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
    return response;
  } catch (error) {
    console.error("❌ Error calling NEAR AI:", error);
    throw error;
  }

}

export { callNearAI };

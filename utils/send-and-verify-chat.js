#!/usr/bin/env node
import { sendChatMessageRequest, getChatMessageSignature } from "./api.js";
import { sha256sum, compareHashes, verifySignature } from "./verification-helpers.js";

/**
 * Work out which key signed the response.
 * Newer signatures carry `signature_kind`; older ones can be inferred from the
 * shape of `text` (3 parts = model TEE, 2 parts = gateway).
 * @returns {"provider_tee"|"gateway"}
 */
function resolveSignatureKind(signature) {
  if (signature.signature_kind === "provider_tee" || signature.signature_kind === "gateway") {
    return signature.signature_kind;
  }
  return signature.text.split(":").length === 3 ? "provider_tee" : "gateway";
}

/**
 * Send a chat message and verify the returned hashes + signature.
 *
 * @param {string} chatContent - User message
 * @param {string} modelId - Model to query
 * @param {{modelTee: string[], gateway: string[]}|string[]} expectedAddresses
 *   Signing addresses from the attestation report. A plain array is treated as model TEE addresses.
 * @param {{stream?: boolean}} [options]
 *   stream: false -> response is signed inside the model TEE (`provider_tee`)
 *           true  -> the gateway rewrites stream bytes (usage accounting), so it signs
 *                    the exact bytes you receive with the gateway TEE key (`gateway`)
 */
async function sendAndVerifyChatMessage(chatContent, modelId, expectedAddresses, options = {}) {
  const { stream = false } = options;

  const addresses = Array.isArray(expectedAddresses)
    ? { modelTee: expectedAddresses, gateway: [] }
    : { modelTee: [], gateway: [], ...expectedAddresses };

  // The exact string sent over the wire is what gets hashed and signed
  const requestBody = JSON.stringify({
    messages: [{ content: chatContent, role: "user" }],
    stream,
    model: modelId,
  });

  try {
    // Step 1: Send chat message request
    const response = await sendChatMessageRequest(requestBody);
    if (!response.chatId) {
      throw new Error("Could not extract chat completion id from response");
    }

    // Step 2: Hash the exact request and response bytes
    const requestHash = sha256sum(requestBody);
    const responseHash = sha256sum(response.responseText);

    // Step 3: Fetch the signature for this chat id
    const signature = await getChatMessageSignature(response.chatId, modelId);
    const signatureKind = resolveSignatureKind(signature);

    // Step 4: Validate hashes (and model id, when the model TEE signed)
    const hashValidation = compareHashes(signature.text, requestHash, responseHash, modelId);

    // Step 5: Verify the signature against the key that is supposed to have signed
    const expectedForKind =
      signatureKind === "gateway" ? addresses.gateway : addresses.modelTee;
    const signatureValidation = await verifySignature(
      signature.text,
      signature.signature,
      expectedForKind
    );

    return {
      chatContent,
      modelId,
      stream,
      requestBody,
      response,
      requestHash,
      responseHash,
      signature,
      signatureKind,
      hashValidation,
      signatureValidation,
    };
  } catch (error) {
    throw new Error(`Error sending and verifying chat message: ${error.message}`);
  }
}

export { sendAndVerifyChatMessage, resolveSignatureKind };

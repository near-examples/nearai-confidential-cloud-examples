#!/usr/bin/env node
import {
  decodeNvidiaAttestation,
} from "./utils/model-attestation.js";
import { getModelAttestation, getGpuAttestation } from "./utils/api.js";
import { sendAndVerifyChatMessage } from "./utils/send-and-verify-chat.js";
import chalk from "chalk";

// You can change this to any model name you want to test
// See available models at: https://docs.near.ai/cloud/models
const MODEL_NAME = "deepseek-ai/DeepSeek-V3.1";
const CHAT_CONTENT = "Respond with only two words";
const log = console.log;

async function main() {
  try {
    log(chalk.bold("\n\n🚀 Starting NEAR AI Cloud Verification Demo"));
    log(`   API Key configured: ${process.env.NEARAI_CLOUD_API_KEY ? chalk.bold.green("Yes") : chalk.bold.red("No")}`);
    log("===============================================");
    log(chalk.dim("  - Get an attestation report from NEAR AI Confidential Cloud for model provided"));
    log(chalk.dim("  - Verify the attestation report w/ NVIDIA attestation service"));
    log(chalk.dim("  - Send a Chat Message Request to NEAR AI Confidential Cloud"))
    log(chalk.dim("  - Verify it executed in a secure environment\n\n"));

    // Step 1: Get model attestation
    log(chalk.bold("1) Getting NEAR AI Cloud attestation report:"));
    log("--------------------------------");
    log(`🌐 NEAR AI Cloud Endpoint: ${chalk.bold.blue(`https://cloud-api.near.ai/v1/attestation/report`)}`);
    const attestationReport = await getModelAttestation(MODEL_NAME);

    // Extract all signing addresses from model_attestations array
    const teeSigningAddresses = [];
    if (attestationReport.model_attestations && attestationReport.model_attestations.length > 0) {
      attestationReport.model_attestations.forEach(attestation => {
        if (attestation.signing_address && !teeSigningAddresses.includes(attestation.signing_address)) {
          teeSigningAddresses.push(attestation.signing_address);
        }
      });
    }

    log("   NEAR AI TEE SIGNING ADDRESSES:", chalk.yellow(teeSigningAddresses.join(', ')));
    log("   AI Model:", chalk.cyan(MODEL_NAME));

    // Step 2: Verify GPU attestation if NVIDIA payload(s) are present
    let nvidiaPayloads = [];
    if (attestationReport.model_attestations && attestationReport.model_attestations.length > 0) {
      // Find all attestations with nvidia_payload
      const attestationsWithNvidia = attestationReport.model_attestations.filter(
        attestation => attestation.nvidia_payload
      );
      nvidiaPayloads = attestationsWithNvidia.map(attestation => attestation.nvidia_payload);
    }

    if (nvidiaPayloads.length > 0) {
      log(chalk.bold("\n\n2) Verifying attestation report with NVIDIA:"));
      log("--------------------------------");
      log(
        `🌐 NVIDIA AttestationEndpoint: ${chalk.bold.blue("https://nras.attestation.nvidia.com/v3/attest/gpu")}`
      );
      log(`📊 Found ${nvidiaPayloads.length} NVIDIA payload(s) to verify \n`);

      const gpuVerifications = [];
      let allGpuVerificationsPassed = true;
      
      log("    🔍 Verifying NVIDIA payloads:")
      log("       --------------------------------");
      for (let i = 0; i < nvidiaPayloads.length; i++) {
        const gpuVerification = await getGpuAttestation(nvidiaPayloads[i]);
        gpuVerifications.push(gpuVerification);
        
        const decodedGpuVerification = decodeNvidiaAttestation(gpuVerification);
        const gpuAttestationOverallResult = decodedGpuVerification.JWT["x-nvidia-overall-att-result"];
        log(`       Payload ${i + 1}/${nvidiaPayloads.length}: `, gpuAttestationOverallResult ? '✅ Overall Attestation PASSED' : '❌ Overall Attestation FAILED');
        
        if (!gpuAttestationOverallResult) {
          allGpuVerificationsPassed = false;
        }
      }
      log("       --------------------------------");
      log(`       RESULT: ${gpuVerifications.length} NVIDIA payload(s) checked -> ${allGpuVerificationsPassed ? '✅ ALL PASSED' : '❌ SOME FAILED'}`);
    } else {
      log("\n⚠️  No NVIDIA payload found in attestation report");
      log("💡 This might mean:");
      log("   - The model is not running on NVIDIA hardware");
      log(
        "   - The attestation service is not configured for GPU verification"
      );
      log(
        "   - The model attestation doesn't include GPU-specific data"
      );
    }

    // Step 3: Send and verify chat message
    log(chalk.bold("\n\n3) Sending and verifying chat message..."));
    log("--------------------------------");
    log(`🌐 NEAR AI Cloud Endpoint: ${chalk.bold.blue("https://cloud-api.near.ai/v1/chat/completions")}`);
    log(`   TEE AI Model:     ${chalk.cyan(MODEL_NAME)}`);
    log(`   Chat Msg Sent:    ${chalk.cyan(CHAT_CONTENT)}`);

    const chatResult = await sendAndVerifyChatMessage(CHAT_CONTENT, MODEL_NAME, teeSigningAddresses);

    log(`   Returned Chat ID: ${chalk.cyan(chatResult.response.chatId)}`);
    log(`   TEE Addresses:    ${chalk.yellow(teeSigningAddresses.join(', '))}`);

    log(`\n   ${chalk.bold(" 🔎 Checking if hash values match:")}`);
    log("       --------------------------------");
    log(`     → REQUEST HASH ${chatResult.hashValidation.requestHashMatch ? '✅' : '❌'}`);
    log(`       Sent   (Expected):  ${chalk.yellow(chatResult.hashValidation.signedRequestHash)}`);
    log(`       Returned (Actual):  ${chalk.yellow(chatResult.requestHash)}`);
    log(`     ← RESPONSE HASH ${chatResult.hashValidation.responseHashMatch ? '✅' : '❌'}`);
    log(`       Signed (Expected):  ${chalk.yellow(chatResult.hashValidation.signedResponseHash)}`);
    log(`       Returned (Actual):  ${chalk.yellow(chatResult.responseHash)}`);
    log("       --------------------------------");
    log(`       RESULT: ${chatResult.hashValidation.valid ? '✅ HASHES VALID' : '❌ HASHES INVALID'}`);
            
    log(`\n    ${chalk.bold("🔑 Verifying signature returned by NEAR AI Cloud:")}`);
    log("       --------------------------------");
    log(`       Expected TEE Addresses: ${chalk.yellow(chatResult.signatureValidation.expectedAddresses.join(', '))}`);
    log(`       Recovered TEE Address:  ${chalk.yellow(chatResult.signatureValidation.recoveredAddress)}`);
    log("       --------------------------------");
    log(`       RESULT: ${chatResult.signatureValidation.valid ? '✅ SIGNATURE VERIFIED' : '❌ SIGNATURE INVALID'}`);


    log("\n✅  Verification Demo complete!");
  } catch (error) {
    console.error("\n❌ Error occurred:");
    console.error(`   ${error.message}`);
    console.error(`   Error type: ${error.constructor.name}`);

    if (
      error.message.includes("401") ||
      error.message.includes("Authorization")
    ) {
      console.error(
        "\n💡 Tip: Make sure your NEARAI_CLOUD_API_KEY is set in the .env file"
      );
    } else if (error.message.includes("fetch")) {
      console.error(
        "\n💡 Tip: Check your internet connection and API endpoints"
      );
    } else if (error.message.includes("404")) {
      console.error("\n💡 Tip: The model name might not exist or be available");
    }

    process.exit(1);
  }
}

main();

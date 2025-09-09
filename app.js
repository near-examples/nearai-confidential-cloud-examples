#!/usr/bin/env node
import {
  decodeNvidiaAttestation,
  decodeAttestationReport,
} from "./utils/model-attestation.js";
import { getModelAttestation, getGpuAttestation } from "./utils/api.js";
import { sendAndVerifyChatMessage } from "./utils/send-and-verify-chat.js";
import chalk from "chalk";

// You can change this to any model name you want to test
// See available models at: https://cloud.near.ai/
const MODEL_NAME = "gpt-oss-120b";
const CHAT_CONTENT = "Respond with only two words";
const log = console.log;

async function main() {
  try {
    // Demo Introduction
    log(chalk.bold("\n\n🚀 Starting NEAR AI Confidential Cloud Demo"));
    log(`   API Key configured: ${process.env.NEARAI_CLOUD_API_KEY ? chalk.green("Yes") : chalk.red("No")}`);
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
    const decodedAttestationReport = decodeAttestationReport(attestationReport);
    const teeSigningAddress = decodedAttestationReport.signing_address;
    log("   NEAR AI TEE SIGNING ADDRESS:", chalk.yellow(teeSigningAddress));
    log("   AI Model:", chalk.cyan(MODEL_NAME));

    // Step 2: Verify GPU attestation if NVIDIA payload is present
    if (attestationReport.nvidia_payload) {
      log(chalk.bold("\n\n2) Verifying attestation report with NVIDIA:"));
      log("--------------------------------");
      log(
        `🌐 NVIDIA AttestationEndpoint: ${chalk.bold.blue("https://nras.attestation.nvidia.com/v3/attest/gpu")}`
      );

      const gpuVerification = await getGpuAttestation(
        attestationReport.nvidia_payload
      );
      const decodedGpuVerification = decodeNvidiaAttestation(gpuVerification);
      const gpuAttestationOverallResult = decodedGpuVerification.JWT["x-nvidia-overall-att-result"];
      log('   RESULT:', gpuAttestationOverallResult ? '✅ Overall Attestation PASSED' : '❌ Overall Attestation FAILED');
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
    
    const chatResult = await sendAndVerifyChatMessage(CHAT_CONTENT, MODEL_NAME, teeSigningAddress);
    
    log(`   Returned Chat ID: ${chalk.cyan(chatResult.response.chatId)}`);
    log(`   TEE Address:      ${chalk.yellow(teeSigningAddress)}`);

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
    log(`       Expected TEE Address:  ${chalk.yellow(chatResult.signatureValidation.expectedAddress)}`);
    log(`       Recovered TEE Address: ${chalk.yellow(chatResult.signatureValidation.recoveredAddress)}`);
    log("       --------------------------------");
    log(`       RESULT: ${chatResult.signatureValidation.valid ? '✅ SIGNATURE VERIFIED' : '❌ SIGNATURE INVALID'}`);


    log("\n✅ Demo complete!");
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

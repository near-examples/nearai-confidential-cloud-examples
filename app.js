#!/usr/bin/env node
import {
  getModelAttestation,
  getGpuAttestation,
  decodeNvidiaAttestation,
  decodeAttestationReport,
} from "./utils/attestation.js";

// You can change this to any model name you want to test
const MODEL_NAME = "gpt-oss-120b";

/**
 * Main function to demonstrate attestation workflow
 */
async function main() {
  try {
    console.log("🚀 Starting NEAR AI Confidential Cloud Attestation Demo\n");

    console.log(`📋 Getting attestation report for model: ${MODEL_NAME}`);
    console.log(
      `🌐 API Endpoint: https://cloud-api.near.ai/v1/attestation/report?model=${MODEL_NAME}`
    );
    console.log(
      `🔑 API Key configured: ${
        process.env.NEARAI_CLOUD_API_KEY ? "Yes" : "No"
      }`
    );

    // Step 1: Get model attestation
    const attestationReport = await getModelAttestation(MODEL_NAME);
    const decodedAttestationReport = decodeAttestationReport(attestationReport);

    // Show detailed formatted report
    // formatAttestationReport(attestationReport);

    console.log("===============================================");

    // Step 2: Verify GPU attestation if NVIDIA payload is present
    if (attestationReport.nvidia_payload) {
      console.log("\n🔄 Verifying GPU attestation with NVIDIA...");
      console.log(
        "🌐 NVIDIA Endpoint: https://nras.attestation.nvidia.com/v3/attest/gpu"
      );
      console.log(
        `📦 Payload type: ${typeof attestationReport.nvidia_payload}`
      );

      const gpuVerification = await getGpuAttestation(
        attestationReport.nvidia_payload
      );
      const decodedGpuVerification = decodeNvidiaAttestation(gpuVerification);
      const gpuAttestationOverallResult =
        decodedGpuVerification.JWT["x-nvidia-overall-att-result"];

      console.log("Decoded overall attestation: ", gpuAttestationOverallResult);
    } else {
      console.log("\n⚠️  No NVIDIA payload found in attestation report");
      console.log("💡 This might mean:");
      console.log("   - The model is not running on NVIDIA hardware");
      console.log(
        "   - The attestation service is not configured for GPU verification"
      );
      console.log(
        "   - The model attestation doesn't include GPU-specific data"
      );
    }

    console.log("\n✅ Demo completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   Model: ${MODEL_NAME}`);
    console.log(
      `   Attestation report size: ${
        JSON.stringify(attestationReport).length
      } characters`
    );
    console.log(
      `   NVIDIA payload present: ${
        attestationReport.nvidia_payload ? "Yes" : "No"
      }`
    );
    if (attestationReport.nvidia_payload) {
      console.log(`   GPU verification attempted: Yes`);
    }
  } catch (error) {
    console.error("\n❌ Error occurred:");
    console.error(`   ${error.message}`);
    console.error(`   Error type: ${error.constructor.name}`);

    if (error.stack) {
      console.error("\n📍 Stack trace:");
      console.error(error.stack);
    }

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

// Run the main function
main();

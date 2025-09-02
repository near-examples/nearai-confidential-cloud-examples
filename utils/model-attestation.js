#!/usr/bin/env node
import dotenv from "dotenv";
import { decodeJwt } from "jose";

dotenv.config();

/**
 * Decode NVIDIA attestation response format
 * @param {Array} nvidiaResponse - Array response from NVIDIA containing JWT tokens
 * @returns {Object} Decoded attestation data with JWT and GPU tokens
 */
export function decodeNvidiaAttestation(nvidiaResponse) {
  const result = {};

  if (!Array.isArray(nvidiaResponse)) {
    throw new Error('Expected array response from NVIDIA attestation service');
  }

  // Helper function to decode a token and handle errors
  const decodeToken = (key, token) => {
    if (typeof token === 'string' && token.includes('.')) {
      try {
        result[key] = decodeJwt(token);
      } catch (error) {
        console.warn(`Failed to decode ${key} token: ${error.message}`);
        result[key] = { error: error.message };
      }
    }
  };

  nvidiaResponse.forEach((item) => {
    if (Array.isArray(item)) {
      // Handle ["JWT", "token_string"] format
      if (item.length === 2) {
        decodeToken(item[0], item[1]);
      }
    } else if (typeof item === 'object' && item !== null) {
      // Handle {"GPU-0": "token_string"} format
      Object.entries(item).forEach(([key, token]) => {
        decodeToken(key, token);
      });
    }
  });

  return result;
}

/**
 * Decode Intel quote hex string to structured data
 * @param {string} hexQuote - Hex-encoded Intel quote
 * @returns {Object} Decoded quote structure with header, body, and signature info
 */
function decodeIntelQuote(hexQuote) {
  try {
    if (!hexQuote || typeof hexQuote !== 'string') {
      return { error: 'Invalid hex quote format' };
    }

    // Convert hex to bytes for analysis
    const bytes = new Uint8Array(hexQuote.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    
    if (bytes.length < 48) {
      return { error: 'Quote too short to be valid' };
    }

    // Basic SGX quote structure parsing
    const quote = {
      version: bytes[0] | (bytes[1] << 8),
      sign_type: bytes[2] | (bytes[3] << 8),
      epid_group_id: Array.from(bytes.slice(4, 8)).map(b => b.toString(16).padStart(2, '0')).join(''),
      qe_svn: bytes[8] | (bytes[9] << 8),
      pce_svn: bytes[10] | (bytes[11] << 8),
      xeid: Array.from(bytes.slice(12, 28)).map(b => b.toString(16).padStart(2, '0')).join(''),
      basename: Array.from(bytes.slice(28, 60)).map(b => b.toString(16).padStart(2, '0')).join(''),
      raw_hex: hexQuote,
      size_bytes: bytes.length
    };

    // Add report body if quote is long enough
    if (bytes.length >= 432) {
      const reportBody = bytes.slice(48, 432);
      quote.report_body = {
        cpu_svn: Array.from(reportBody.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(''),
        misc_select: Array.from(reportBody.slice(16, 20)).map(b => b.toString(16).padStart(2, '0')).join(''),
        attributes: Array.from(reportBody.slice(32, 48)).map(b => b.toString(16).padStart(2, '0')).join(''),
        mr_enclave: Array.from(reportBody.slice(64, 96)).map(b => b.toString(16).padStart(2, '0')).join(''),
        mr_signer: Array.from(reportBody.slice(128, 160)).map(b => b.toString(16).padStart(2, '0')).join(''),
        config_id: Array.from(reportBody.slice(160, 224)).map(b => b.toString(16).padStart(2, '0')).join(''),
        isv_prod_id: reportBody[256] | (reportBody[257] << 8),
        isv_svn: reportBody[258] | (reportBody[259] << 8),
        config_svn: reportBody[260] | (reportBody[261] << 8),
        isv_family_id: Array.from(reportBody.slice(304, 320)).map(b => b.toString(16).padStart(2, '0')).join(''),
        report_data: Array.from(reportBody.slice(320, 384)).map(b => b.toString(16).padStart(2, '0')).join('')
      };
    }

    return quote;
  } catch (error) {
    return { 
      error: `Failed to decode Intel quote: ${error.message}`,
      raw_hex: hexQuote
    };
  }
}

/**
 * Decode attestation report structure
 * @param {Object} attestationReport - The attestation report object
 * @returns {Object} Decoded attestation report with parsed components
 */
export function decodeAttestationReport(attestationReport) {
  const decoded = {
    signing_address: attestationReport.signing_address,
    intel_quote: decodeIntelQuote(attestationReport.intel_quote),
    nvidia_payload: null,
    all_attestations: []
  };

  // Parse nvidia_payload if it exists and is a string
  if (attestationReport.nvidia_payload && typeof attestationReport.nvidia_payload === 'string') {
    try {
      decoded.nvidia_payload = JSON.parse(attestationReport.nvidia_payload);
    } catch (error) {
      console.warn(`Failed to parse nvidia_payload: ${error.message}`);
      decoded.nvidia_payload = { error: error.message, raw: attestationReport.nvidia_payload };
    }
  } else if (attestationReport.nvidia_payload) {
    // Already parsed or different format
    decoded.nvidia_payload = attestationReport.nvidia_payload;
  }

  // Process all_attestations array
  if (Array.isArray(attestationReport.all_attestations)) {
    decoded.all_attestations = attestationReport.all_attestations.map((attestation, index) => {
      const decodedAttestation = {
        signing_address: attestation.signing_address,
        intel_quote: decodeIntelQuote(attestation.intel_quote),
        nvidia_payload: null
      };

      // Parse nvidia_payload for each attestation
      if (attestation.nvidia_payload && typeof attestation.nvidia_payload === 'string') {
        try {
          decodedAttestation.nvidia_payload = JSON.parse(attestation.nvidia_payload);
        } catch (error) {
          console.warn(`Failed to parse nvidia_payload for attestation ${index}: ${error.message}`);
          decodedAttestation.nvidia_payload = { error: error.message, raw: attestation.nvidia_payload };
        }
      } else if (attestation.nvidia_payload) {
        decodedAttestation.nvidia_payload = attestation.nvidia_payload;
      }

      return decodedAttestation;
    });
  }

  return decoded;
}

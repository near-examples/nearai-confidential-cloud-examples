# NEAR AI Cloud Verification Example

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![NEAR AI Docs](https://img.shields.io/badge/NEAR_AI-Docs-blue.svg)](https://docs.near.ai/)

> 🚀 **Learn how to build secure, verifiable AI applications using NEAR AI Confidential Cloud**

This repository demonstrates how to interact with NEAR AI's Cloud platform, verify attestations, and ensure your AI workloads run in secure, trusted execution environments (TEEs).

## 🌟 What You'll Learn

- **🔒 Attestation Verification**: Get and verify model attestations from NEAR AI Cloud
- **🛡️ Hardware Security**: Validate NVIDIA GPU attestations for secure execution
- **🔐 Cryptographic Verification**: Verify signatures and hash integrity
- **⚡ End-to-End Workflow**: Complete pipeline from request to verified response

## 📋 Prerequisites

- **Node.js 18+** and **npm/pnpm**
- **NEAR AI Cloud API Key** ([Get yours here](https://cloud.near.ai/))
- Basic understanding of:
  - Trusted Execution Environments (TEEs)
  - Cryptographic signatures
  - Hash functions

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/near-examples/nearai-cloud-verification-example.git
cd nearai-cloud-verification-example
pnpm install  # or npm install
```

### 2. Configure Environment

Create a `.env` file with your NEAR AI Cloud API key: _(Get yours at https://cloud.near.ai)_

```bash
# .env
NEARAI_CLOUD_API_KEY=your_api_key_here
```

### 3. Run the Demo

```bash
pnpm start  # or npm start
```

## 🎯 What the Demo Does

The main demo (`app.js`) walks through a complete confidential AI workflow:

```
┌─────────────────────────────────────────────────────────────┐
│  🚀 NEAR AI Cloud Verification Demo                         │
├─────────────────────────────────────────────────────────────┤
│  1) Get Attestation Report                                  │
│     ├─ Fetch model attestation from NEAR AI Cloud           │
│     └─ Extract TEE signing address                          │
│                                                             │
│  2) Verify with NVIDIA                                      │
│     ├─ Send attestation to NVIDIA service                   │
│     └─ Validate hardware security claims                    │
│                                                             │
│  3) Send & Verify Chat Message                              │
│     ├─ Send message to NEAR AI TEE model                    │
│     ├─ Get result w/ cryptographic signature                │
│     ├─ Verify request/response hashes                       │
│     └─ Validate TEE signature                               │
└─────────────────────────────────────────────────────────────┘
```

## 🏗️ Project Structure

```
nearai-confidential-cloud-examples/
├── app.js                          # 🎯 Main demo application
├── utils/                          # 🛠️ Utility modules
│   ├── api.js                      #    API interaction helpers
│   ├── model-attestation.js        #    Attestation processing
│   ├── send-and-verify-chat.js     #    Chat workflow
│   └── verification-helpers.js     #    Crypto verification
├── package.json                    # 📦 Dependencies
└── .env                            # 🔐 API key configuration
```

## 🔧 Core Components

### 🌐 API Integration (`utils/api.js`)

```javascript
import { getModelAttestation, getChatMessageSignature } from './utils/api.js';

// Get attestation for a model
const attestation = await getModelAttestation('gpt-oss-120b');

// Get signature for a chat completion
const signature = await getChatMessageSignature(chatId, modelId);
```

### 🛡️ Attestation Verification (`utils/model-attestation.js`)

```javascript
import { decodeNvidiaAttestation } from './utils/model-attestation.js';

// Process NVIDIA attestation response
const nvidiaResult = decodeNvidiaAttestation(gpuVerification);
```

### 🔐 Cryptographic Verification (`utils/verification-helpers.js`)

```javascript
import { verifySignature, compareHashes, sha256sum } from './utils/verification-helpers.js';

// Verify cryptographic signature
const signatureResult = await verifySignature(message, signature, expectedAddress);

// Compare hash values
const hashResult = compareHashes(signatureText, requestHash, responseHash);

// Generate SHA-256 hash
const hash = sha256sum(data);
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEARAI_CLOUD_API_KEY` | Your NEAR AI Cloud API key | ✅ Yes |

### Model Configuration

Edit `app.js` to test different models:

```javascript
// Available models at: https://docs.near.ai/cloud/models/
const MODEL_NAME = "deepseek-ai/DeepSeek-V3.1";    // DeepSeek Model
const MODEL_NAME = "zai-org/GLM-4.6";              // GLM 4.6 Model
```

### 🔒 Security Guarantees

When you see ✅ for all checks, you have cryptographic proof that:

- **🏗️ Trusted Hardware**: The AI model runs in a verified TEE
- **🔐 Data Integrity**: Request and response haven't been tampered with
- **✍️ Authenticity**: Response was signed by the verified TEE
- **🛡️ End-to-End Security**: Complete chain of trust established

## 🚨 Troubleshooting

### Common Issues

**❌ API Key Not Found**
```bash
Error: 401 Unauthorized
💡 Tip: Make sure your NEARAI_CLOUD_API_KEY is set in the .env file
```

**❌ Model Not Available**
```bash
Error: 404 Not Found
💡 Tip: The model name might have a typo or might not be available
```

**❌ Network Issues**
```bash
Error: fetch failed
💡 Tip: Check your internet connection and API endpoints
```

## 🔗 API Endpoints

The demo interacts with these NEAR AI Cloud endpoints:

- **Attestation**: `https://cloud-api.near.ai/v1/attestation/report`
- **Chat Completions**: `https://cloud-api.near.ai/v1/chat/completions`
- **Signatures**: `https://cloud-api.near.ai/v1/signature/{chatId}`

And external verification:

- **NVIDIA Attestation**: `https://nras.attestation.nvidia.com/v3/attest/gpu`

## 📚 Learn More

- **[NEAR AI Cloud Documentation](https://docs.near.ai)**
- **[NVIDIA Confidential Computing](https://www.nvidia.com/en-us/data-center/solutions/confidential-computing/)**
- **[NVIDIA Attestation Service](https://docs.api.nvidia.com/attestation/reference/attestationinfo)**
- **[Trusted Execution Environments](https://en.wikipedia.org/wiki/Trusted_execution_environment)**

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


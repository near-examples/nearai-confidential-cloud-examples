#!/usr/bin/env node
import dotenv from "dotenv";
import { sendChatMessageRequest } from './lib/message-request.js';
import { sha256sum,} from './lib/signature-utils.js';

dotenv.config();

const requestBody = JSON.stringify({
  "messages": [
    {
      "content": "Respond with only two words",
      "role": "user"
    }
  ],
  "stream": true,
  "model": "llama-3.3-70b-instruct"
});

const response = await sendChatMessageRequest(requestBody);
const requestHash = sha256sum(requestBody);
const responseHash = sha256sum(response.responseText);

console.log('REQUEST HASH:', requestHash);
console.log('RESPONSE HASH:', responseHash);
console.log('CHAT ID:', response.chatId);
#!/usr/bin/env node
import dotenv from "dotenv";
import { sha256 } from 'js-sha256';
import { createHash } from 'crypto';
import { callNearAI } from './message-request.js';
dotenv.config();

function sha256sum(data) {
  return createHash('sha256').update(data, 'utf8').digest('hex');
}

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

const response = await callNearAI(requestBody);
const responseBody = await response.text();

const requestHash = sha256sum(requestBody);
const requestHash2 = sha256(requestBody);
console.log(requestHash); // 31f46232b8ae6154e75a68256523851c1ce84f9ad53a1f8290c9d0576b95929f
console.log(requestHash2); // 31f46232b8ae6154e75a68256523851c1ce84f9ad53a1f8290c9d0576b95929f

const responseHash = sha256sum(responseBody);
const responseHash2 = sha256(responseBody);
console.log(responseHash);
console.log(responseHash2);
console.log(responseBody);

  
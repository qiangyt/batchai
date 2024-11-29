'use client';

import { io } from 'socket.io-client';

// "undefined" means the URL will be computed from the `window.location` object
const URL = process.env.NODE_ENV === 'production' ? 'https://example.batchai.kailash.cloud:8443' : 'http://dev.example.batchai.kailash.cloud:4080';

export const socket = io(URL);
//export const socket = io();
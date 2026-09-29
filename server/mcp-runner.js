#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpServer } from './mcpServer.js';
import dotenv from 'dotenv';

dotenv.config();

const apiUrl = process.env.VOCALFLOW_API_URL || 'http://localhost:3001/api';
const apiKey = process.env.VOCALFLOW_API_KEY || '';

const server = createMcpServer({ apiUrl, apiKey });
const transport = new StdioServerTransport();

async function run() {
  await server.connect(transport);
  console.error('VocalFlow MCP STDIO Server connected and listening for agent tool calls.');
}

run().catch((err) => {
  console.error('MCP Server Fatal Error:', err);
  process.exit(1);
});

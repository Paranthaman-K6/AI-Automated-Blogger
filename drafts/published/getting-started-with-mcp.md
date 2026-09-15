---
title: "Getting Started with OpenCode MCP Servers"
description: "Learn how to build and use MCP servers to extend OpenCode's capabilities"
pubDate: 2026-09-14
author: Paranthaman
tags: ["opencode", "mcp", "tutorial", "ai-tools"]
sources:
  - title: "OpenCode Documentation"
    url: "https://opencode.ai"
---

# Getting Started with OpenCode MCP Servers

Model Context Protocol (MCP) servers are the foundation of OpenCode's extensibility. They allow you to create custom tools that integrate with any API, service, or workflow.

## What is an MCP Server?

An MCP server is a lightweight process that communicates with OpenCode via stdio. It exposes tools that can be called by agents, giving them new capabilities beyond the built-in tools.

## Why Build Your Own?

- **Custom integrations**: Connect to APIs not yet supported
- **Workflow automation**: Chain multiple operations together
- **Domain expertise**: Create tools specialized for your use case
- **Team collaboration**: Share tools across your organization

## Quick Start

Here's a minimal MCP server in TypeScript:

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

const server = new McpServer({ name: 'my-server', version: '1.0.0' })

server.tool('greet', { name: { type: 'string' } }, async ({ name }) => {
  return { content: [{ type: 'text', text: `Hello, ${name}!` }] }
})

const transport = new StdioServerTransport()
await server.connect(transport)
```

## Next Steps

Once your server is built and tested, add it to your OpenCode configuration:

```json
{
  "mcp": {
    "my-server": {
      "type": "local",
      "command": ["node", "/path/to/dist/index.js"],
      "enabled": true
    }
  }
}
```

Restart OpenCode and your new tools will be available immediately.

---

*Built with the Automated Blogger system using AI-powered content generation.*
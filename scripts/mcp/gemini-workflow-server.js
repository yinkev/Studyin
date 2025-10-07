#!/usr/bin/env node
/**
 * Gemini Workflow MCP Server
 * Following the OpenAI Codex MCP Agents SDK cookbook pattern
 * Uses Gemini API with gemini-2.5-flash-preview-09-2025 model
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { readFileSync } from 'fs';
import { existsSync } from 'fs';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = 'gemini-2.5-flash-preview-09-2025';
const PROJECT_ROOT = process.env.PROJECT_ROOT || process.cwd();

if (!GEMINI_API_KEY) {
  console.error('Error: GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Initialize MCP Server
const server = new Server(
  {
    name: 'gemini-workflow-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool: Analyze Dashboard
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'analyze_dashboard',
        description: 'Analyze the Studyin dashboard UI and provide insights using Gemini vision',
        inputSchema: {
          type: 'object',
          properties: {
            screenshot_path: {
              type: 'string',
              description: 'Path to dashboard screenshot',
            },
            analysis_type: {
              type: 'string',
              enum: ['ui', 'ux', 'accessibility', 'gamification', 'full'],
              description: 'Type of analysis to perform',
            },
          },
          required: ['screenshot_path'],
        },
      },
      {
        name: 'generate_test',
        description: 'Generate a Playwright test using Gemini based on a description',
        inputSchema: {
          type: 'object',
          properties: {
            test_description: {
              type: 'string',
              description: 'Description of what the test should do',
            },
            route: {
              type: 'string',
              description: 'Route to test (e.g., /dashboard, /study)',
            },
          },
          required: ['test_description', 'route'],
        },
      },
      {
        name: 'review_code',
        description: 'Review code using Gemini and provide suggestions',
        inputSchema: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'Code to review',
            },
            language: {
              type: 'string',
              description: 'Programming language',
            },
            focus: {
              type: 'string',
              enum: ['performance', 'security', 'best-practices', 'all'],
              description: 'Focus area for review',
            },
          },
          required: ['code'],
        },
      },
      {
        name: 'improve_gamification',
        description: 'Analyze and suggest improvements for gamification features',
        inputSchema: {
          type: 'object',
          properties: {
            current_features: {
              type: 'string',
              description: 'Description of current gamification features',
            },
            user_data: {
              type: 'string',
              description: 'Optional user engagement data',
            },
          },
          required: ['current_features'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    switch (name) {
      case 'analyze_dashboard': {
        const { screenshot_path, analysis_type = 'full' } = args;

        if (!existsSync(screenshot_path)) {
          throw new Error(`Screenshot not found: ${screenshot_path}`);
        }

        const imageData = readFileSync(screenshot_path).toString('base64');

        const prompt = getAnalysisPrompt(analysis_type);

        const result = await model.generateContent([
          {
            inlineData: {
              mimeType: 'image/png',
              data: imageData,
            },
          },
          prompt,
        ]);

        return {
          content: [
            {
              type: 'text',
              text: result.response.text(),
            },
          ],
        };
      }

      case 'generate_test': {
        const { test_description, route } = args;

        const prompt = `Generate a Playwright test in TypeScript for the following scenario:

Route: ${route}
Description: ${test_description}

Requirements:
- Use TypeScript with proper typing
- Follow Playwright best practices
- Include proper assertions
- Add comments explaining key steps
- Use page object pattern if appropriate
- Handle loading states and errors

Generate only the test code, no explanations.`;

        const result = await model.generateContent(prompt);

        return {
          content: [
            {
              type: 'text',
              text: result.response.text(),
            },
          ],
        };
      }

      case 'review_code': {
        const { code, language = 'typescript', focus = 'all' } = args;

        const prompt = `Review this ${language} code with focus on ${focus}:

\`\`\`${language}
${code}
\`\`\`

Provide:
1. Issues found (if any) with severity (high/medium/low)
2. Best practice suggestions
3. Performance improvements
4. Security concerns (if applicable)
5. Overall code quality score (1-10)

Format the response as structured markdown.`;

        const result = await model.generateContent(prompt);

        return {
          content: [
            {
              type: 'text',
              text: result.response.text(),
            },
          ],
        };
      }

      case 'improve_gamification': {
        const { current_features, user_data = 'Not provided' } = args;

        const prompt = `Analyze these gamification features and suggest improvements:

Current Features:
${current_features}

User Data:
${user_data}

Provide:
1. Strengths of current implementation
2. Weaknesses or missing features
3. 5 specific actionable improvements
4. Psychology principles to apply (e.g., Self-Determination Theory, Loss Aversion)
5. Examples from top apps (Duolingo, Khan Academy, etc.)

Format as structured markdown with priorities.`;

        const result = await model.generateContent(prompt);

        return {
          content: [
            {
              type: 'text',
              text: result.response.text(),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

function getAnalysisPrompt(type) {
  const prompts = {
    ui: 'Analyze this dashboard UI. Focus on: layout, visual hierarchy, color scheme, typography, spacing, and overall aesthetics. Provide specific feedback.',
    ux: 'Analyze this dashboard UX. Focus on: user flow, ease of use, information architecture, call-to-actions, navigation, and cognitive load. Provide specific improvements.',
    accessibility: 'Analyze this dashboard for accessibility. Check: color contrast, text readability, keyboard navigation, screen reader compatibility, ARIA labels, and WCAG compliance. Provide specific issues and fixes.',
    gamification: 'Analyze the gamification elements in this dashboard. Identify: XP systems, achievements, progress indicators, motivational elements, feedback loops. Compare to industry best practices (Duolingo, Khan Academy). Provide specific suggestions.',
    full: 'Provide a comprehensive analysis of this learning dashboard covering: UI design, UX, accessibility, gamification effectiveness, engagement potential, and overall user experience. Compare to world-class examples and provide prioritized recommendations.',
  };

  return prompts[type] || prompts.full;
}

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Gemini Workflow MCP Server running');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});

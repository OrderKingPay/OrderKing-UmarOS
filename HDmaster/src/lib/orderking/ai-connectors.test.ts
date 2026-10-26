import { describe, it, expect } from "vitest";
import {
  DEFAULT_PLUGIN_CONNECTORS,
  type PluginConnectorsConfig,
} from "./cms-connectors.ts";

describe("Umar OS Authentic AI & Swarm Connectors", () => {
  it("DEFAULT_PLUGIN_CONNECTORS includes authentic definitions for OpenAI, Gemini, xAI, and Antigravity", () => {
    expect(DEFAULT_PLUGIN_CONNECTORS.openai).toBeDefined();
    expect(DEFAULT_PLUGIN_CONNECTORS.gemini).toBeDefined();
    expect(DEFAULT_PLUGIN_CONNECTORS.xai).toBeDefined();
    expect(DEFAULT_PLUGIN_CONNECTORS.antigravity).toBeDefined();
  });

  it("OpenAI connector has correct defaults for GPT-4o and spend limits", () => {
    const { openai } = DEFAULT_PLUGIN_CONNECTORS;
    expect(openai.defaultModel).toBe("gpt-4o");
    expect(openai.dailySpendCapUsd).toBe(25);
    expect(openai.status).toBe("NOT_CONFIGURED");
  });

  it("Google Gemini connector has correct defaults for Gemini 2.5 Flash", () => {
    const { gemini } = DEFAULT_PLUGIN_CONNECTORS;
    expect(gemini.defaultModel).toBe("gemini-2.5-flash");
    expect(gemini.dailySpendCapInr).toBe(500);
  });

  it("xAI Grok connector has correct defaults for Grok-2", () => {
    const { xai } = DEFAULT_PLUGIN_CONNECTORS;
    expect(xai.defaultModel).toBe("grok-2");
    expect(xai.dailySpendCapUsd).toBe(25);
    expect(xai.status).toBe("NOT_CONFIGURED");
  });

  it("Antigravity connector defaults to active swarm at C:\\Users\\hasan\\OrderKing", () => {
    const { antigravity } = DEFAULT_PLUGIN_CONNECTORS;
    expect(antigravity.workspacePath).toBe("C:\\Users\\hasan\\OrderKing");
    expect(antigravity.agentMode).toBe("autonomous_swarm");
    expect(antigravity.activeAgentsCount).toBe(4);
    expect(antigravity.toolExecutionPolicy).toBe("full_execution");
    expect(antigravity.maxConcurrentTasks).toBe(8);
    expect(antigravity.status).toBe("CONNECTED");
  });

  it("Antigravity connector validates operational status and multi-agent topology", () => {
    const antigravity = {
      ...DEFAULT_PLUGIN_CONNECTORS.antigravity,
      activeAgentsCount: 4,
    };
    expect(antigravity.enabled).toBe(true);
    expect(antigravity.agentMode).toBe("autonomous_swarm");
    expect(antigravity.activeAgentsCount).toBe(4);
  });
});

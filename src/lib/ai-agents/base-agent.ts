/**
 * Base Agent Class
 *
 * Abstract base class for all AI validation agents.
 * Provides common functionality for logging, error handling, and result storage.
 */

import { db } from "@/lib/db";
import { AgentExecutionStatus } from "@prisma/client";
import type { BaseAgentResult } from "./types/agent-results";

export interface AgentExecutionContext {
  uploadedFileId?: string;
  intakeSessionId?: string;
  documentUrl: string;
  documentText?: string; // Pre-extracted OCR text if available
  userSelectedCategory?: string; // User's manual category selection
  categoryLocked?: boolean; // Whether user has locked the category
  metadata?: Record<string, unknown>;
}

export interface AgentConfig {
  modelName?: string; // e.g., "gpt-4o"
  temperature?: number;
  maxTokens?: number;
  timeout?: number; // milliseconds
}

export abstract class BaseAgent<TResult extends BaseAgentResult> {
  protected readonly agentName: string;
  protected readonly agentVersion: string;
  protected readonly config: AgentConfig;

  constructor(
    agentName: string,
    agentVersion = "1.0",
    config: AgentConfig = {}
  ) {
    this.agentName = agentName;
    this.agentVersion = agentVersion;
    this.config = {
      modelName: config.modelName || "gpt-4o",
      temperature: config.temperature ?? 0.1, // Low temperature for consistent validation
      maxTokens: config.maxTokens || 4096,
      timeout: config.timeout || 60000, // 60 seconds default
    };
  }

  /**
   * Main execution method - orchestrates the entire agent workflow
   */
  async execute(context: AgentExecutionContext): Promise<TResult> {
    const startTime = Date.now();
    const logId = await this.createExecutionLog(context);

    try {
      // Update log to RUNNING
      await this.updateExecutionLog(logId, AgentExecutionStatus.RUNNING);

      // Run the agent-specific validation logic
      const result = await this.validate(context);

      // Calculate processing time
      const processingTimeMs = Date.now() - startTime;
      result.processingTimeMs = processingTimeMs;
      result.timestamp = new Date();

      // Store result and update log
      await this.storeResult(context, result, logId);
      await this.updateExecutionLog(logId, AgentExecutionStatus.COMPLETED, {
        output: result,
        executionTimeMs: processingTimeMs,
      });

      return result;
    } catch (error) {
      const processingTimeMs = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Log the error
      await this.updateExecutionLog(logId, AgentExecutionStatus.FAILED, {
        error: errorMessage,
        executionTimeMs: processingTimeMs,
      });

      // Re-throw the error
      throw error;
    }
  }

  /**
   * Abstract method that each agent must implement
   * This contains the core validation logic specific to each agent
   */
  protected abstract validate(context: AgentExecutionContext): Promise<TResult>;

  /**
   * Abstract method for storing agent-specific results
   */
  protected abstract storeResult(
    context: AgentExecutionContext,
    result: TResult,
    logId: string
  ): Promise<void>;

  /**
   * Create an execution log entry in the database
   */
  protected async createExecutionLog(
    context: AgentExecutionContext
  ): Promise<string> {
    const log = await db.agentExecutionLog.create({
      data: {
        agentName: this.agentName,
        agentVersion: this.agentVersion,
        uploadedFileId: context.uploadedFileId,
        intakeSessionId: context.intakeSessionId,
        status: AgentExecutionStatus.PENDING,
        input: {
          documentUrl: context.documentUrl,
          hasOCRText: !!context.documentText,
          metadata: context.metadata || {},
        } as any,
        modelUsed: this.config.modelName,
      },
    });

    return log.id;
  }

  /**
   * Update an execution log entry
   */
  protected async updateExecutionLog(
    logId: string,
    status: AgentExecutionStatus,
    data?: {
      output?: unknown;
      error?: string;
      executionTimeMs?: number;
      tokensUsed?: number;
      estimatedCost?: number;
    }
  ): Promise<void> {
    await db.agentExecutionLog.update({
      where: { id: logId },
      data: {
        status,
        completedAt:
          status === AgentExecutionStatus.COMPLETED ||
          status === AgentExecutionStatus.FAILED
            ? new Date()
            : undefined,
        output: data?.output as any,
        error: data?.error,
        executionTimeMs: data?.executionTimeMs,
        tokensUsed: data?.tokensUsed,
        estimatedCost: data?.estimatedCost,
      },
    });
  }

  /**
   * Helper method to call OpenAI API
   * Can be overridden by agents that need custom API logic
   */
  protected async callOpenAI(
    prompt: string,
    systemPrompt: string,
    _context: AgentExecutionContext
  ): Promise<string> {
    const openAIKey = process.env.OPENAI_API_KEY;
    if (!openAIKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAIKey}`,
      },
      body: JSON.stringify({
        model: this.config.modelName,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      }),
      signal: AbortSignal.timeout(this.config.timeout!),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "";
  }

  /**
   * Helper method to call OpenAI Vision API with document image
   * Used as fallback when OCR fails or returns empty text
   */
  protected async callOpenAIVision(
    prompt: string,
    systemPrompt: string,
    imageUrl: string,
    context: AgentExecutionContext
  ): Promise<string> {
    const openAIKey = process.env.OPENAI_API_KEY;
    if (!openAIKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }

    console.log(
      `🔍 Using Vision API for document analysis: ${context.uploadedFileId}`
    );

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAIKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o", // Vision requires gpt-4o or gpt-4-turbo
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                  detail: "high", // Use high detail for document analysis
                },
              },
            ],
          },
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      }),
      signal: AbortSignal.timeout(this.config.timeout!),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenAI Vision API error: ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "";
  }

  /**
   * Helper method to parse JSON response from OpenAI
   * Handles common parsing errors and retries
   */
  protected parseJSONResponse<T>(responseText: string): T {
    try {
      // Remove markdown code blocks if present
      let cleaned = responseText.trim();
      if (cleaned.startsWith("```json")) {
        cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }

      return JSON.parse(cleaned) as T;
    } catch (error) {
      throw new Error(
        `Failed to parse JSON response: ${error instanceof Error ? error.message : String(error)}\n\nResponse: ${responseText}`
      );
    }
  }

  /**
   * Helper to calculate confidence score based on multiple factors
   */
  protected calculateConfidence(factors: {
    ocrQuality?: number; // 0-1
    dataCompleteness?: number; // 0-1
    aiConfidence?: number; // 0-1
    validationPasses?: number; // Count
    validationTotal?: number; // Count
  }): number {
    const {
      ocrQuality = 1.0,
      dataCompleteness = 1.0,
      aiConfidence = 1.0,
      validationPasses,
      validationTotal,
    } = factors;

    // When a caller provides no validation factors (classifier and
    // data-extraction are the two), the validation term must be neutral
    // (1.0), matching the defaults of every other factor. It previously
    // defaulted to 0/1, which capped the blended confidence at 0.8 while
    // determineStatus requires >= 0.8 for PASS, so those agents could never
    // PASS and auto-categorization never fired.
    const validationScore =
      validationPasses === undefined && validationTotal === undefined
        ? 1.0
        : (validationTotal ?? 1) > 0
          ? (validationPasses ?? 0) / (validationTotal ?? 1)
          : 1.0;

    // Weighted average of all factors
    const confidence =
      ocrQuality * 0.2 +
      dataCompleteness * 0.3 +
      aiConfidence * 0.3 +
      validationScore * 0.2;

    return Math.max(0, Math.min(1, confidence)); // Clamp to 0-1
  }

  /**
   * Helper to determine agent status based on confidence and validation results
   */
  protected determineStatus(
    confidence: number,
    hasCriticalIssues: boolean,
    hasWarnings: boolean
  ): "PASS" | "FAIL" | "NEEDS_REVIEW" | "ERROR" {
    if (hasCriticalIssues || confidence < 0.5) {
      return "FAIL";
    }

    if (hasWarnings || confidence < 0.8) {
      return "NEEDS_REVIEW";
    }

    return "PASS";
  }
}

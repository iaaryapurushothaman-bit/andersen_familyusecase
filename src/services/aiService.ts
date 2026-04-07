import { researcherAgent, analystAgent } from './agents';
import { InMemoryRunner, stringifyContent } from './adk-web-patch';
import { terminalLog, terminalError } from './terminalLogger';

export interface AIResponse {
  content: string;
  error?: string;
}

export const aiService = {
  /**
   * Researcher Agent: Uses Google ADK with Function Calling.
   */
  async research(query: string): Promise<AIResponse> {
    await terminalLog("Researcher Agent starting ADK query:", query);

    try {
      const runner = new InMemoryRunner({
        agent: researcherAgent,
        appName: 'FamilyBusinessPortal',
      });

      await terminalLog("Starting ephemeral run for researcherAgent...");

      let finalContent = '';
      const params = {
        userId: 'browser-user',
        newMessage: {
          role: 'user',
          parts: [{ text: query }]
        }
      };

      // In ADK 0.5.x, runEphemeral returns an AsyncGenerator of events
      for await (const event of runner.runEphemeral(params)) {
        await terminalLog("Received ADK Event (Researcher):", {
          author: event.author,
          contentType: event.content ? 'hasContent' : 'noContent',
          actions: event.actions?.length,
          errorCode: (event as any).errorCode,
          errorMessage: (event as any).errorMessage
        });

        // Debug: log full event if suspect
        if (!event.content && !(event as any).actions?.length) {
          await terminalLog("Full ADK Event (No Content/Actions):", event);
        }

        if (event.content) {
          const chunk = stringifyContent(event);
          if (chunk) {
            // Accumulate content if partial, or take full if final
            if (event.partial) {
              finalContent += chunk;
            } else {
              finalContent = chunk; // Non-partial events often carry the full text so far in ADK
            }
          }
        }

        if ((event as any).errorCode) {
          await terminalError("ADK Error Event:", (event as any).errorCode, (event as any).errorMessage);
        }
      }

      await terminalLog("ADK Research completed. Final content length:", finalContent.length);

      if (!finalContent) {
        await terminalError("Research returned empty content");
      }

      return { content: finalContent };

    } catch (err: any) {
      await terminalError("Researcher Error:", err.message, err.stack);
      return { content: "", error: err.message || "Failed to conduct research" };
    }
  },

  /**
   * Analyst Agent: Uses Google ADK for report generation.
   */
  async analyze(data: any): Promise<AIResponse> {
    await terminalLog("Analyst Agent starting ADK analysis for:", data.name);

    try {
      const runner = new InMemoryRunner({
        agent: analystAgent,
        appName: 'FamilyBusinessPortal',
      });

      const prompt = `Generate a professional, strategic analysis report for the following business.
      
      Business Data:
      Name: ${data.name}
      Family: ${data.family}
      Industry: ${data.industry}
      Revenue (Est): ${data.revenue}
      Governance: ${data.governance}
      Current Signals: ${data.signals}`;

      let finalContent = '';
      const params = {
        userId: 'browser-user',
        newMessage: {
          role: 'user',
          parts: [{ text: prompt }]
        }
      };

      for await (const event of runner.runEphemeral(params)) {
        await terminalLog("Received ADK Event (Analyst):", {
          author: event.author,
          contentType: event.content ? 'hasContent' : 'noContent',
          errorCode: (event as any).errorCode,
          errorMessage: (event as any).errorMessage
        });

        if (!event.content) {
          await terminalLog("Full ADK Event (No Content Analyst):", event);
        }

        if (event.content) {
          const chunk = stringifyContent(event);
          if (chunk) {
            if (event.partial) {
              finalContent += chunk;
            } else {
              finalContent = chunk;
            }
          }
        }

        if ((event as any).errorCode) {
          await terminalError("ADK Analyst Error Event:", (event as any).errorCode, (event as any).errorMessage);
        }
      }

      await terminalLog("ADK Analysis completed. Final content length:", finalContent.length);

      if (!finalContent) {
        await terminalError("Analysis returned empty content");
      }

      return { content: finalContent };
    } catch (err: any) {
      await terminalError("Analyst Error:", err.message, err.stack);
      return { content: "", error: err.message || "Failed to generate report" };
    }
  }
};


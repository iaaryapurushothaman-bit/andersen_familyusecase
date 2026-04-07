/**
 * Patched version of @google/adk/dist/web/common.js
 * Bypasses ApigeeLlm due to "Unexpected super" bug in the official distribution.
 */

// Browser polyfill for setImmediate (required by winston/ADK internal logging)
if (typeof window !== 'undefined' && !(window as any).setImmediate) {
    (window as any).setImmediate = function (cb: any) {
        return setTimeout(cb, 0);
    };
}

import { ActiveStreamingTool } from '../../node_modules/@google/adk/dist/web/agents/active_streaming_tool.js';
import { BaseAgent, isBaseAgent } from '../../node_modules/@google/adk/dist/web/agents/base_agent.js';
import { Context } from '../../node_modules/@google/adk/dist/web/agents/context.js';
import { functionsExportedForTestingOnly } from '../../node_modules/@google/adk/dist/web/agents/functions.js';
import { InvocationContext } from '../../node_modules/@google/adk/dist/web/agents/invocation_context.js';
import { LiveRequestQueue } from '../../node_modules/@google/adk/dist/web/agents/live_request_queue.js';
import { LlmAgent, isLlmAgent } from '../../node_modules/@google/adk/dist/web/agents/llm_agent.js';
import { LoopAgent, isLoopAgent } from '../../node_modules/@google/adk/dist/web/agents/loop_agent.js';
import { ParallelAgent, isParallelAgent } from '../../node_modules/@google/adk/dist/web/agents/parallel_agent.js';
import {
    BaseLlmRequestProcessor,
    BaseLlmResponseProcessor
} from '../../node_modules/@google/adk/dist/web/agents/processors/base_llm_processor.js';
import { ReadonlyContext } from '../../node_modules/@google/adk/dist/web/agents/readonly_context.js';
import { StreamingMode } from '../../node_modules/@google/adk/dist/web/agents/run_config.js';
import { SequentialAgent, isSequentialAgent } from '../../node_modules/@google/adk/dist/web/agents/sequential_agent.js';
import { InMemoryArtifactService } from '../../node_modules/@google/adk/dist/web/artifacts/in_memory_artifact_service.js';
import { AuthCredentialTypes } from '../../node_modules/@google/adk/dist/web/auth/auth_credential.js';
import { BaseCodeExecutor } from '../../node_modules/@google/adk/dist/web/code_executors/base_code_executor.js';
import { BuiltInCodeExecutor } from '../../node_modules/@google/adk/dist/web/code_executors/built_in_code_executor.js';
import {
    createEvent,
    getFunctionCalls,
    getFunctionResponses,
    hasTrailingCodeExecutionResult,
    isFinalResponse,
    stringifyContent
} from '../../node_modules/@google/adk/dist/web/events/event.js';
import { createEventActions } from '../../node_modules/@google/adk/dist/web/events/event_actions.js';
import { EventType, toStructuredEvents } from '../../node_modules/@google/adk/dist/web/events/structured_events.js';
import {
    BaseExampleProvider,
    isBaseExampleProvider
} from '../../node_modules/@google/adk/dist/web/examples/base_example_provider.js';
import { InMemoryMemoryService } from '../../node_modules/@google/adk/dist/web/memory/in_memory_memory_service.js';
// import { ApigeeLlm } from "../../node_modules/@google/adk/dist/web/models/apigee_llm.js"; // BYPASSED
import { BaseLlm, isBaseLlm } from '../../node_modules/@google/adk/dist/web/models/base_llm.js';
import { Gemini, geminiInitParams } from '../../node_modules/@google/adk/dist/web/models/google_llm.js';
import { LLMRegistry } from '../../node_modules/@google/adk/dist/web/models/registry.js';
import { BasePlugin } from '../../node_modules/@google/adk/dist/web/plugins/base_plugin.js';
import { LoggingPlugin } from '../../node_modules/@google/adk/dist/web/plugins/logging_plugin.js';
import { PluginManager } from '../../node_modules/@google/adk/dist/web/plugins/plugin_manager.js';
import {
    InMemoryPolicyEngine,
    PolicyOutcome,
    REQUEST_CONFIRMATION_FUNCTION_CALL_NAME,
    SecurityPlugin,
    getAskUserConfirmationFunctionCalls
} from '../../node_modules/@google/adk/dist/web/plugins/security_plugin.js';
import { InMemoryRunner } from '../../node_modules/@google/adk/dist/web/runner/in_memory_runner.js';
import { Runner } from '../../node_modules/@google/adk/dist/web/runner/runner.js';
import { BaseSessionService } from '../../node_modules/@google/adk/dist/web/sessions/base_session_service.js';
import { InMemorySessionService } from '../../node_modules/@google/adk/dist/web/sessions/in_memory_session_service.js';
import { createSession } from '../../node_modules/@google/adk/dist/web/sessions/session.js';
import { State } from '../../node_modules/@google/adk/dist/web/sessions/state.js';
import { AgentTool, isAgentTool } from '../../node_modules/@google/adk/dist/web/tools/agent_tool.js';
import { BaseTool, isBaseTool } from '../../node_modules/@google/adk/dist/web/tools/base_tool.js';
import { BaseToolset, isBaseToolset } from '../../node_modules/@google/adk/dist/web/tools/base_toolset.js';
import { EXIT_LOOP, ExitLoopTool } from '../../node_modules/@google/adk/dist/web/tools/exit_loop_tool.js';
import { FunctionTool, isFunctionTool } from '../../node_modules/@google/adk/dist/web/tools/function_tool.js';
import { GOOGLE_SEARCH, GoogleSearchTool } from '../../node_modules/@google/adk/dist/web/tools/google_search_tool.js';
import { LongRunningFunctionTool } from '../../node_modules/@google/adk/dist/web/tools/long_running_tool.js';
import { ToolConfirmation } from '../../node_modules/@google/adk/dist/web/tools/tool_confirmation.js';
import { LogLevel, getLogger, setLogLevel, setLogger } from '../../node_modules/@google/adk/dist/web/utils/logger.js';
import { isGemini2OrAbove } from '../../node_modules/@google/adk/dist/web/utils/model_name.js';
import { zodObjectToSchema } from '../../node_modules/@google/adk/dist/web/utils/simple_zod_to_json.js';
import { GoogleLLMVariant } from '../../node_modules/@google/adk/dist/web/utils/variant_utils.js';
import { version } from '../../node_modules/@google/adk/dist/web/version.js';

export * from '../../node_modules/@google/adk/dist/web/artifacts/base_artifact_service.js';
export * from '../../node_modules/@google/adk/dist/web/memory/base_memory_service.js';
export * from '../../node_modules/@google/adk/dist/web/sessions/base_session_service.js';
export * from '../../node_modules/@google/adk/dist/web/tools/base_tool.js';

export {
    ActiveStreamingTool,
    AgentTool,
    // ApigeeLlm, // BYPASSED
    AuthCredentialTypes,
    BaseAgent,
    BaseCodeExecutor,
    BaseExampleProvider,
    BaseLlm,
    BaseLlmRequestProcessor,
    BaseLlmResponseProcessor,
    BasePlugin,
    BaseSessionService,
    BaseTool,
    BaseToolset,
    BuiltInCodeExecutor,
    Context,
    EXIT_LOOP,
    EventType,
    ExitLoopTool,
    FunctionTool,
    GOOGLE_SEARCH,
    Gemini,
    GoogleLLMVariant,
    GoogleSearchTool,
    InMemoryArtifactService,
    InMemoryMemoryService,
    InMemoryPolicyEngine,
    InMemoryRunner,
    InMemorySessionService,
    InvocationContext,
    LLMRegistry,
    LiveRequestQueue,
    LlmAgent,
    LogLevel,
    LoggingPlugin,
    LongRunningFunctionTool,
    LoopAgent,
    ParallelAgent,
    PluginManager,
    PolicyOutcome,
    REQUEST_CONFIRMATION_FUNCTION_CALL_NAME,
    ReadonlyContext,
    Runner,
    SecurityPlugin,
    SequentialAgent,
    State,
    StreamingMode,
    ToolConfirmation,
    createEvent,
    createEventActions,
    createSession,
    functionsExportedForTestingOnly,
    geminiInitParams,
    getAskUserConfirmationFunctionCalls,
    getFunctionCalls,
    getFunctionResponses,
    getLogger,
    hasTrailingCodeExecutionResult,
    isAgentTool,
    isBaseAgent,
    isBaseExampleProvider,
    isBaseLlm,
    isBaseTool,
    isBaseToolset,
    isFinalResponse,
    isFunctionTool,
    isGemini2OrAbove,
    isLlmAgent,
    isLoopAgent,
    isParallelAgent,
    isSequentialAgent,
    setLogLevel,
    setLogger,
    stringifyContent,
    toStructuredEvents,
    version,
    zodObjectToSchema
};

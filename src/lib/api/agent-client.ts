import { BaseApiClient } from "./base-api-client";
import { API_ENDPOINTS } from "../constants";
import { resolvePublicApiBaseUrl } from "./public-api-url";
import type {
  AgentMessageListDto,
  AgentThreadDto,
  AgentThreadListItemDto,
  CreateAgentRunRequestDto,
  CreateAgentRunResponseDto,
  CreateAgentThreadRequestDto,
  ExecuteAgentRunRequestDto,
} from "./types";

export class AgentClient extends BaseApiClient {
  async listThreads(
    projectId: string,
    agentId?: string,
  ): Promise<AgentThreadListItemDto[]> {
    return this.request<AgentThreadListItemDto[]>(
      API_ENDPOINTS.AGENT.THREADS(projectId, agentId),
    );
  }

  async createThread(request: CreateAgentThreadRequestDto): Promise<AgentThreadDto> {
    return this.request<AgentThreadDto>(API_ENDPOINTS.AGENT.CREATE_THREAD, {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async getThread(threadId: string): Promise<AgentThreadDto> {
    return this.request<AgentThreadDto>(API_ENDPOINTS.AGENT.THREAD(threadId));
  }

  async listMessages(
    threadId: string,
    limit = 100,
    before?: string,
  ): Promise<AgentMessageListDto> {
    return this.request<AgentMessageListDto>(
      API_ENDPOINTS.AGENT.MESSAGES(threadId, limit, before),
    );
  }

  async createRun(
    threadId: string,
    request: ExecuteAgentRunRequestDto,
  ): Promise<CreateAgentRunResponseDto> {
    return this.request<CreateAgentRunResponseDto>(API_ENDPOINTS.AGENT.CREATE_RUN(threadId), {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async *createRunStream(
    threadId: string,
    request: ExecuteAgentRunRequestDto,
  ): AsyncGenerator<any, void, unknown> {
    const url = `${resolvePublicApiBaseUrl()}${API_ENDPOINTS.AGENT.STREAM_RUN(threadId)}`;
    const response = await fetch(url, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Failed to start stream: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Simple SSE parsing (split by \n\n)
        let endIdx;
        while ((endIdx = buffer.indexOf('\n\n')) >= 0) {
          const chunk = buffer.slice(0, endIdx);
          buffer = buffer.slice(endIdx + 2);
          
          if (chunk.trim() === '') continue;

          // Parse event block
          const lines = chunk.split('\n');
          let event = 'message';
          let data = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              event = line.slice(7);
            } else if (line.startsWith('data: ')) {
              data += line.slice(6);
            }
          }

          if (data) {
            try {
              const parsedData = JSON.parse(data);
              yield { event, data: parsedData };
            } catch (e) {
              console.error("Failed to parse SSE data", data, e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async persistRun(
    threadId: string,
    request: CreateAgentRunRequestDto,
  ): Promise<CreateAgentRunResponseDto> {
    return this.request<CreateAgentRunResponseDto>(API_ENDPOINTS.AGENT.PERSIST_RUN(threadId), {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async archiveThread(threadId: string): Promise<void> {
    await this.requestOrNoContent<void>(API_ENDPOINTS.AGENT.ARCHIVE_THREAD(threadId), {
      method: "POST",
    });
  }
}

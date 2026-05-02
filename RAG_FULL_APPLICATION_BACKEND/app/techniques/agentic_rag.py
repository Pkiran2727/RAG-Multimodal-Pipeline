from .base import BaseRAGTechnique
from ..services.embed_service import get_embedding
from ..utils.json_utils import extract_json_block, repair_json
from typing import List, Dict, Any
import json

class AgenticRAG(BaseRAGTechnique):
    async def retrieve(self, query: str, document_id: str, top_k: int, **kwargs) -> List[Dict[str, Any]]:
        # This is the "agent loop"
        await self.emit("AGENT_INIT", "#22C55E", "Qwen3 agent ready with 4 tools")
        
        all_collected_chunks = []
        conversation_history = []
        
        system_prompt = f"""
You are an intelligent RAG agent. You have access to a document (ID: {document_id}).
Your goal is to answer the user query: "{query}"

Available tools:
1. search_docs(query: str, top_k: int) -> list of chunks
2. filter_search(filters: dict, query: str) -> list of chunks. filters can include "page" or "section".
3. get_page(page_num: int) -> text of that page
4. finish(answer: str) -> finish with final answer

Respond ONLY with a JSON object:
{{
    "thought": "your reasoning",
    "tool": "tool_name",
    "args": {{ ... }}
}}
"""
        
        for i in range(5): # Max 5 iterations
            await self.emit("PLAN", "#8B5CF6", f"Agent iteration {i+1}: Thinking...")
            
            agent_prompt = f"{system_prompt}\n\nHistory: {json.dumps(conversation_history)}\n\nAction:"
            response_text = self.llm.generate(agent_prompt)
            
            try:
                action_data = repair_json(extract_json_block(response_text))
                thought = action_data.get("thought", "")
                tool = action_data.get("tool", "")
                args = action_data.get("args", {})
                
                await self.emit("PLAN", "#8B5CF6", f"Thought: {thought[:100]}...")
                
                if tool == "finish":
                    self.final_agent_answer = args.get("answer", "")
                    break
                
                # Execute Tool
                await self.emit("TOOL", "#D97706", f"Tool call: {tool}({json.dumps(args)})")
                
                observation = ""
                if tool == "search_docs":
                    q = args.get("query", query)
                    tk = args.get("top_k", top_k)
                    q_vec = get_embedding(q)
                    results = await self.supabase.vector_search(q_vec, document_id, self.user_id, tk)
                    all_collected_chunks.extend(results)
                    observation = f"Found {len(results)} chunks."
                elif tool == "filter_search":
                    f = args.get("filters", {})
                    q = args.get("query", query)
                    matching_ids = await self.supabase.filter_chunk_ids(document_id, self.user_id, f)
                    if matching_ids:
                        q_vec = get_embedding(q)
                        results = await self.supabase.vector_search(q_vec, document_id, self.user_id, top_k, filter_chunk_ids=matching_ids)
                        all_collected_chunks.extend(results)
                        observation = f"Filtered search found {len(results)} chunks."
                    else:
                        observation = "No chunks matched the filters."
                elif tool == "get_page":
                    p = args.get("page_num")
                    results = await self.supabase.filter_chunk_ids(document_id, self.user_id, {"page": p})
                    if results:
                        chunks = await self.supabase.get_chunks_by_ids(results)
                        all_collected_chunks.extend(chunks)
                        observation = f"Retrieved page {p}."
                    else:
                        observation = f"Page {p} not found."
                
                await self.emit("OBSERVE", "#22C55E", observation)
                conversation_history.append({"action": action_data, "observation": observation})
                
            except Exception as e:
                logger.error(f"Agent error decoding JSON: {e}")
                conversation_history.append({"error": f"Invalid JSON response from your side. Use the required JSON format. error: {str(e)}"})

        await self.emit("FINAL", "#22C55E", "Answer generated after tool usage.")
        return all_collected_chunks

    async def generate(self, query: str, chunks: List[Dict[str, Any]]) -> str:
        # If the agent finished with a final answer, use it.
        if hasattr(self, "final_agent_answer") and self.final_agent_answer:
            return self.final_agent_answer
            
        await self.emit("GENERATE", "#7C3AED", "Qwen3 generating final summary...")
        context = "\n\n".join([c["text"] for c in chunks])
        prompt = f"Context:\n{context}\n\nQuestion: {query}\n\nAnswer based ONLY on the context:"
        return self.llm.generate(prompt)

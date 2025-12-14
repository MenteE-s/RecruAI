"""
AI Service module for handling AI-powered interviews.
Uses provider-agnostic AI system with support for OpenAI, Groq, and local models.
"""

import os
import json
from typing import Dict, List, Optional, Any
from datetime import datetime

from .ai_providers import get_ai_provider_manager


class AIService:
    """Base AI service class with provider-agnostic functionality"""

    def __init__(self):
        self.provider_manager = get_ai_provider_manager()
        self.llm_provider = self.provider_manager.llm

    def generate_response(self, system_prompt: str, user_message: str, conversation_history: Optional[List[Dict]] = None,
                        user: Optional['User'] = None, operation_type: str = "ai_chat") -> str:
        """
        Generate AI response for interview conversation

        Args:
            system_prompt: The system prompt defining the AI agent's role
            user_message: The current user message
            conversation_history: Previous conversation turns
            user: User object for subscription checking and token tracking
            operation_type: Type of operation for token tracking

        Returns:
            AI response as string
        """
        # Check subscription access
        if user:
            from backend.utils.subscription import SubscriptionManager
            if user.organization:
                if not SubscriptionManager.check_organization_access(user.organization, "ai_chat"):
                    return "Your organization's trial has expired or subscription is inactive. Please upgrade to continue using AI features."
            else:
                if not SubscriptionManager.check_user_access(user, "ai_chat"):
                    return "Your trial has expired or subscription is inactive. Please upgrade to continue using AI features."

        try:
            print(f"DEBUG: AI Service - Provider: {self.provider_manager.config.AI_PROVIDER}, Model: {self.provider_manager.config.AI_MODEL}")
            print(f"DEBUG: API Key loaded: {'Yes' if self._has_api_key() else 'No'}")

            messages = [{"role": "system", "content": system_prompt}]

            # Add conversation history if provided
            if conversation_history:
                messages.extend(conversation_history)

            # Add current user message
            messages.append({"role": "user", "content": user_message})

            # Use provider-agnostic chat
            response = self.llm_provider.chat(messages)

            # Track token usage if user provided
            if user and hasattr(self.llm_provider, 'get_last_token_usage'):
                token_usage = self.llm_provider.get_last_token_usage()
                if token_usage:
                    SubscriptionManager.track_token_usage(
                        user=user,
                        org=user.organization,
                        provider=self.provider_manager.config.AI_PROVIDER,
                        model=self.provider_manager.config.AI_MODEL,
                        tokens=token_usage,
                        operation_type=operation_type
                    )

            print(f"DEBUG: AI response length: {len(response)}")
            return response

        except Exception as e:
            print(f"AI service error: {str(e)}")
            import traceback
            traceback.print_exc()
            return "I apologize, but I'm having trouble processing your response right now. Could you please try again?"

    def _has_api_key(self) -> bool:
        """Check if the current provider has an API key configured"""
        provider = self.provider_manager.config.AI_PROVIDER
        if provider == "openai":
            return bool(self.provider_manager.config.OPENAI_API_KEY)
        elif provider == "groq":
            return bool(self.provider_manager.config.GROQ_API_KEY)
        return False


class InterviewAIService(AIService):
    """Specialized AI service for conducting interviews"""

    def __init__(self):
        super().__init__()

    def conduct_interview_round(self, agent_data: Dict, candidate_response: str, interview_context: Dict) -> Dict[str, Any]:
        """
        Conduct one round of the interview

        Args:
            agent_data: AI agent configuration data
            candidate_response: Candidate's response to previous question
            interview_context: Context about the interview (round number, previous questions, etc.)

        Returns:
            Dict containing AI response, next question, feedback, etc.
        """
        system_prompt = self._build_interview_system_prompt(agent_data, interview_context)

        ai_response = self.generate_response(system_prompt, candidate_response)

        # Parse the AI response to extract structured information
        parsed_response = self._parse_interview_response(ai_response)

        return {
            "ai_message": ai_response,
            "parsed_response": parsed_response,
            "timestamp": datetime.utcnow().isoformat()
        }

    def _build_interview_system_prompt(self, agent_data: Dict, interview_context: Dict) -> str:
        """Build the system prompt for interview AI agent"""
        base_prompt = agent_data.get("system_prompt", "")
        custom_instructions = agent_data.get("custom_instructions", "")
        industry = agent_data.get("industry", "")
        round_number = interview_context.get("round_number", 1)
        is_first_message = interview_context.get("is_first_message", False)

        system_prompt = f"""{base_prompt}

You are conducting an interview for a {industry} position.

ROUND {round_number} INSTRUCTIONS:
- This is ROUND {round_number} of the interview process
- You have access to the full conversation history from previous rounds
- Build upon previous discussions rather than repeating questions
- Ask progressively more challenging questions appropriate for Round {round_number}
- Reference previous answers when relevant to show continuity
- Evaluate the candidate's response based on their skills, experience, and fit
- Provide constructive feedback when appropriate
- Ask follow-up questions to dive deeper into their responses
- Maintain a professional and encouraging tone throughout
- Keep the candidate focused and on-topic - don't let them waste time or go off on tangents
- Be proactive in guiding the conversation toward productive areas

{"IMPORTANT: This is the START of Round 1. Begin with a professional greeting and introduce yourself, then ask your first question to begin the interview." if is_first_message and round_number == 1 else f"This is the continuation of Round {round_number}. Acknowledge the round progression and continue the interview naturally."}

{custom_instructions}

RESPONSE FORMAT:
Always structure your response to include:
1. Acknowledgment of their previous answer (if not first message)
2. Brief feedback or evaluation
3. Your next question or conclusion
4. Any additional notes for the interviewer

Remember to be fair, unbiased, and professional."""

        return system_prompt

    def _parse_interview_response(self, ai_response: str) -> Dict[str, Any]:
        """Parse AI response to extract structured information"""
        # This is a simple parser - in production, you might want more sophisticated parsing
        return {
            "response_type": "interview_question",
            "content": ai_response,
            "evaluation": "pending",  # Could be enhanced with AI evaluation
            "follow_up_needed": "?" in ai_response
        }


# Global instance for easy access
ai_service = InterviewAIService()


def get_ai_service() -> InterviewAIService:
    """Get the global AI service instance"""
    return ai_service


def switch_ai_provider(provider: str):
    """Switch AI provider globally (deprecated - use environment variables instead)"""
    import warnings
    warnings.warn("switch_ai_provider is deprecated. Use AI_PROVIDER environment variable instead.", DeprecationWarning)
    # This function is kept for backward compatibility but does nothing
    # Provider switching should be done via environment variables now


# Test function
def test_ai_connection():
    """Test the AI service connection"""
    try:
        print("DEBUG: Testing AI connection...")
        service = get_ai_service()
        provider_info = service.provider_manager.get_provider_info()
        print(f"DEBUG: Service initialized - LLM: {provider_info['llm_provider']}, Embedding: {provider_info['embedding_provider']}")

        test_prompt = "You are a helpful assistant. Respond with 'Hello, AI service is working!'"
        test_message = "Test message"

        print("DEBUG: Making test request...")
        response = service.generate_response(test_prompt, test_message)
        print(f"DEBUG: Test response: {response[:100]}...")
        return {"success": True, "response": response}
    except Exception as e:
        print(f"DEBUG: AI connection test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}
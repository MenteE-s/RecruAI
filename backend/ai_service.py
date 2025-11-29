"""
AI Service module for handling AI-powered interviews.
Supports both Groq and OpenAI with easy switching.
"""

import os
import json
from typing import Dict, List, Optional, Any
import requests
from datetime import datetime


class AIService:
    """Base AI service class with common functionality"""

    def __init__(self, provider: str = "groq"):
        self.provider = provider
        self._api_key = None
        self._base_url = None
        self._model = None

    @property
    def api_key(self):
        if self._api_key is None:
            self._api_key = self._get_api_key()
        return self._api_key

    @property
    def base_url(self):
        if self._base_url is None:
            self._base_url = self._get_base_url()
        return self._base_url

    @property
    def model(self):
        if self._model is None:
            self._model = self._get_model()
        return self._model

    def _get_api_key(self) -> str:
        """Get API key based on provider"""
        if self.provider == "groq":
            return os.getenv("GROQ_API_KEY", "")
        elif self.provider == "openai":
            return os.getenv("OPENAI_API_KEY", "")
        else:
            raise ValueError(f"Unsupported AI provider: {self.provider}")

    def _get_base_url(self) -> str:
        """Get base URL for API calls"""
        if self.provider == "groq":
            return "https://api.groq.com/openai/v1"
        elif self.provider == "openai":
            return "https://api.openai.com/v1"
        else:
            raise ValueError(f"Unsupported AI provider: {self.provider}")

    def _get_model(self) -> str:
        """Get model name based on provider"""
        # Check environment variable first
        env_model = os.getenv("AI_MODEL")
        if env_model:
            return env_model

        # Fallback to provider-specific defaults
        if self.provider == "groq":
            return "groq/compound"  # or other Groq models
        elif self.provider == "openai":
            return "gpt-4"  # or gpt-3.5-turbo
        else:
            raise ValueError(f"Unsupported AI provider: {self.provider}")

    def generate_response(self, system_prompt: str, user_message: str, conversation_history: Optional[List[Dict]] = None) -> str:
        """
        Generate AI response for interview conversation

        Args:
            system_prompt: The system prompt defining the AI agent's role
            user_message: The current user message
            conversation_history: Previous conversation turns

        Returns:
            AI response as string
        """
        try:
            print(f"DEBUG: AI Service - Provider: {self.provider}, Model: {self.model}")
            print(f"DEBUG: API Key loaded: {'Yes' if self.api_key else 'No'} (length: {len(self.api_key) if self.api_key else 0})")
            print(f"DEBUG: Base URL: {self.base_url}")

            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }

            messages = [{"role": "system", "content": system_prompt}]

            # Add conversation history if provided
            if conversation_history:
                messages.extend(conversation_history)

            # Add current user message
            messages.append({"role": "user", "content": user_message})

            payload = {
                "model": self.model,
                "messages": messages,
                "max_tokens": 1000,
                "temperature": 0.7,
            }

            print(f"DEBUG: Making request to {self.base_url}/chat/completions")
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=30
            )

            print(f"DEBUG: Response status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                ai_response = data["choices"][0]["message"]["content"]
                print(f"DEBUG: AI response length: {len(ai_response)}")
                return ai_response
            else:
                print(f"AI API error: {response.status_code} - {response.text}")
                return "I apologize, but I'm having trouble processing your response right now. Could you please try again?"

        except Exception as e:
            print(f"AI service error: {str(e)}")
            import traceback
            traceback.print_exc()
            return "I apologize, but I'm experiencing technical difficulties. Please try again in a moment."


class InterviewAIService(AIService):
    """Specialized AI service for conducting interviews"""

    def __init__(self, provider: str = "groq"):
        super().__init__(provider)

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

        system_prompt = f"""{base_prompt}

You are conducting an interview for a {industry} position.

ROUND {round_number} INSTRUCTIONS:
- Ask relevant, technical questions appropriate for the {industry} field
- Evaluate the candidate's response based on their skills, experience, and fit
- Provide constructive feedback when appropriate
- Ask follow-up questions to dive deeper into their responses
- Maintain a professional and encouraging tone throughout

{custom_instructions}

RESPONSE FORMAT:
Always structure your response to include:
1. Acknowledgment of their previous answer
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
ai_service = InterviewAIService(provider="groq")  # Change to "openai" when switching providers


def get_ai_service() -> InterviewAIService:
    """Get the global AI service instance"""
    return ai_service


def switch_ai_provider(provider: str):
    """Switch AI provider globally"""
    global ai_service
    ai_service = InterviewAIService(provider=provider)


# Test function
def test_ai_connection():
    """Test the AI service connection"""
    try:
        print("DEBUG: Testing AI connection...")
        service = get_ai_service()
        print(f"DEBUG: Service initialized - Provider: {service.provider}")

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
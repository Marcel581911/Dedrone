import httpx
import logging

from app.config import get_api_key, get_agent_name

logger = logging.getLogger("openclaw-poc")

OPENAI_URL = "https://api.openai.com/v1/chat/completions"
MODEL = "gpt-4o-mini"


async def chat(user_message: str) -> str:
    api_key = get_api_key()
    if not api_key:
        return "Error: GPT API key is not configured. Run onboard.sh to set it."

    agent_name = get_agent_name()
    system_prompt = (
        f"You are {agent_name}, a helpful AI assistant. "
        "Answer concisely and clearly."
    )

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        "max_tokens": 1024,
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(OPENAI_URL, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]
    except httpx.HTTPStatusError as exc:
        logger.error("OpenAI API returned status %s", exc.response.status_code)
        return f"Error: OpenAI API returned status {exc.response.status_code}."
    except httpx.RequestError as exc:
        logger.error("Network error contacting OpenAI: %s", exc)
        return "Error: could not reach OpenAI API. Check your network connection."
    except Exception as exc:
        logger.error("Unexpected error: %s", exc)
        return "Error: an unexpected error occurred."

# app/services/ai.py
# import random

# PROMPT_TEMPLATES = [
#     "What's the funniest thing that could happen if {topic} went wrong?",
#     "If {topic} had a theme song, what would the lyrics be?",
#     "Invent a ridiculous conspiracy theory about {topic}.",
#     "Describe {topic} as if you're writing a classified ad."
# ]

# def generate_question(topic: str | None = None) -> dict:
#     """
#     Simple creative question generator.
#     Replace this with real AI calls (OpenAI) later.
#     Returns a dict with id, text, and optional metadata.
#     """
#     if not topic:
#         topic = random.choice(["a potato", "office meetings", "time travel", "cats"])
#     template = random.choice(PROMPT_TEMPLATES)
#     text = template.format(topic=topic)
#     # ID could be UUID in prod; keep simple here
#     return {"id": random.randint(100000, 999999), "text": text}


# app/services/ai.py
import random
from google import genai
from core.config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)

EXAMPLE_QUESTIONS = [
    "What’s the weirdest law cats would pass if they ran the world?",
    "If elevators told jokes, what would be their favorite punchline?",
    "What would WiFi taste like if it were a food?",
]


def generate_question(topic: str | None = None) -> dict:
    prompt = prompt = f"""
        You are a party game question generator.
        Generate ONE funny, creative, SHORT question (max 20 words).
        Do NOT write an explanation. Just output the question.

        Here are examples of the style and length:
        - {EXAMPLE_QUESTIONS[0]}
        - {EXAMPLE_QUESTIONS[1]}
        - {EXAMPLE_QUESTIONS[2]}

        Topic: {topic or random.choice(["potatoes", "office meetings", "time travel", "cats"])}
        """

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        text = response.text.strip()
    except Exception as e:
        # fallback if Gemini fails
        text = f"What funny thing could happen with {topic}?"

    return {
        "id": random.randint(100000, 999999),  # TODO: use UUID in production
        "text": text,
    }

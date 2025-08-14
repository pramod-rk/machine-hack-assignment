# app/services/ai.py
import random

PROMPT_TEMPLATES = [
    "What's the funniest thing that could happen if {topic} went wrong?",
    "If {topic} had a theme song, what would the lyrics be?",
    "Invent a ridiculous conspiracy theory about {topic}.",
    "Describe {topic} as if you're writing a classified ad."
]

def generate_question(topic: str | None = None) -> dict:
    """
    Simple creative question generator.
    Replace this with real AI calls (OpenAI) later.
    Returns a dict with id, text, and optional metadata.
    """
    if not topic:
        topic = random.choice(["a potato", "office meetings", "time travel", "cats"])
    template = random.choice(PROMPT_TEMPLATES)
    text = template.format(topic=topic)
    # ID could be UUID in prod; keep simple here
    return {"id": random.randint(100000, 999999), "text": text}

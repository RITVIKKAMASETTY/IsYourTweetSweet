# from fastapi import FastAPI
# from pydantic import BaseModel
# from langchain_groq import ChatGroq
# from langchain.prompts import ChatPromptTemplate
# from dotenv import load_dotenv
# from typing import Optional
# from decider_agent import decide_external_context, DeciderInput  # your existing decider
# from tavily import verify_topic_relevance  # your existing search agent

# load_dotenv()

# app = FastAPI()

# class TweetInput(BaseModel):
#     tweet: str
#     userid: Optional[str] = None

# class EmotionOutput(BaseModel):
#     emotion: str
#     reasoning: str
#     confidence_level: float

# llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.3)

# sentiment_prompt = ChatPromptTemplate.from_template(
#     """
#      You are an objective sentiment analysis assistant. Return only JSON matching the required schema.
# You must NOT include extra commentary outside the JSON.

# Task:
# Given a tweet and optional external context, return:
# - emotion: a single-word emotion label followed by a suitable emoji (e.g., "joy 😄", "anger 😠", "sadness 😢", "neutral 😐").
# - reasoning: a detailed, structured explanation with these sub-sections (use headings in the reasoning text):
#   1) Summary decision — one sentence.
#   2) Evidence from tweet — quote the short phrases or tokens in the tweet that support the decision.
#   3) Linguistic cues — explain tone, punctuation, emoji, capitalization, modal verbs, negation, sarcasm signals, etc.
#   4) External context impact — if external context provided, explain whether it changed the emotional interpretation and how. If none, say "No external context used."
#   5) Confidence rationale — explain why the confidence is high/medium/low and what would change it.

# Confidence must be a float between 0.0 and 1.0.

#     Output format strictly as JSON with keys:
#     {{
#         "emotion": "<emotion_name_with_emoji>",
#         "reasoning": "<reason>",
#         "confidence_level": <float between 0 and 1>
#     }}

# EXAMPLES (must follow structure exactly):

# Example 1:
# Tweet: "I just got promoted!!! so happy 😭😭"
# External Context: None
# → emotion: "joy 😄"
# → reasoning: (provide 5-part breakdown as described)
# → confidence_level: 0.95

# Example 2:
# Tweet: "Scientists say X reduced by 50% — is that true?"
# External Context: "Relevant facts about X"
# → emotion: "neutral 😐"
# → reasoning: (show how factual content drives verification vs. emotion)
# → confidence_level: 0.80

# Now analyze.
# Tweet: "{tweet}"
# External Context: "{external_context}"

#     Output format strictly as JSON with keys:
#     {{
#         "emotion": "<emotion_name_with_emoji>",
#         "reasoning": "<reason>",
#         "confidence_level": <float between 0 and 1>
#     }}
#     """
# )


# @app.post("/analyze_tweet", response_model=EmotionOutput)
# async def analyze_tweet(tweet_data: TweetInput):
#     decider_input = DeciderInput(tweet=tweet_data.tweet)
#     decider_output = decide_external_context(decider_input)
#     external_context_summary = ""
#     if decider_output.needsExternalContext and decider_output.topics:
#         print("[INFO] External context required. Gathering info via Tavily...")
#         summaries = []
#         for topic in decider_output.topics:
#             result = verify_topic_relevance(topic)
#             summaries.append(result["summarized_articles"])
#         external_context_summary = "\n\n".join(summaries)
#     else:
#         print("[INFO] No external context required. Proceeding directly to sentiment analysis.")
#     formatted_prompt = sentiment_prompt.format_prompt(
#         tweet=tweet_data.tweet,
#         external_context=external_context_summary or "None"
#     )
#     response = llm.invoke(formatted_prompt.to_messages())
#     print(response)
#     import json
#     try:
#         result = json.loads(response.content)
#         emotion = result.get("emotion", "neutral 😐")
#         reasoning = result.get("reasoning", "No specific emotion detected.")
#         confidence = float(result.get("confidence_level", 0.75))
#     except Exception as e:
#         print("[ERROR] Parsing failed:", e)
#         emotion = "neutral 😐"
#         reasoning = "Model response could not be parsed properly."
#         confidence = 0.70

#     # STEP 5: Return structured response
#     return EmotionOutput(
#         emotion=emotion,
#         reasoning=reasoning,
#         confidence_level=confidence
#     )
# from fastapi import FastAPI
# from pydantic import BaseModel, Field
# from typing import Optional
# from langchain_groq import ChatGroq
# from langchain.prompts import ChatPromptTemplate
# from langchain.output_parsers import PydanticOutputParser
# from dotenv import load_dotenv

# from decider_agent import decide_external_context, DeciderInput  # your existing decider
# from tavily import verify_topic_relevance  # your existing search agent

# import json

# load_dotenv()

# app = FastAPI()

# # ---------------- INPUT / OUTPUT SCHEMAS ----------------
# class TweetInput(BaseModel):
#     tweet: str
#     userid: Optional[str] = None


# class EmotionOutput(BaseModel):
#     emotion: str
#     reasoning: str
#     confidence_level: float


# # --- Define a Pydantic schema for model output ---
# class EmotionAnalysis(BaseModel):
#     emotion: str = Field(..., description="Emotion name with emoji, e.g., 'joy 😄'")
#     reasoning: str = Field(
#         ...,
#         description="Detailed reasoning with summary, evidence, cues, context impact, and confidence rationale"
#     )
#     confidence_level: float = Field(..., ge=0.0, le=1.0)


# # ---------------- LLM + PARSER SETUP ----------------
# llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.2)

# # parser ensures structured response
# output_parser = PydanticOutputParser(pydantic_object=EmotionAnalysis)

# # get format instructions for the model
# format_instructions = output_parser.get_format_instructions()

# # ---------------- PROMPT TEMPLATE ----------------
# sentiment_prompt = ChatPromptTemplate.from_template(
#     """
# You are an objective sentiment analysis assistant.

# Your job:
# Analyze the given tweet and optional external context.
# Return a structured JSON output following the given schema.

# Each field should follow this logic:
# - emotion: one main emotion label with emoji (e.g., "joy 😄", "anger 😠", "neutral 😐").
# - reasoning: include **five structured sections**:
#   1) Summary decision
#   2) Evidence from tweet (quotes/phrases)
#   3) Linguistic cues (tone, punctuation, capitalization, sarcasm, etc.)
#   4) External context impact
#   5) Confidence rationale
# - confidence_level: float between 0.0 and 1.0 representing certainty.

# Tweet: "{tweet}"
# External Context: "{external_context}"

# {format_instructions}
# """
# )


# # ---------------- MAIN ENDPOINT ----------------
# @app.post("/analyze_tweet", response_model=EmotionOutput)
# async def analyze_tweet(tweet_data: TweetInput):
#     # STEP 1: Decide if external context is needed
#     decider_input = DeciderInput(tweet=tweet_data.tweet)
#     decider_output = decide_external_context(decider_input)

#     external_context_summary = ""
#     if decider_output.needsExternalContext and decider_output.topics:
#         print("[INFO] External context required. Gathering info via Tavily...")
#         summaries = []
#         for topic in decider_output.topics:
#             result = verify_topic_relevance(topic)
#             summaries.append(result["summarized_articles"])
#         external_context_summary = "\n\n".join(summaries)
#     else:
#         print("[INFO] No external context required. Proceeding directly to sentiment analysis.")
#         external_context_summary = "None"

#     # STEP 2: Format prompt using parser instructions
#     formatted_prompt = sentiment_prompt.format_prompt(
#         tweet=tweet_data.tweet,
#         external_context=external_context_summary,
#         format_instructions=format_instructions
#     )

#     # STEP 3: Get response from LLM
#     response = llm(formatted_prompt.to_messages())

#     # STEP 4: Parse structured response safely
#     try:
#         parsed_output: EmotionAnalysis = output_parser.parse(response.content)
#         emotion = parsed_output.emotion
#         reasoning = parsed_output.reasoning
#         confidence = parsed_output.confidence_level
#     except Exception as e:
#         print("[ERROR] Parsing failed:", e)
#         print("[DEBUG RAW OUTPUT]:", response.content)
#         # fallback
#         emotion = "neutral 😐"
#         reasoning = (
#             "The model failed to produce structured output. "
#             "Likely format mismatch between JSON schema and model response. "
#             "Falling back to neutral classification."
#         )
#         confidence = 0.65

#     # STEP 5: Return output
#     return EmotionOutput(
#         emotion=emotion,
#         reasoning=reasoning,
#         confidence_level=confidence
#     )
from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Optional
from langchain_groq import ChatGroq
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import PydanticOutputParser
from dotenv import load_dotenv
import sqlite3
import json

from decider_agent import decide_external_context, DeciderInput
from tavily import verify_topic_relevance

load_dotenv()

app = FastAPI()

# ---------------- DATABASE SETUP ----------------
DB_PATH = "users.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            summary TEXT DEFAULT ''
        )
    """)
    conn.commit()
    conn.close()

def get_user_summary(username: str) -> str:
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT summary FROM users WHERE username = ?", (username,))
    row = c.fetchone()
    if row:
        summary = row[0]
    else:
        # if not exists, create a new record
        c.execute("INSERT INTO users (username, summary) VALUES (?, ?)", (username, ""))
        conn.commit()
        summary = ""
    conn.close()
    return summary

def update_user_summary(username: str, new_summary: str):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("UPDATE users SET summary = ? WHERE username = ?", (new_summary, username))
    conn.commit()
    conn.close()

# Initialize DB on startup
init_db()


# ---------------- INPUT / OUTPUT SCHEMAS ----------------
class TweetInput(BaseModel):
    tweet: str
    userid: str


class EmotionOutput(BaseModel):
    emotion: str
    reasoning: str
    confidence_level: float


class EmotionAnalysis(BaseModel):
    emotion: str = Field(..., description="Emotion name with emoji, e.g., 'joy 😄'")
    reasoning: str = Field(
        ...,
        description="Detailed reasoning with summary, evidence, cues, context impact, and confidence rationale"
    )
    confidence_level: float = Field(..., ge=0.0, le=1.0)


# ---------------- LLM SETUP ----------------
llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.2)
output_parser = PydanticOutputParser(pydantic_object=EmotionAnalysis)
format_instructions = output_parser.get_format_instructions()


# ---------------- PROMPTS ----------------
sentiment_prompt = ChatPromptTemplate.from_template(
    """
    You are an objective sentiment analysis assistant.

    Your job:
    Analyze the given tweet and optional external context.
    Return a structured JSON output following the given schema.

    Each field should follow this logic:
    - emotion: one main emotion label with emoji (e.g., "joy 😄", "anger 😠", "neutral 😐").
    - reasoning: include **five structured sections**:
      1) Summary decision
      2) Evidence from tweet (quotes/phrases)
      3) Linguistic cues (tone, punctuation, capitalization, sarcasm, etc.)
      4) External context impact
      5) Confidence rationale
    - confidence_level: float between 0.0 and 1.0 representing certainty.

    Tweet: "{tweet}"
    External Context: "{external_context}"

    {format_instructions}
    """
)

# ---------- Summary Update Agent ----------
summary_update_prompt = ChatPromptTemplate.from_template(
    """
    You are a user memory update assistant.

    Each user has a running emotional summary that reflects their past emotions, tone, and behavioral context.
    Your task is to update this memory summary based on the latest tweet analysis.

    Existing Summary:
    {old_summary}

    New Tweet: {tweet}
    Emotion: {emotion}
    Reasoning: {reasoning}

    Update the summary concisely (2-3 sentences):
    - Keep it factual and behavioral.
    - Retain old summary context.
    - Integrate new emotional trends or patterns.
    - Make sure it sounds cumulative and coherent.

    Return ONLY the updated summary text.
    """
)


# ---------------- MAIN ENDPOINT ----------------
@app.post("/analyze_tweet", response_model=EmotionOutput)
async def analyze_tweet(tweet_data: TweetInput):
    # STEP 1: Fetch user summary
    user_summary = get_user_summary(tweet_data.userid)

    # STEP 2: Decide if external context is needed
    decider_input = DeciderInput(tweet=tweet_data.tweet, user_context=user_summary)
    decider_output = decide_external_context(decider_input)

    external_context_summary = ""
    if decider_output.needsExternalContext and decider_output.topics:
        print("[INFO] External context required. Gathering info via Tavily...")
        summaries = []
        for topic in decider_output.topics:
            result = verify_topic_relevance(topic)
            summaries.append(result["summarized_articles"])
        external_context_summary = "\n\n".join(summaries)
    else:
        print("[INFO] No external context required. Proceeding directly to sentiment analysis.")
        external_context_summary = "None"

    # STEP 3: Perform emotion analysis
    formatted_prompt = sentiment_prompt.format_prompt(
        tweet=tweet_data.tweet,
        external_context=external_context_summary,
        format_instructions=format_instructions
    )

    response = llm(formatted_prompt.to_messages())

    try:
        parsed_output: EmotionAnalysis = output_parser.parse(response.content)
    except Exception as e:
        print("[ERROR] Parsing failed:", e)
        parsed_output = EmotionAnalysis(
            emotion="neutral 😐",
            reasoning="The model failed to produce structured output. Fallback to neutral classification.",
            confidence_level=0.65
        )

    # STEP 4: Update user memory
    update_prompt = summary_update_prompt.format_prompt(
        old_summary=user_summary,
        tweet=tweet_data.tweet,
        emotion=parsed_output.emotion,
        reasoning=parsed_output.reasoning
    )
    update_response = llm(update_prompt.to_messages())
    new_summary = update_response.content.strip()

    update_user_summary(tweet_data.userid, new_summary)

    # STEP 5: Return EmotionOutput
    return EmotionOutput(
        emotion=parsed_output.emotion,
        reasoning=parsed_output.reasoning,
        confidence_level=parsed_output.confidence_level
    )

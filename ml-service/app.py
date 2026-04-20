import os
import torch
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import DistilBertTokenizerFast, DistilBertForSequenceClassification
from typing import List

# ── Config ────────────────────────────────────────────────────────────────────
MODEL_DIR = "./models/sentiment_model"
MAX_LEN   = 128
THRESHOLD = 0.3
DEVICE    = torch.device("cuda" if torch.cuda.is_available() else "cpu")

EMOTION_LABELS = [
    "admiration","amusement","anger","annoyance","approval","caring",
    "confusion","curiosity","desire","disappointment","disapproval",
    "disgust","embarrassment","excitement","fear","gratitude","grief",
    "joy","love","nervousness","optimism","pride","realization",
    "relief","remorse","sadness","surprise","neutral"
]

# ── Load model at startup ─────────────────────────────────────────────────────
app = FastAPI(title="SentimentIQ ML Service", version="1.0.0")

tokenizer = None
model     = None


@app.on_event("startup")
def load_model():
    global tokenizer, model
    if not os.path.exists(MODEL_DIR):
        print(f"WARNING: No trained model found at {MODEL_DIR}.")
        print("Run train.py first, or the /predict endpoint will return an error.")
        return
    print(f"Loading model from {MODEL_DIR}...")
    tokenizer = DistilBertTokenizerFast.from_pretrained(MODEL_DIR)
    model     = DistilBertForSequenceClassification.from_pretrained(MODEL_DIR)
    model.to(DEVICE)
    model.eval()
    print("Model loaded successfully.")


# ── Schemas ───────────────────────────────────────────────────────────────────
class PredictRequest(BaseModel):
    text: str


class EmotionScore(BaseModel):
    emotion: str
    score:   float


class PredictResponse(BaseModel):
    text:      str
    sentiment: str
    confidence: float
    emotions:  List[EmotionScore]


class BatchRequest(BaseModel):
    texts: List[str]


# ── Helpers ───────────────────────────────────────────────────────────────────
def get_sentiment(emotions: List[EmotionScore]) -> tuple:
    """Derive overall sentiment from emotion scores."""
    positive = ["admiration","amusement","approval","caring","excitement",
                "gratitude","joy","love","optimism","pride","relief"]
    negative = ["anger","annoyance","disappointment","disapproval","disgust",
                "embarrassment","fear","grief","nervousness","remorse","sadness"]

    pos_score = sum(e.score for e in emotions if e.emotion in positive)
    neg_score = sum(e.score for e in emotions if e.emotion in negative)

    if pos_score > neg_score:
        return "POSITIVE", round(pos_score / (pos_score + neg_score + 1e-9), 3)
    elif neg_score > pos_score:
        return "NEGATIVE", round(neg_score / (pos_score + neg_score + 1e-9), 3)
    else:
        return "NEUTRAL", 0.5


def run_inference(text: str) -> PredictResponse:
    if model is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Run train.py first."
        )
    encoding = tokenizer(
        text,
        truncation=True,
        padding="max_length",
        max_length=MAX_LEN,
        return_tensors="pt"
    )
    input_ids      = encoding["input_ids"].to(DEVICE)
    attention_mask = encoding["attention_mask"].to(DEVICE)

    with torch.no_grad():
        outputs = model(input_ids=input_ids, attention_mask=attention_mask)
        probs   = torch.sigmoid(outputs.logits).cpu().numpy()[0]

    emotions = [
        EmotionScore(emotion=label, score=round(float(score), 4))
        for label, score in zip(EMOTION_LABELS, probs)
    ]
    emotions.sort(key=lambda x: x.score, reverse=True)

    sentiment, confidence = get_sentiment(emotions)

    return PredictResponse(
        text=text,
        sentiment=sentiment,
        confidence=confidence,
        emotions=emotions
    )


# ── Endpoints ─────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "device": str(DEVICE)
    }


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    return run_inference(req.text)


@app.post("/predict/batch")
def predict_batch(req: BatchRequest):
    if len(req.texts) > 50:
        raise HTTPException(status_code=400, detail="Max 50 texts per batch.")
    return [run_inference(t) for t in req.texts]


@app.get("/labels")
def get_labels():
    return {"labels": EMOTION_LABELS, "count": len(EMOTION_LABELS)}
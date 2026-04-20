import os
import numpy as np
import mlflow
import mlflow.pytorch
import torch
from torch.utils.data import Dataset, DataLoader
from transformers import (
    DistilBertTokenizerFast,
    DistilBertForSequenceClassification,
    get_linear_schedule_with_warmup
)
from torch.optim import AdamW
from sklearn.metrics import f1_score, accuracy_score
from datasets import load_dataset

# ── Config ────────────────────────────────────────────────────────────────────
MODEL_NAME      = "distilbert-base-uncased"
OUTPUT_DIR      = "./models/sentiment_model"
MLFLOW_DIR      = "./mlflow_tracking"
MAX_LEN         = 128
BATCH_SIZE      = 16
EPOCHS          = 3
LEARNING_RATE   = 2e-5
DEVICE          = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# GoEmotions has 28 emotion labels
EMOTION_LABELS = [
    "admiration","amusement","anger","annoyance","approval","caring",
    "confusion","curiosity","desire","disappointment","disapproval",
    "disgust","embarrassment","excitement","fear","gratitude","grief",
    "joy","love","nervousness","optimism","pride","realization",
    "relief","remorse","sadness","surprise","neutral"
]
NUM_LABELS = len(EMOTION_LABELS)


# ── Dataset class ─────────────────────────────────────────────────────────────
class EmotionDataset(Dataset):
    def __init__(self, texts, labels, tokenizer):
        self.encodings = tokenizer(
            texts,
            truncation=True,
            padding="max_length",
            max_length=MAX_LEN,
            return_tensors="pt"
        )
        self.labels = torch.tensor(labels, dtype=torch.float32)

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        return {
            "input_ids":      self.encodings["input_ids"][idx],
            "attention_mask": self.encodings["attention_mask"][idx],
            "labels":         self.labels[idx]
        }


# ── Helpers ───────────────────────────────────────────────────────────────────
def encode_labels(example):
    """Convert GoEmotions label list to a multi-hot vector."""
    vec = [0.0] * NUM_LABELS
    for idx in example["labels"]:
        if idx < NUM_LABELS:
            vec[idx] = 1.0
    return vec


def compute_metrics(preds, targets, threshold=0.5):
    preds_bin  = (np.array(preds)   > threshold).astype(int)
    targets_bin = np.array(targets).astype(int)
    f1  = f1_score(targets_bin, preds_bin, average="micro", zero_division=0)
    acc = accuracy_score(targets_bin, preds_bin)
    return {"f1": round(f1, 4), "accuracy": round(acc, 4)}


# ── Training loop ─────────────────────────────────────────────────────────────
def train():
    print(f"Using device: {DEVICE}")
    print("Loading GoEmotions dataset...")

    # Load dataset from HuggingFace Hub
    raw = load_dataset("google-research-datasets/go_emotions", "simplified")
    train_data = raw["train"]
    val_data   = raw["validation"]

    train_texts  = train_data["text"]
    train_labels = [encode_labels(e) for e in train_data]
    val_texts    = val_data["text"]
    val_labels   = [encode_labels(e) for e in val_data]

    print(f"Train samples: {len(train_texts)} | Val samples: {len(val_texts)}")

    # Tokenizer + model
    tokenizer = DistilBertTokenizerFast.from_pretrained(MODEL_NAME)
    model     = DistilBertForSequenceClassification.from_pretrained(
        MODEL_NAME,
        num_labels=NUM_LABELS,
        problem_type="multi_label_classification"
    ).to(DEVICE)

    # Datasets + loaders
    train_dataset = EmotionDataset(train_texts, train_labels, tokenizer)
    val_dataset   = EmotionDataset(val_texts,   val_labels,   tokenizer)
    train_loader  = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
    val_loader    = DataLoader(val_dataset,   batch_size=BATCH_SIZE)

    # Optimiser + scheduler
    optimizer = AdamW(model.parameters(), lr=LEARNING_RATE, weight_decay=0.01)
    total_steps = len(train_loader) * EPOCHS
    scheduler = get_linear_schedule_with_warmup(
        optimizer,
        num_warmup_steps=total_steps // 10,
        num_training_steps=total_steps
    )

    # MLflow experiment
    mlflow.set_tracking_uri(f"file:///{os.path.abspath(MLFLOW_DIR)}")
    mlflow.set_experiment("sentimentiq-distilbert")

    with mlflow.start_run():
        mlflow.log_params({
            "model":         MODEL_NAME,
            "epochs":        EPOCHS,
            "batch_size":    BATCH_SIZE,
            "learning_rate": LEARNING_RATE,
            "max_len":       MAX_LEN,
            "num_labels":    NUM_LABELS
        })

        best_f1 = 0.0

        for epoch in range(EPOCHS):
            # ── Train ──────────────────────────────────────────────────────
            model.train()
            total_loss = 0.0

            for step, batch in enumerate(train_loader):
                input_ids      = batch["input_ids"].to(DEVICE)
                attention_mask = batch["attention_mask"].to(DEVICE)
                labels         = batch["labels"].to(DEVICE)

                outputs = model(
                    input_ids=input_ids,
                    attention_mask=attention_mask,
                    labels=labels
                )
                loss = outputs.loss
                total_loss += loss.item()

                loss.backward()
                torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
                optimizer.step()
                scheduler.step()
                optimizer.zero_grad()

                if step % 100 == 0:
                    print(f"  Epoch {epoch+1} | Step {step}/{len(train_loader)} "
                          f"| Loss: {loss.item():.4f}")

            avg_loss = total_loss / len(train_loader)

            # ── Validate ───────────────────────────────────────────────────
            model.eval()
            all_preds, all_labels = [], []

            with torch.no_grad():
                for batch in val_loader:
                    input_ids      = batch["input_ids"].to(DEVICE)
                    attention_mask = batch["attention_mask"].to(DEVICE)
                    outputs = model(input_ids=input_ids,
                                    attention_mask=attention_mask)
                    probs = torch.sigmoid(outputs.logits).cpu().numpy()
                    all_preds.extend(probs.tolist())
                    all_labels.extend(batch["labels"].numpy().tolist())

            metrics = compute_metrics(all_preds, all_labels)

            print(f"\nEpoch {epoch+1}/{EPOCHS} | "
                  f"Loss: {avg_loss:.4f} | "
                  f"F1: {metrics['f1']} | "
                  f"Acc: {metrics['accuracy']}\n")

            mlflow.log_metrics({
                "train_loss": round(avg_loss, 4),
                "val_f1":     metrics["f1"],
                "val_acc":    metrics["accuracy"]
            }, step=epoch)

            # Save best model
            if metrics["f1"] > best_f1:
                best_f1 = metrics["f1"]
                model.save_pretrained(OUTPUT_DIR)
                tokenizer.save_pretrained(OUTPUT_DIR)
                print(f"  New best model saved (F1: {best_f1})")

        mlflow.log_metric("best_f1", best_f1)
        mlflow.log_artifact(OUTPUT_DIR)
        print(f"\nTraining complete. Best F1: {best_f1}")
        print(f"Model saved to: {OUTPUT_DIR}")


if __name__ == "__main__":
    train()
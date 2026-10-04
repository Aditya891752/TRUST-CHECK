"""
Local Machine Learning Inference Engine for TrustCheck.
Loads the fine-tuned DeBERTa model trained on Colab (trustcheck_trained_model)
to verify claim-evidence pairs locally without external API calls.
"""

import os
from pathlib import Path
from typing import Dict, Any, Optional

MODEL_DIR = Path(__file__).resolve().parent.parent / "models" / "trustcheck_trained_model"

class LocalMLVerifier:
    _instance = None
    _model = None
    _tokenizer = None
    _is_available = False

    def __init__(self):
        self.load_model()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = LocalMLVerifier()
        return cls._instance

    def load_model(self):
        if not MODEL_DIR.exists() or not (MODEL_DIR / "model.safetensors").exists():
            self._is_available = False
            return

        try:
            from transformers import AutoTokenizer, AutoModelForSequenceClassification
            import torch

            self._tokenizer = AutoTokenizer.from_pretrained(str(MODEL_DIR))
            self._model = AutoModelForSequenceClassification.from_pretrained(str(MODEL_DIR))
            self._model.eval()
            self._is_available = True
        except Exception:
            self._is_available = False

    @property
    def is_available(self) -> bool:
        return self._is_available

    def predict(self, claim: str, evidence: str) -> Dict[str, Any]:
        """
        Classifies a (claim, evidence) pair into:
        - supported
        - uncertain
        - unsupported
        with confidence scores.
        """
        if not self._is_available:
            return {"verdict": "uncertain", "confidence": 0.0, "reasoning": "Local ML model not loaded."}

        try:
            import torch

            inputs = self._tokenizer(
                claim,
                evidence,
                return_tensors="pt",
                truncation=True,
                padding=True,
                max_length=256
            )
            with torch.no_grad():
                outputs = self._model(**inputs)
                probs = torch.softmax(outputs.logits, dim=1)
                pred_idx = torch.argmax(probs, dim=1).item()

            label_map = {0: "supported", 1: "uncertain", 2: "unsupported"}
            verdict = label_map.get(pred_idx, "uncertain")
            confidence = float(probs[0][pred_idx].item())

            reasoning = f"Fine-tuned DeBERTa NLI classified as {verdict} ({confidence:.1%} confidence)."
            return {
                "verdict": verdict,
                "confidence": confidence,
                "reasoning": reasoning
            }
        except Exception as e:
            return {
                "verdict": "uncertain",
                "confidence": 0.0,
                "reasoning": f"Local inference error: {str(e)}"
            }

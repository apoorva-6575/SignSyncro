"""
Configuration settings for Sign Language & Emotion Recognition System
"""
import os

# Base paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, 'models')
os.makedirs(MODELS_DIR, exist_ok=True)

# Video settings
CAMERA_INDEX = 0
FRAME_WIDTH = 640
FRAME_HEIGHT = 480
TARGET_FPS = 30

# Emotion Recognition settings
EMOTION_INTERVAL_FRAMES = 15  # Run DeepFace every N frames to maintain high streaming FPS
EMOTION_SMOOTHING_WINDOW = 10  # Number of predictions for majority voting
EMOTION_CONFIDENCE_THRESHOLD = 0.40

# Gesture Recognition settings
GESTURE_CONFIDENCE_THRESHOLD = 0.65
GESTURE_SMOOTHING_WINDOW = 8  # Majority voting buffer length
GESTURE_HOLD_CONFIRM_SECONDS = 0.8  # Must hold sign stably before triggering voice

# Target Vocabulary
TARGET_SIGNS = ["HELLO", "HELP", "WATER", "FOOD", "PAIN"]
DEFAULT_GESTURE = "NO_GESTURE"

# Multimodal Fusion Context Templates
# Maps (GESTURE, DOMINANT_EMOTION) -> contextual assistive sentence
FUSION_PHRASES = {
    ("HELLO", "happy"): "Hello! I am happy to see you.",
    ("HELLO", "neutral"): "Hello there.",
    ("HELLO", "sad"): "Hello, I am feeling a bit down.",
    
    ("HELP", "sad"): "Please help me, I am feeling sad and overwhelmed.",
    ("HELP", "fear"): "Urgent! I need help, I am scared.",
    ("HELP", "angry"): "I need help right now, I am frustrated.",
    ("HELP", "neutral"): "I need assistance, please.",
    ("HELP", "happy"): "Could you please help me with this?",
    
    ("WATER", "sad"): "I am very thirsty, can I please have some water?",
    ("WATER", "neutral"): "I would like some water, please.",
    ("WATER", "happy"): "I'd like a drink of water, thank you!",
    
    ("FOOD", "sad"): "I am hungry and need something to eat.",
    ("FOOD", "neutral"): "I would like food, please.",
    ("FOOD", "happy"): "I am hungry and ready for food!",
    
    ("PAIN", "sad"): "Alert! I am in pain and crying, please help me.",
    ("PAIN", "fear"): "Alert! I am in pain and afraid.",
    ("PAIN", "angry"): "Alert! It hurts very much, please check.",
    ("PAIN", "neutral"): "I am experiencing pain here.",
}

DEFAULT_FALLBACK_PHRASES = {
    "HELLO": "Hello.",
    "HELP": "I need help, please.",
    "WATER": "I need water, please.",
    "FOOD": "I want food, please.",
    "PAIN": "Alert: I am feeling pain.",
}

# Emotion color theme (hex codes for UI badges)
EMOTION_COLORS = {
    "happy": "#10b981",    # Emerald
    "sad": "#3b82f6",      # Sky blue
    "neutral": "#64748b",  # Slate gray
    "angry": "#ef4444",    # Crimson red
    "fear": "#a855f7",     # Purple
    "surprise": "#f59e0b", # Amber
    "disgust": "#14b8a6"   # Teal
}

"""
Multimodal Fusion Module
Dynamically pairs detected Sign and Emotion into real-time assistive communication
"""
import time
import config

class MultimodalFusion:
    def __init__(self):
        self.last_spoken_phrase = None
        self.last_spoken_time = 0
        self.cooldown_seconds = 2.5
        self.history = []
        self.max_history = 20

    def fuse(self, gesture: str, emotion: str, gesture_conf: float = 0.0, emotion_conf: float = 0.0):
        if not gesture or gesture == config.DEFAULT_GESTURE:
            return {
                "gesture": config.DEFAULT_GESTURE,
                "gesture_conf": 0.0,
                "emotion": str(emotion or "neutral"),
                "emotion_conf": float(emotion_conf or 0.5),
                "phrase": None,
                "is_priority": False,
                "should_speak": False,
                "timestamp": time.strftime("%H:%M:%S")
            }

        emo = (emotion or "neutral").lower()
        is_priority = gesture in ["HELP", "PAIN"] or emo in ["fear", "angry"]

        # Dynamic sentence generation based on detected gesture and emotional context
        if gesture == "HELLO":
            if emo == "happy":
                phrase = "Hello! So happy to see you."
            elif emo == "sad":
                phrase = "Hello... I am feeling sad today."
            elif emo == "angry":
                phrase = "Hello, I am feeling upset."
            elif emo == "surprise":
                phrase = "Hello! Wow, what a surprise!"
            else:
                phrase = "Hello!"
        elif gesture == "HELP":
            if emo in ["angry", "fear", "sad"]:
                phrase = f"Help needed urgently! I am feeling {emo}."
            else:
                phrase = "I need assistance."
        elif gesture == "WATER":
            phrase = "Please, I really need water." if emo in ["sad", "fear"] else "I need water."
        elif gesture == "FOOD":
            phrase = "Please, I am hungry and need food." if emo in ["sad", "angry"] else "I want food."
        elif gesture == "PAIN":
            phrase = "I am in severe pain!" if is_priority else "I am feeling pain."
        elif gesture == "STOP":
            phrase = "Please stop right now!" if is_priority else "Stop."
        elif gesture == "GOOD/OK":
            phrase = "Everything is great!" if emo == "happy" else "I am okay."
        elif gesture == "BAD":
            phrase = "This is not good, I am sad." if emo == "sad" else "This is bad."
        elif gesture == "LOVE":
            phrase = "I love you with all my heart!" if emo == "happy" else "I love you."
        elif gesture == "PEACE":
            phrase = "Peace and calm."
        elif gesture == "MORE":
            phrase = "I would like more please."
        elif gesture == "YES":
            phrase = "Yes, absolutely!" if emo == "happy" else "Yes."
        elif gesture == "NO":
            phrase = "No, please don't." if emo in ["sad", "angry", "fear"] else "No."
        else:
            phrase = f"{gesture.capitalize()}"

        # Throttle voice output
        current_time = time.time()
        should_speak = False
        if phrase != self.last_spoken_phrase or (current_time - self.last_spoken_time) > self.cooldown_seconds:
            should_speak = True
            self.last_spoken_phrase = phrase
            self.last_spoken_time = current_time
            
            self.history.insert(0, {
                "time": time.strftime("%H:%M:%S"),
                "gesture": str(gesture),
                "emotion": str(emotion),
                "phrase": str(phrase),
                "priority": bool(is_priority)
            })
            if len(self.history) > self.max_history:
                self.history.pop()

        return {
            "gesture": str(gesture),
            "gesture_conf": float(round(gesture_conf, 2)),
            "emotion": str(emotion),
            "emotion_conf": float(round(emotion_conf, 2)),
            "phrase": str(phrase),
            "is_priority": bool(is_priority),
            "should_speak": bool(should_speak),
            "timestamp": time.strftime("%H:%M:%S")
        }

    def get_history(self):
        return self.history

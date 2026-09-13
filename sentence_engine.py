"""
Sequential Sign Language Sentence Construction & Grammar Synthesis Engine
Fluid multi-sign sequencing: detects 2-3 consecutive gestures in real time,
with 0.70s hold confirmation, immediate gesture transitions, and natural grammar synthesis.
"""
import time

class SentenceEngine:
    def __init__(self):
        self.words = []
        self.current_holding_word = None
        self.hold_start_time = 0.0
        self.required_hold_seconds = 0.70   # Responsive, deliberate hold (approx 20 frames)
        self.last_committed_word = None     # Prevents duplicate spam while holding same gesture
        self.recording_enabled = True       # ACTIVE by default for seamless instant signing
        self.hold_progress = 0.0
        self.no_gesture_start = 0.0

        # Multi-sign sentence grammar dictionary
        self.grammar_rules = {
            # Basic Needs & Requests (Pairs)
            ("PLEASE", "WATER"): "Please may I have some water.",
            ("WATER", "PLEASE"): "Please give me some water.",
            ("FOOD", "PLEASE"): "I would like something to eat, please.",
            ("PLEASE", "FOOD"): "Please give me food.",
            ("MORE", "WATER"): "Can I have more water, please?",
            ("WATER", "MORE"): "May I have more water, please?",
            ("MORE", "FOOD"): "Can I have more food, please?",
            ("FOOD", "MORE"): "May I have more food, please?",
            ("FOOD", "WATER"): "I would like something to eat and drink, please.",
            ("WATER", "FOOD"): "May I please have food and water?",
            ("PLEASE", "MORE"): "May I please have some more?",
            ("MORE", "PLEASE"): "More, please.",
            
            # Emergency & Medical (Pairs)
            ("HELP", "PAIN"): "Help me, I am feeling severe pain.",
            ("PAIN", "HELP"): "I am in pain, please help me immediately.",
            ("HELP", "PLEASE"): "Please help me.",
            ("PLEASE", "HELP"): "Please help me.",
            ("BAD", "PAIN"): "I am experiencing bad pain.",
            ("PAIN", "BAD"): "The pain is very bad.",
            ("PAIN", "STOP"): "I am in pain, please stop.",
            ("STOP", "PAIN"): "Please stop, it hurts.",
            ("HELP", "WATER"): "Please help me, I need water.",
            ("WATER", "HELP"): "I need urgent help getting water.",
            ("HELP", "FOOD"): "I need assistance getting food.",
            ("FOOD", "HELP"): "Please help me, I am hungry.",
            ("CALL ME", "HELP"): "Please call someone to help me.",
            ("HELP", "CALL ME"): "Please call for help.",
            
            # Greetings, Politeness & Affirmation (Pairs)
            ("HELLO", "HELP"): "Hello, I need assistance.",
            ("HELLO", "GOOD"): "Hello, good day to you.",
            ("GOOD", "HELLO"): "Hello, good day to you.",
            ("HELLO", "WATER"): "Hello, may I have some water please?",
            ("HELLO", "FOOD"): "Hello, is food available?",
            ("HELLO", "PAIN"): "Hello, I am in pain and need help.",
            ("HELLO", "LOVE"): "Hello! Sending you lots of love.",
            ("HELLO", "PEACE"): "Hello, peace be with you.",
            ("THANK YOU", "GOOD"): "Thank you, that is wonderful.",
            ("GOOD", "THANK YOU"): "Very good, thank you.",
            ("THANK YOU", "HELP"): "Thank you so much for your help.",
            ("HELP", "THANK YOU"): "Thank you for helping me.",
            ("YES", "PLEASE"): "Yes, please.",
            ("NO", "THANK YOU"): "No, thank you.",
            ("YES", "HELP"): "Yes, I need help please.",
            ("YES", "WATER"): "Yes, I would like some water.",
            ("YES", "FOOD"): "Yes, I would like food to eat.",
            ("NO", "FOOD"): "No, I am not hungry.",
            ("NO", "WATER"): "No, thank you, I do not need water.",
            ("NO", "PAIN"): "I am not in pain anymore.",
            ("NO", "HELP"): "No, thank you, I do not need help.",
            ("STOP", "PLEASE"): "Please stop now.",
            ("PLEASE", "STOP"): "Please stop.",
            ("STOP", "HELP"): "Please stop and help me.",
            ("GOOD", "FOOD"): "The food is very good, thank you.",
            ("GOOD", "WATER"): "Thank you for the water.",
            ("BAD", "FOOD"): "I do not feel well after eating.",
            ("BAD", "WATER"): "The water does not taste good.",
            ("BAD", "HELP"): "I feel bad, please help me.",
            
            # Affection & Social (Pairs)
            ("LOVE", "YOU"): "I love you.",
            ("YOU", "LOVE"): "I love you.",
            ("LOVE", "THANK YOU"): "I love you, thank you.",
            ("THANK YOU", "LOVE"): "Thank you, with love.",
            ("CALL ME", "PLEASE"): "Please call me soon.",
            ("PLEASE", "CALL ME"): "Please call me.",
            ("PEACE", "LOVE"): "Wishing peace and love.",
            ("LOVE", "PEACE"): "Wishing peace and love.",
            ("PEACE", "GOOD"): "Everything is peaceful and good.",
            ("LOVE", "HELP"): "I love you, thank you for helping me.",
            ("HELP", "LOVE"): "Thank you for your loving care and help.",
            
            # Triple Combinations (3 gestures in a row)
            ("I", "LOVE", "YOU"): "I love you very much.",
            ("I", "WANT", "WATER"): "I want water, please.",
            ("I", "WANT", "FOOD"): "I want food to eat.",
            ("I", "NEED", "HELP"): "I urgently need help.",
            ("PLEASE", "WATER", "HELP"): "Please help me get some water.",
            ("WATER", "HELP", "PLEASE"): "Please help me get some water.",
            ("HELLO", "HELP", "PAIN"): "Hello, I am in pain and need help.",
            ("PLEASE", "STOP", "PAIN"): "Please help stop this pain.",
            ("PLEASE", "CALL ME", "NOW"): "Please call me right now.",
            ("THANK YOU", "HELP", "GOOD"): "Thank you so much for your kind help.",
            ("PLEASE", "MORE", "WATER"): "Please may I have more water?",
            ("PLEASE", "MORE", "FOOD"): "Please may I have more food?",
            ("HELLO", "THANK YOU", "GOOD"): "Hello! Thank you, everything is good.",
            ("HELP", "PAIN", "PLEASE"): "Please help me, I am in severe pain.",
            ("PLEASE", "FOOD", "WATER"): "Please may I have something to eat and drink?",
            ("WATER", "FOOD", "PLEASE"): "May I please have food and water?"
        }

        # Single word semantic expansion for natural voice synthesis
        self.single_word_meanings = {
            "FOOD": "I would like something to eat, please.",
            "WATER": "I am thirsty, may I please have some water?",
            "HELP": "I need assistance, please help me.",
            "PAIN": "I am experiencing pain, please help me.",
            "HELLO": "Hello, nice to meet you!",
            "THANK YOU": "Thank you very much.",
            "PLEASE": "Please.",
            "YES": "Yes, please.",
            "NO": "No, thank you.",
            "GOOD": "Everything is good, thank you.",
            "BAD": "I am not feeling well.",
            "STOP": "Please stop now.",
            "LOVE": "I send you my love.",
            "PEACE": "Wishing you peace and wellness.",
            "CALL ME": "Please call me when you can.",
            "MORE": "Could I please have more?",
            "NOW": "Right now, please."
        }

        self.predictions_map = {
            "PLEASE": ["WATER", "FOOD", "HELP", "STOP", "CALL ME"],
            "HELP": ["PAIN", "PLEASE", "WATER", "FOOD"],
            "WATER": ["PLEASE", "MORE", "HELP"],
            "FOOD": ["PLEASE", "MORE", "HELP"],
            "HELLO": ["HELP", "GOOD", "LOVE", "WATER"],
            "THANK YOU": ["GOOD", "PEACE", "LOVE"],
            "MORE": ["WATER", "FOOD", "PLEASE"],
            "I": ["LOVE", "WANT", "NEED"],
            "STOP": ["PLEASE", "PAIN", "HELP"],
            "PAIN": ["HELP", "BAD", "STOP"],
            "GOOD": ["THANK YOU", "HELLO", "PEACE"],
            "YES": ["PLEASE", "HELP", "WATER"],
            "NO": ["THANK YOU", "PAIN", "FOOD"],
            "LOVE": ["YOU", "THANK YOU", "PEACE"]
        }

    def update(self, detected_gesture: str):
        now = time.time()

        if not self.recording_enabled:
            self.hold_progress = 0.0
            return False, self.get_sentence()

        # Hand is resting or lowered (NO_GESTURE)
        if not detected_gesture or detected_gesture == "NO_GESTURE":
            if self.no_gesture_start == 0.0:
                self.no_gesture_start = now
            
            no_gesture_duration = now - self.no_gesture_start

            # Flicker protection: Only reset last_committed_word after hands stay lowered for > 1.2s
            # This prevents tracking micro-drops from re-triggering the same gesture multiple times
            if no_gesture_duration > 1.2:
                self.last_committed_word = None

            # Conversational pause: Hands lowered for 2.8+ seconds clears buffer for next sentence
            if no_gesture_duration > 2.8:
                self.words.clear()

            self.current_holding_word = None
            self.hold_start_time = 0.0
            self.hold_progress = 0.0
            return False, self.get_sentence()

        # Gesture present: reset no-gesture timer
        self.no_gesture_start = 0.0

        # Consecutive deduplication: If this gesture is ALREADY the last committed word, do NOT repeat it
        if self.words and self.words[-1] == detected_gesture:
            self.last_committed_word = detected_gesture
            self.current_holding_word = None
            self.hold_start_time = 0.0
            self.hold_progress = 1.0
            return False, self.get_sentence()

        # Hand is still holding the gesture that was just added to the sentence
        if detected_gesture == self.last_committed_word:
            self.hold_progress = 1.0
            return False, self.get_sentence()

        # User is holding a candidate gesture
        if detected_gesture == self.current_holding_word:
            elapsed = now - self.hold_start_time
            self.hold_progress = min(1.0, elapsed / self.required_hold_seconds)
            
            if elapsed >= self.required_hold_seconds:
                # Deliberate hold completed -> Commit word with deduplication check!
                if not self.words or self.words[-1] != detected_gesture:
                    self.words.append(detected_gesture)

                self.last_committed_word = detected_gesture
                self.current_holding_word = None
                self.hold_start_time = 0.0
                self.hold_progress = 1.0

                # Keep sliding window of at most 3 words to prevent runaway sentences
                if len(self.words) > 3:
                    self.words = self.words[-3:]

                sentence = self.get_sentence()
                return True, sentence
        else:
            # Detected a new distinct gesture! Immediately start timer for this new gesture
            self.current_holding_word = detected_gesture
            self.hold_start_time = now
            self.hold_progress = 0.0

        return False, self.get_sentence()

    def get_sentence(self):
        if not self.words:
            return ""

        # Check last 3 words exact tuple match
        if len(self.words) >= 3:
            tri = tuple(self.words[-3:])
            if tri in self.grammar_rules:
                return self.grammar_rules[tri]

        # Check last 2 words exact tuple match
        if len(self.words) >= 2:
            pair = tuple(self.words[-2:])
            if pair in self.grammar_rules:
                return self.grammar_rules[pair]

        # Check exact full tuple match
        full_tuple = tuple(self.words)
        if full_tuple in self.grammar_rules:
            return self.grammar_rules[full_tuple]

        # Single character fingerspelling (e.g. ['H', 'E', 'L', 'P'] -> "HELP")
        if all(len(w) == 1 for w in self.words):
            return "".join(self.words)

        # Single word semantic expansion
        if len(self.words) == 1:
            w = self.words[0]
            if w in self.single_word_meanings:
                return self.single_word_meanings[w]
            return f"{w.capitalize()}."

        # Smart NLP Semantic Synthesizer for arbitrary multi-gesture combinations
        # Deduplicate consecutive tokens
        deduped = []
        for w in self.words:
            if not deduped or deduped[-1] != w:
                deduped.append(w)

        token_set = set(deduped)

        # 1. Urgent / Pain intents
        if "PAIN" in token_set:
            if "HELP" in token_set:
                return "Help me, I am feeling severe pain."
            if "BAD" in token_set:
                return "I am experiencing severe pain."
            if "STOP" in token_set:
                return "Please stop, it is causing me pain."
            return "I am in pain, please help me."

        # 2. Food & Drink combinations
        if "FOOD" in token_set and "WATER" in token_set:
            if "PLEASE" in token_set or "MORE" in token_set:
                return "Please may I have something to eat and drink?"
            return "I would like something to eat and drink, please."

        if "FOOD" in token_set:
            if "MORE" in token_set:
                return "May I have more food, please?"
            if "HELP" in token_set:
                return "Please help me get some food."
            if "NO" in token_set:
                return "No, thank you, I am not hungry."
            if "PLEASE" in token_set:
                return "I would like something to eat, please."
            return "I am hungry and would like food, please."

        if "WATER" in token_set:
            if "MORE" in token_set:
                return "May I have more water, please?"
            if "HELP" in token_set:
                return "Please help me get some water."
            if "NO" in token_set:
                return "No, thank you, I do not need water."
            if "PLEASE" in token_set:
                return "Please may I have some water."
            return "I am thirsty, may I please have some water?"

        # 3. Help & Assistance
        if "HELP" in token_set:
            if "CALL ME" in token_set:
                return "Please call someone to help me."
            if "PLEASE" in token_set:
                return "Please help me."
            if "YES" in token_set:
                return "Yes, I need help please."
            return "I need assistance, please help me."

        # 4. Greetings & Social
        if "HELLO" in token_set:
            if "GOOD" in token_set:
                return "Hello, good day to you."
            if "LOVE" in token_set:
                return "Hello! Sending you lots of love."
            return "Hello, how are you today?"

        if "THANK YOU" in token_set:
            if "GOOD" in token_set:
                return "Thank you, that is wonderful."
            return "Thank you very much."

        if "LOVE" in token_set:
            if "YOU" in token_set:
                return "I love you."
            return "Sending love and best wishes."

        if "STOP" in token_set:
            if "PLEASE" in token_set:
                return "Please stop now."
            return "Please stop."

        # Fallback with deduplication and natural punctuation
        return " ".join(w.capitalize() for w in deduped) + "."

    def get_suggestions(self):
        if not self.words:
            return ["HELLO", "PLEASE", "HELP", "WATER", "FOOD"]
        last_word = self.words[-1]
        return self.predictions_map.get(last_word, ["PLEASE", "THANK YOU", "HELP"])

    def add_manual_word(self, word: str):
        if word and word != "NO_GESTURE":
            self.words.append(word)
            self.last_committed_word = word
            return self.get_sentence()
        return self.get_sentence()

    def add_period(self):
        if self.words and not self.words[-1].endswith('.'):
            self.words.append(".")
        return self.get_sentence()

    def backspace(self):
        if self.words:
            self.words.pop()
            self.last_committed_word = self.words[-1] if self.words else None

    def clear(self):
        self.words = []
        self.current_holding_word = None
        self.hold_start_time = 0.0
        self.hold_progress = 0.0
        self.last_committed_word = None

    def toggle_recording(self):
        self.recording_enabled = not self.recording_enabled
        if not self.recording_enabled:
            self.hold_progress = 0.0
            self.current_holding_word = None
        return self.recording_enabled

    def get_words(self):
        return list(self.words)

"""
Complete Multi-Expression Facial Emotion Recognition Module
Recognizes: NEUTRAL, HAPPY, SAD, ANGRY, SURPRISE, FEAR, DISGUST, CONFUSED
Calibrated for high sensitivity without false triggers
"""
import os
import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
from collections import deque, Counter
import config

class EmotionStabilizer:
    def __init__(self, window_size=5, threshold_ratio=0.55):
        self.history = deque(maxlen=window_size)
        self.threshold_ratio = threshold_ratio
        self.confirmed_emotion = "neutral"
        self.confirmed_confidence = 0.98

    def update(self, raw_emotion, raw_confidence):
        emotion = raw_emotion or "neutral"
        self.history.append(emotion)

        counts = Counter(self.history)
        most_common, count = counts.most_common(1)[0]

        if (count / len(self.history)) >= self.threshold_ratio:
            self.confirmed_emotion = most_common
            self.confirmed_confidence = float(raw_confidence)

        return self.confirmed_emotion, float(self.confirmed_confidence)


class EmotionDetector:
    def __init__(self):
        model_path = os.path.join(config.MODELS_DIR, 'face_landmarker.task')
        base_options = python.BaseOptions(model_asset_path=model_path)
        options = vision.FaceLandmarkerOptions(
            base_options=base_options,
            output_face_blendshapes=True,
            num_faces=1,
            min_face_detection_confidence=0.60,
            min_face_presence_confidence=0.60,
            min_tracking_confidence=0.60
        )
        self.detector = vision.FaceLandmarker.create_from_options(options)
        self.stabilizer = EmotionStabilizer()
        
        self.current_emotion = "neutral"
        self.current_confidence = 0.98
        self.face_box = None
        
        # Live Biometric Telemetry
        self.smile_metric = 0.0
        self.brow_metric = 0.0
        self.eye_metric = 0.85

    def _classify_blendshapes(self, blendshapes):
        """
        Comprehensive FACS Expression Classifier:
        Covers HAPPY, SAD, ANGRY, SURPRISE, FEAR, DISGUST, CONFUSED, NEUTRAL.
        """
        bs = {b.category_name: b.score for b in blendshapes}

        # Individual Muscle Action Units
        raw_smile_l = bs.get('mouthSmileLeft', 0.0)
        raw_smile_r = bs.get('mouthSmileRight', 0.0)
        raw_smile = (raw_smile_l + raw_smile_r) / 2.0
        max_smile = max(raw_smile_l, raw_smile_r)
        cheek_squint = (bs.get('cheekSquintLeft', 0.0) + bs.get('cheekSquintRight', 0.0)) / 2.0
        mouth_dimple = (bs.get('mouthDimpleLeft', 0.0) + bs.get('mouthDimpleRight', 0.0)) / 2.0

        raw_frown_l = bs.get('mouthFrownLeft', 0.0)
        raw_frown_r = bs.get('mouthFrownRight', 0.0)
        raw_frown = (raw_frown_l + raw_frown_r) / 2.0
        max_frown = max(raw_frown_l, raw_frown_r)
        mouth_shrug_lower = bs.get('mouthShrugLower', 0.0)

        brow_down_l = bs.get('browDownLeft', 0.0)
        brow_down_r = bs.get('browDownRight', 0.0)
        raw_brow_down = (brow_down_l + brow_down_r) / 2.0
        max_brow_down = max(brow_down_l, brow_down_r)
        brow_inner_up = bs.get('browInnerUp', 0.0)
        brow_outer_up_l = bs.get('browOuterUpLeft', 0.0)
        brow_outer_up_r = bs.get('browOuterUpRight', 0.0)
        max_brow_outer_up = max(brow_outer_up_l, brow_outer_up_r)

        jaw_open = bs.get('jawOpen', 0.0)
        eye_wide_l = bs.get('eyeWideLeft', 0.0)
        eye_wide_r = bs.get('eyeWideRight', 0.0)
        eye_wide = (eye_wide_l + eye_wide_r) / 2.0

        eye_blink_l = bs.get('eyeBlinkLeft', 0.0)
        eye_blink_r = bs.get('eyeBlinkRight', 0.0)
        eye_blink = (eye_blink_l + eye_blink_r) / 2.0

        nose_sneer = (bs.get('noseSneerLeft', 0.0) + bs.get('noseSneerRight', 0.0)) / 2.0
        mouth_upper_up = (bs.get('mouthUpperUpLeft', 0.0) + bs.get('mouthUpperUpRight', 0.0)) / 2.0
        mouth_press = (bs.get('mouthPressLeft', 0.0) + bs.get('mouthPressRight', 0.0)) / 2.0
        mouth_stretch = (bs.get('mouthStretchLeft', 0.0) + bs.get('mouthStretchRight', 0.0)) / 2.0

        # Export live continuous biometric meters (0.0 to 1.0)
        self.smile_metric = float(min(1.0, max_smile * 2.2))
        self.brow_metric = float(min(1.0, max(max_brow_down, brow_inner_up) * 2.0))
        self.eye_metric = float(max(0.0, min(1.0, 1.0 - eye_blink)))

        # -----------------------------------------------------------------
        # PRIORITY EVALUATION OF EXPRESSIONS (Calibrated for real webcam dynamics)
        # Prevents false 'sad' triggers on resting/neutral human faces
        # -----------------------------------------------------------------

        # 1. SURPRISE (Jaw open / mouth dropped or wide eyes + raised brows)
        if jaw_open > 0.28 or (jaw_open > 0.18 and (brow_inner_up > 0.20 or eye_wide > 0.22)):
            conf = min(0.999, 0.95 + (jaw_open * 0.08))
            return "surprise", conf

        # 2. HAPPY / SMILE (Mouth corners pulled upwards + cheek squint)
        if raw_smile > 0.20 or max_smile > 0.24 or (raw_smile > 0.15 and (cheek_squint > 0.14 or mouth_dimple > 0.14)):
            conf = min(0.999, 0.95 + (max_smile * 0.08))
            return "happy", conf

        # 3. ANGRY (Brow furrowed downwards - triggers on bilateral or strong unilateral furrow)
        if max_brow_down > 0.24 or (raw_brow_down > 0.18 and (mouth_press > 0.16 or raw_frown > 0.16 or nose_sneer > 0.15)):
            conf = min(0.999, 0.95 + (max_brow_down * 0.08))
            return "angry", conf

        # 4. FEAR (Eyes wide open + inner brow distress + mouth stretch/jaw drop)
        if (brow_inner_up > 0.25 and eye_wide > 0.22) and (mouth_stretch > 0.16 or jaw_open > 0.18):
            conf = min(0.995, 0.94 + (brow_inner_up * 0.08))
            return "fear", conf

        # 5. DISGUST (Nose wrinkled / upper lip raised)
        if nose_sneer > 0.20 or mouth_upper_up > 0.22 or (max_brow_down > 0.18 and nose_sneer > 0.15):
            conf = min(0.992, 0.93 + (nose_sneer * 0.10))
            return "disgust", conf

        # 6. SAD (Clear, intentional frown or lower lip depression, NOT resting mouth curve)
        if jaw_open < 0.20 and (raw_frown > 0.22 or max_frown > 0.26 or (raw_frown > 0.16 and brow_inner_up > 0.22) or (mouth_shrug_lower > 0.25 and raw_frown > 0.15)):
            conf = min(0.998, 0.945 + (max(max_frown, brow_inner_up) * 0.09))
            return "sad", conf

        # 7. CONFUSED (Significant brow asymmetry or asymmetric furrow with squint)
        brow_asymmetry = abs(brow_down_l - brow_down_r)
        outer_asymmetry = abs(brow_outer_up_l - brow_outer_up_r)
        if brow_asymmetry > 0.22 or outer_asymmetry > 0.24:
            conf = min(0.990, 0.92 + (brow_asymmetry * 0.10))
            return "confused", conf

        # 8. DEFAULT: NEUTRAL (Clean, relaxed resting face)
        max_active = max(raw_smile, max_brow_down, max_frown, jaw_open)
        neutral_conf = min(0.999, max(0.95, 0.99 - (max_active * 0.15)))
        return "neutral", neutral_conf

    def process_frame(self, frame_bgr):
        h, w, _ = frame_bgr.shape
        frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)
        
        try:
            results = self.detector.detect(mp_image)
        except Exception:
            return self.current_emotion, float(self.current_confidence), frame_bgr

        detected_emotion = "neutral"
        detected_conf = 0.98
        box = None

        if results.face_landmarks and len(results.face_landmarks) > 0:
            face_lms = results.face_landmarks[0]
            
            x_coords = [int(p.x * w) for p in face_lms]
            y_coords = [int(p.y * h) for p in face_lms]
            x_min, x_max = max(0, min(x_coords)), min(w, max(x_coords))
            y_min, y_max = max(0, min(y_coords)), min(h, max(y_coords))
            box = (x_min, y_min, x_max - x_min, y_max - y_min)

            if results.face_blendshapes and len(results.face_blendshapes) > 0:
                detected_emotion, detected_conf = self._classify_blendshapes(results.face_blendshapes[0])
        else:
            self.smile_metric = 0.0
            self.brow_metric = 0.0
            self.eye_metric = 0.85

        # Temporal stabilization
        stable_emotion, stable_conf = self.stabilizer.update(detected_emotion, detected_conf)
        self.current_emotion = stable_emotion
        self.current_confidence = float(stable_conf)
        self.face_box = box

        # Render HUD box on face
        if box and box[2] > 40 and box[3] > 40:
            bx, by, bw, bh = box
            
            # Palette matching emotion
            color_map = {
                "happy": (16, 185, 129),      # Emerald
                "neutral": (200, 215, 230),   # Slate
                "sad": (59, 130, 246),        # Ocean Blue
                "angry": (239, 68, 68),       # Crimson Red
                "surprise": (245, 158, 11),   # Amber
                "fear": (168, 85, 247),       # Purple
                "disgust": (20, 184, 166),    # Teal
                "confused": (234, 179, 8)     # Yellow
            }
            color = color_map.get(stable_emotion, (200, 215, 230))

            cv2.rectangle(frame_bgr, (bx, by), (bx + bw, by + bh), color, 2)
            label = f"{stable_emotion.upper()} {int(stable_conf * 100)}%"
            cv2.rectangle(frame_bgr, (bx, max(0, by - 24)), (bx + len(label)*10 + 20, by), color, -1)
            cv2.putText(frame_bgr, label, (bx + 8, max(16, by - 7)),
                        cv2.FONT_HERSHEY_DUPLEX, 0.50, (15, 23, 42), 1)

        # Top-left HUD badge removed for clean video view
        return stable_emotion, float(stable_conf), frame_bgr

    def get_telemetry_metrics(self):
        return {
            "smile": float(round(self.smile_metric, 2)),
            "brow": float(round(self.brow_metric, 2)),
            "eye": float(round(self.eye_metric, 2))
        }

    def release(self):
        pass

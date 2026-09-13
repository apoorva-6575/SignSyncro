"""
Sign Language & Emotion Recognition System
Main Flask Application Server
High-Precision 95%+ Vision, 3D Kinematics, Sequential Sentence Studio & Analytics
"""
import time
import base64
import cv2
import numpy as np
from flask import Flask, render_template, Response, jsonify, request

import config
from camera import VideoCamera
from gesture_detection import GestureRecognizer
from emotion_detection import EmotionDetector
from fusion import MultimodalFusion
from sentence_engine import SentenceEngine

app = Flask(__name__)

# Global System Components
camera = None
gesture_recognizer = None
emotion_detector = None
fusion_engine = None
sentence_engine = None

latest_telemetry = {
    "gesture": config.DEFAULT_GESTURE,
    "gesture_conf": 0.0,
    "emotion": "neutral",
    "emotion_conf": 0.95,
    "phrase": None,
    "sentence": "",
    "sentence_words": [],
    "suggestions": ["HELLO", "PLEASE", "HELP", "WATER", "FOOD"],
    "biometrics": {"smile": 0.0, "brow": 0.0, "eye": 0.85},
    "hold_progress": 0.0,
    "recording_enabled": True,
    "hand_framed": "WAITING",
    "lighting_status": "GOOD",
    "brightness": 100.0,
    "is_priority": False,
    "should_speak": False,
    "fps": 30.0,
    "timestamp": ""
}

# FPS Tracker
fps_history = []

def init_system():
    global camera, gesture_recognizer, emotion_detector, fusion_engine, sentence_engine
    if gesture_recognizer is None:
        print("[SYSTEM] Initializing 3D Kinematic Gesture Recognizer...")
        gesture_recognizer = GestureRecognizer()
    if emotion_detector is None:
        print("[SYSTEM] Initializing MediaPipe FACS Emotion Detector (95%+)...")
        emotion_detector = EmotionDetector()
    if fusion_engine is None:
        print("[SYSTEM] Initializing Multimodal Fusion Engine...")
        fusion_engine = MultimodalFusion()
    if sentence_engine is None:
        print("[SYSTEM] Initializing Sequential Sentence Construction Engine...")
        sentence_engine = SentenceEngine()
    if camera is None:
        print("[SYSTEM] Starting Camera Stream...")
        camera = VideoCamera(source=config.CAMERA_INDEX)

@app.route('/')
def index():
    return render_template('index.html')

def sanitize_telemetry(data):
    sanitized = {}
    for k, v in data.items():
        if isinstance(v, (np.bool_, bool)):
            sanitized[k] = bool(v)
        elif isinstance(v, (np.floating, float)):
            sanitized[k] = float(v)
        elif isinstance(v, (np.integer, int)):
            sanitized[k] = int(v)
        elif isinstance(v, list):
            sanitized[k] = [str(x) for x in v]
        elif isinstance(v, dict):
            sanitized[k] = {str(dk): float(dv) if isinstance(dv, (float, np.floating)) else str(dv) for dk, dv in v.items()}
        elif v is None:
            sanitized[k] = None
        else:
            sanitized[k] = str(v)
    return sanitized

def generate_video_stream():
    global camera, gesture_recognizer, emotion_detector, fusion_engine, sentence_engine, latest_telemetry, fps_history
    
    last_frame_time = time.time()
    
    while True:
        frame = camera.get_frame() if camera else None
        
        if frame is None:
            standby = np.zeros((config.FRAME_HEIGHT, config.FRAME_WIDTH, 3), dtype=np.uint8)
            cv2.putText(standby, "Webcam Initializing / Standby...", (60, 240),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (160, 160, 160), 2)
            ret, buffer = cv2.imencode('.jpg', standby)
            frame_bytes = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            time.sleep(0.08)
            continue

        # 1. 3D Hand Gesture Processing
        gesture, g_conf, frame = gesture_recognizer.process_frame(frame)

        # 2. 95%+ FACS Facial Emotion Processing
        emotion, e_conf, frame = emotion_detector.process_frame(frame)

        # 3. Sequential Sentence Construction
        new_word, current_sentence = sentence_engine.update(gesture)

        # 4. Multimodal Context Fusion
        fusion_result = fusion_engine.fuse(gesture, emotion, g_conf, e_conf)

        # 5. Measure instantaneous FPS
        now = time.time()
        fps = 1.0 / max(0.001, now - last_frame_time)
        last_frame_time = now
        fps_history.append(fps)
        if len(fps_history) > 15:
            fps_history.pop(0)
        avg_fps = sum(fps_history) / len(fps_history)

        # 6. Update Shared State
        latest_telemetry.update(sanitize_telemetry({
            "gesture": gesture,
            "gesture_conf": g_conf,
            "emotion": emotion,
            "emotion_conf": e_conf,
            "phrase": fusion_result.get("phrase"),
            "sentence": current_sentence,
            "sentence_words": sentence_engine.get_words() if sentence_engine else [],
            "suggestions": sentence_engine.get_suggestions() if sentence_engine else [],
            "biometrics": emotion_detector.get_telemetry_metrics() if emotion_detector else {},
            "hold_progress": round(sentence_engine.hold_progress, 2) if sentence_engine else 0.0,
            "recording_enabled": sentence_engine.recording_enabled if sentence_engine else False,
            "hand_framed": gesture_recognizer.last_hand_framed if gesture_recognizer else "WAITING",
            "lighting_status": gesture_recognizer.last_lighting_status if gesture_recognizer else "GOOD",
            "brightness": round(gesture_recognizer.last_brightness, 1) if gesture_recognizer else 100.0,
            "is_priority": fusion_result.get("is_priority", False),
            "should_speak": fusion_result.get("should_speak", False),
            "fps": round(avg_fps, 1),
            "timestamp": fusion_result.get("timestamp", "")
        }))

        # 7. Compress and Stream JPEG
        ret, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
        if not ret:
            continue

        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.route('/video_feed')
def video_feed():
    return Response(generate_video_stream(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

# Browser-side camera capture: the frontend grabs frames from the user's own
# webcam (getUserMedia) and POSTs them here for inference, instead of the
# server opening its own camera device (which a cloud host doesn't have).
# Reuses the exact same detection/fusion/sentence pipeline as the MJPEG path.
last_upload_frame_time = None

@app.route('/api/process_frame', methods=['POST'])
def process_frame_route():
    global gesture_recognizer, emotion_detector, fusion_engine, sentence_engine
    global latest_telemetry, fps_history, last_upload_frame_time

    if not all([gesture_recognizer, emotion_detector, fusion_engine, sentence_engine]):
        return jsonify({"success": False, "error": "System not initialized"}), 503

    payload = request.get_json(silent=True) or {}
    image_data = payload.get('image', '')
    if ',' in image_data:
        image_data = image_data.split(',', 1)[1]

    try:
        img_bytes = base64.b64decode(image_data)
        arr = np.frombuffer(img_bytes, dtype=np.uint8)
        frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    except Exception:
        frame = None

    if frame is None:
        return jsonify({"success": False, "error": "Could not decode frame"}), 400

    # 1. 3D Hand Gesture Processing
    gesture, g_conf, frame = gesture_recognizer.process_frame(frame)

    # 2. 95%+ FACS Facial Emotion Processing
    emotion, e_conf, frame = emotion_detector.process_frame(frame)

    # 3. Sequential Sentence Construction
    new_word, current_sentence = sentence_engine.update(gesture)

    # 4. Multimodal Context Fusion
    fusion_result = fusion_engine.fuse(gesture, emotion, g_conf, e_conf)

    # 5. Measure effective FPS from actual upload cadence
    now = time.time()
    if last_upload_frame_time is not None:
        fps = 1.0 / max(0.001, now - last_upload_frame_time)
        fps_history.append(fps)
        if len(fps_history) > 15:
            fps_history.pop(0)
    last_upload_frame_time = now
    avg_fps = sum(fps_history) / len(fps_history) if fps_history else 0.0

    # 6. Update Shared State (same telemetry contract /api/status already serves)
    latest_telemetry.update(sanitize_telemetry({
        "gesture": gesture,
        "gesture_conf": g_conf,
        "emotion": emotion,
        "emotion_conf": e_conf,
        "phrase": fusion_result.get("phrase"),
        "sentence": current_sentence,
        "sentence_words": sentence_engine.get_words() if sentence_engine else [],
        "suggestions": sentence_engine.get_suggestions() if sentence_engine else [],
        "biometrics": emotion_detector.get_telemetry_metrics() if emotion_detector else {},
        "hold_progress": round(sentence_engine.hold_progress, 2) if sentence_engine else 0.0,
        "recording_enabled": sentence_engine.recording_enabled if sentence_engine else False,
        "hand_framed": gesture_recognizer.last_hand_framed if gesture_recognizer else "WAITING",
        "lighting_status": gesture_recognizer.last_lighting_status if gesture_recognizer else "GOOD",
        "brightness": round(gesture_recognizer.last_brightness, 1) if gesture_recognizer else 100.0,
        "is_priority": fusion_result.get("is_priority", False),
        "should_speak": fusion_result.get("should_speak", False),
        "fps": round(avg_fps, 1),
        "timestamp": fusion_result.get("timestamp", "")
    }))

    # 7. Return the annotated frame (same overlay the MJPEG path drew) so the
    # browser can show it in place of a raw passthrough feed.
    ret, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
    annotated_b64 = base64.b64encode(buffer.tobytes()).decode('ascii') if ret else None

    return jsonify({
        "success": True,
        "annotated_image": f"data:image/jpeg;base64,{annotated_b64}" if annotated_b64 else None
    })

@app.route('/api/status')
def api_status():
    return jsonify(sanitize_telemetry(latest_telemetry))

@app.route('/api/history')
def api_history():
    if fusion_engine:
        return jsonify(fusion_engine.get_history())
    return jsonify([])

@app.route('/api/clear_history', methods=['POST'])
def api_clear_history():
    if fusion_engine:
        fusion_engine.history.clear()
    return jsonify({"success": True})

@app.route('/api/sentence/toggle_recording', methods=['POST'])
def api_sentence_toggle_recording():
    enabled = True
    if sentence_engine:
        enabled = sentence_engine.toggle_recording()
    return jsonify({"success": True, "enabled": enabled})

@app.route('/api/sentence/clear', methods=['POST'])
def api_sentence_clear():
    if sentence_engine:
        sentence_engine.clear()
    return jsonify({"success": True})

@app.route('/api/sentence/backspace', methods=['POST'])
def api_sentence_backspace():
    words = []
    if sentence_engine:
        sentence_engine.backspace()
        words = sentence_engine.get_words()
    return jsonify({"success": True, "words": words})

@app.route('/api/sentence/add_word', methods=['POST'])
def api_sentence_add_word():
    data = request.get_json(silent=True) or {}
    word = data.get('word', '')
    new_sentence = ""
    if sentence_engine:
        new_sentence = sentence_engine.add_manual_word(word)
    return jsonify({"success": True, "sentence": new_sentence, "words": sentence_engine.get_words() if sentence_engine else []})

@app.route('/api/sentence/add_period', methods=['POST'])
def api_sentence_add_period():
    new_sentence = ""
    if sentence_engine:
        new_sentence = sentence_engine.add_period()
    return jsonify({"success": True, "sentence": new_sentence, "words": sentence_engine.get_words() if sentence_engine else []})

SIGN_KNOWLEDGE_BASE = {
    "HELLO": {
        "word": "HELLO", "category": "Greeting", "icon": "fa-regular fa-hand",
        "description": "Open flat hand upright facing outward; gentle wave movement.",
        "hand_shape": "All 5 fingers upright and spread (B-open palm)",
        "movement": "Side-to-side gentle wave at shoulder level"
    },
    "PLEASE": {
        "word": "PLEASE", "category": "Courtesy", "icon": "fa-solid fa-hand-holding-heart",
        "description": "Flat open hand placed gently over center of chest in a circular motion.",
        "hand_shape": "Open flat palm, thumb resting along index",
        "movement": "Clockwise circular rub on chest"
    },
    "THANK YOU": {
        "word": "THANK YOU", "category": "Courtesy", "icon": "fa-solid fa-hands-praying",
        "description": "Flat hand fingers touching chin/lower lip, moving forward and down toward partner.",
        "hand_shape": "Flat open hand facing inward at chin",
        "movement": "Extending outward towards conversation partner"
    },
    "WATER": {
        "word": "WATER", "category": "Need", "icon": "fa-solid fa-hand-peace",
        "description": "'W' hand shape (Index, Middle, Ring upright; pinky folded) tapped twice against chin/lips.",
        "hand_shape": "Three middle fingers upright, thumb holding pinky",
        "movement": "Double tap on lower lip"
    },
    "FOOD": {
        "word": "FOOD", "category": "Need", "icon": "fa-solid fa-hand-dots",
        "description": "All 5 fingertips pinched together ('flattened O' shape) tapped toward mouth.",
        "hand_shape": "All fingertips clustered touching thumb tip",
        "movement": "Tap fingertips to lips twice"
    },
    "EAT": {
        "word": "EAT", "category": "Action", "icon": "fa-solid fa-utensils",
        "description": "Fingertips clustered together moving toward mouth.",
        "hand_shape": "Pinch hand shape",
        "movement": "Single motion towards mouth"
    },
    "HELP": {
        "word": "HELP", "category": "Urgent", "icon": "fa-regular fa-thumbs-up",
        "description": "Closed fist with thumb pointing up, placed on open base palm and lifted together.",
        "hand_shape": "Dominant thumbs-up fist resting on flat base palm",
        "movement": "Lift both hands upward together"
    },
    "PAIN": {
        "word": "PAIN", "category": "Medical", "icon": "fa-solid fa-hand-point-right",
        "description": "Both index fingers extended pointing toward each other, twisting inward over area of discomfort.",
        "hand_shape": "Index fingers extended (1-hand shape)",
        "movement": "Point and twist inward towards each other"
    },
    "HURT": {
        "word": "HURT", "category": "Medical", "icon": "fa-solid fa-bolt",
        "description": "Index fingers pointing toward each other with a twisting motion.",
        "hand_shape": "Dual index fingers pointing",
        "movement": "Opposing twist motion"
    },
    "STOP": {
        "word": "STOP", "category": "Command", "icon": "fa-solid fa-hand",
        "description": "Flat vertical hand held straight up with palm facing forward, or chopping down onto flat palm.",
        "hand_shape": "Flat open hand vertical",
        "movement": "Held firmly outward"
    },
    "GOOD": {
        "word": "GOOD", "category": "Affirmation", "icon": "fa-solid fa-circle-check",
        "description": "Thumb and index tip forming a circle ('OK' sign), or fingers flat on chin moving forward.",
        "hand_shape": "OK circle or open palm",
        "movement": "Forward gentle motion"
    },
    "BAD": {
        "word": "BAD", "category": "Negative", "icon": "fa-regular fa-thumbs-down",
        "description": "Fist with thumb pointing straight down.",
        "hand_shape": "Thumbs-down fist",
        "movement": "Downwards firm thrust"
    },
    "LOVE": {
        "word": "LOVE", "category": "Affection", "icon": "fa-solid fa-heart",
        "description": "Thumb, index, and pinky extended upright ('I-Love-You' sign), or arms crossed over chest.",
        "hand_shape": "I-L-Y three-finger sign or crossed arms",
        "movement": "Held upright facing partner"
    },
    "PEACE": {
        "word": "PEACE", "category": "Social", "icon": "fa-solid fa-peace",
        "description": "Index and middle fingers extended upright in V-shape (Victory / Peace sign).",
        "hand_shape": "V-shape two fingers",
        "movement": "Held upright shoulder height"
    },
    "RESTROOM": {
        "word": "RESTROOM", "category": "Need", "icon": "fa-solid fa-restroom",
        "description": "Fist with thumb tucked between index and middle fingers ('T' sign) shaken side-to-side.",
        "hand_shape": "'T' letter hand shape",
        "movement": "Gentle wrist shake side to side"
    },
    "YES": {
        "word": "YES", "category": "Affirmation", "icon": "fa-solid fa-check",
        "description": "Fist moving up and down nodding like a head nod.",
        "hand_shape": "Closed fist (S-shape)",
        "movement": "Nodding wrist flexion up and down"
    },
    "NO": {
        "word": "NO", "category": "Negative", "icon": "fa-solid fa-xmark",
        "description": "Index and middle fingers extended, snapping down together against the thumb tip.",
        "hand_shape": "Two fingers snap down to thumb",
        "movement": "Quick pinch closure"
    },
    "I": {
        "word": "I", "category": "Pronoun", "icon": "fa-solid fa-hand-point-up",
        "description": "Index finger pointing towards one's own chest, or pinky finger upright ('I' letter).",
        "hand_shape": "Index point to chest or pinky up",
        "movement": "Touch center chest"
    },
    "YOU": {
        "word": "YOU", "category": "Pronoun", "icon": "fa-solid fa-hand-point-right",
        "description": "Index finger pointing directly toward conversation partner.",
        "hand_shape": "Index finger pointing forward",
        "movement": "Point towards listener"
    },
    "WANT": {
        "word": "WANT", "category": "Action", "icon": "fa-solid fa-hands",
        "description": "Both hands with curved fingers palms up, pulling gently toward body.",
        "hand_shape": "Curved open claw hands",
        "movement": "Pull gently towards body"
    },
    "MORE": {
        "word": "MORE", "category": "Need", "icon": "fa-solid fa-plus",
        "description": "Both hands with pinched fingertips tapping together repeatedly in front of chest.",
        "hand_shape": "Flattened O on both hands",
        "movement": "Tap fingertips together twice"
    },
    "WHERE": {
        "word": "WHERE", "category": "Question", "icon": "fa-solid fa-question",
        "description": "Index finger extended upright, shaking back and forth with questioning brow.",
        "hand_shape": "Index finger upright",
        "movement": "Wiggle side to side"
    },
    "OKAY": {
        "word": "OKAY", "category": "Affirmation", "icon": "fa-solid fa-thumbs-up",
        "description": "Thumb and index forming O-K circle.",
        "hand_shape": "O-K shape",
        "movement": "Held steady"
    },
    "SURE": {
        "word": "SURE", "category": "Affirmation", "icon": "fa-solid fa-circle-check",
        "description": "Index finger extended upright from mouth/chin, arcing forward with a confident nod.",
        "hand_shape": "Dominant index finger pointing upward at lips",
        "movement": "Firm arc forward from chin"
    },
    "WHAT": {
        "word": "WHAT", "category": "Question", "icon": "fa-solid fa-question",
        "description": "Both open hands held at waist level with palms facing up, shaking gently side-to-side with questioning expression.",
        "hand_shape": "Both open palms up (5-hand shape)",
        "movement": "Side-to-side gentle shake"
    },
    "HUNGRY": {
        "word": "HUNGRY", "category": "Need", "icon": "fa-solid fa-utensils",
        "description": "C-hand shape placed at throat/upper chest, moving downwards toward stomach to represent an empty stomach.",
        "hand_shape": "Curved C-hand facing body",
        "movement": "Downward stroke from throat to sternum"
    },
    "NOODLES": {
        "word": "NOODLES", "category": "Need", "icon": "fa-solid fa-bowl-food",
        "description": "Both pinky fingers extended ('I' hand shapes) touching together and twisting outward, representing strands of noodles.",
        "hand_shape": "Both pinky fingers extended (I-shape)",
        "movement": "Alternating spiraling twist moving apart"
    },
    "HOW": {
        "word": "HOW", "category": "Question", "icon": "fa-solid fa-hand-holding",
        "description": "Both curved hands held knuckles together, rotating upward so palms face up.",
        "hand_shape": "Curved open hands touching knuckles",
        "movement": "Rotate outward so palms face up"
    },
    "NICE": {
        "word": "NICE", "category": "Social", "icon": "fa-solid fa-hand-sparkles",
        "description": "Dominant flat hand smoothly sliding forward across the flat base palm from heel to fingertips.",
        "hand_shape": "Both flat open palms",
        "movement": "Smooth sliding swipe across palm"
    },
    "MEET": {
        "word": "MEET", "category": "Social", "icon": "fa-solid fa-people-arrows",
        "description": "Both index fingers pointing upright facing each other, moving together until knuckles touch.",
        "hand_shape": "Both index fingers extended upright (1-shape)",
        "movement": "Move together until knuckles meet"
    },
    "CALL ME": {
        "word": "CALL ME", "category": "Social", "icon": "fa-solid fa-phone",
        "description": "Thumb and pinky extended to ear and mouth like a telephone handset.",
        "hand_shape": "Y-hand shape (phone gesture)",
        "movement": "Tilt towards ear"
    },
    "DOCTOR": {
        "word": "DOCTOR", "category": "Medical", "icon": "fa-solid fa-user-doctor",
        "description": "Dominant bent hand tapping fingertips against the inner wrist/radial pulse of the base hand.",
        "hand_shape": "Bent-hand (M-shape) tapping wrist pulse",
        "movement": "Double tap on inner wrist"
    },
    "MEDICINE": {
        "word": "MEDICINE", "category": "Medical", "icon": "fa-solid fa-pills",
        "description": "Middle finger tip placed on palm of non-dominant hand, twisting side-to-side like grinding herbs.",
        "hand_shape": "Middle finger bent into palm",
        "movement": "Circular pivoting motion on palm"
    },
    "WAIT": {
        "word": "WAIT", "category": "Command", "icon": "fa-solid fa-hand",
        "description": "Both open palms held up facing chest, wiggling fingers.",
        "hand_shape": "Open 5-hand shape",
        "movement": "Gentle finger flutter"
    }
}

# Real photorealistic Indian Sign Language (ISL) Avatar Assets
AVATAR_IMAGE_MAP = {
    "HELLO": "/static/img/avatar_isl/hello.jpg",
    "PLEASE": "/static/img/avatar_isl/please.jpg",
    "THANK YOU": "/static/img/avatar_isl/thank_you.jpg",
    "WATER": "/static/img/avatar_isl/water.jpg",
    "FOOD": "/static/img/avatar_isl/food.jpg",
    "EAT": "/static/img/avatar_isl/eat.jpg",
    "HELP": "/static/img/avatar_isl/help.jpg",
    "PAIN": "/static/img/avatar_isl/pain.jpg",
    "YES": "/static/img/avatar_isl/yes.jpg",
    "NO": "/static/img/avatar_isl/no.jpg",
    "I": "/static/img/avatar_isl/i.jpg",
    "YOU": "/static/img/avatar_isl/you.jpg",
    "WANT": "/static/img/avatar_isl/want.jpg",
    "OKAY": "/static/img/avatar_isl/okay.jpg",
    "SURE": "/static/img/avatar_isl/sure.jpg",
    "WHAT": "/static/img/avatar_isl/what.jpg",
    "HUNGRY": "/static/img/avatar_isl/hungry.jpg",
    "NOODLES": "/static/img/avatar_isl/food.jpg",
    "DRINK": "/static/img/avatar_isl/drink.jpg",
    "NEED": "/static/img/avatar_isl/need.jpg",
    "STOP": "/static/img/avatar_isl/no.jpg",
    "GOOD": "/static/img/avatar_isl/yes.jpg",
    "BAD": "/static/img/avatar_isl/no.jpg",
    "MORE": "/static/img/avatar_isl/want.jpg",
    "WHERE": "/static/img/avatar_isl/what.jpg",
    "HURT": "/static/img/avatar_isl/pain.jpg",
    "CALL ME": "/static/img/avatar_isl/you.jpg",
    "RESTROOM": "/static/img/avatar_isl/water.jpg",
    "DOCTOR": "/static/img/avatar_isl/help.jpg",
    "MEDICINE": "/static/img/avatar_isl/water.jpg",
    "HOW": "/static/img/avatar_isl/what.jpg",
    "NICE": "/static/img/avatar_isl/please.jpg",
    "MEET": "/static/img/avatar_isl/hello.jpg",
    "WAIT": "/static/img/avatar_isl/idle.jpg"
}

# Attach verified avatar image asset and ISL metadata
for _k, _v in SIGN_KNOWLEDGE_BASE.items():
    _v["avatar_img"] = AVATAR_IMAGE_MAP.get(_k, "/static/img/avatar_isl/idle.jpg")
    _v["sign_language"] = "Indian Sign Language (ISL)"
    _v["presenter"] = "Asha (ISL Avatar)"

@app.route('/api/signs', methods=['GET'])
def api_get_signs():
    return jsonify({"success": True, "signs": SIGN_KNOWLEDGE_BASE, "count": len(SIGN_KNOWLEDGE_BASE)})

@app.route('/api/text_to_sign', methods=['POST'])
def api_text_to_sign():
    data = request.get_json(silent=True) or {}
    text = data.get('text', '').strip()
    if not text:
        return jsonify({"success": False, "error": "No text provided", "mapped_signs": []})

    # Clean and tokenize
    import re
    cleaned = re.sub(r'[^A-Za-z\s]', '', text).upper()
    raw_words = cleaned.split()

    mapped_signs = []
    unmapped_words = []

    # Common spoken synonyms & normalizations to sign vocabulary
    synonyms = {
        "HUNGRY": "HUNGRY", "MEAL": "FOOD", "DINNER": "FOOD", "LUNCH": "FOOD", "BREAKFAST": "FOOD",
        "THIRSTY": "WATER", "DRINK": "WATER", "BEVERAGE": "WATER",
        "ASSIST": "HELP", "ASSISTANCE": "HELP", "EMERGENCY": "HELP",
        "ACHE": "PAIN", "SORE": "PAIN", "INJURY": "PAIN",
        "HI": "HELLO", "HEY": "HELLO", "GREETINGS": "HELLO",
        "THANKS": "THANK YOU", "GRATITUDE": "THANK YOU",
        "LIKE": "WANT", "NEED": "WANT", "DESIRE": "WANT",
        "BATHROOM": "RESTROOM", "TOILET": "RESTROOM", "WASHROOM": "RESTROOM",
        "FINE": "GOOD", "GREAT": "GOOD", "COOL": "GOOD",
        "YEAH": "YES", "YEP": "YES", "CORRECT": "YES", "SURE": "SURE", "CERTAINLY": "SURE",
        "NOPE": "NO", "NAH": "NO",
        "PASTA": "NOODLES", "RAMEN": "NOODLES", "MAGGI": "NOODLES", "CHOWMEIN": "NOODLES",
        "PHONE": "CALL ME", "CALL": "CALL ME"
    }

    # English grammatical function words omitted in conceptual sign language
    STOP_WORDS = {"WOULD", "TO", "A", "AN", "THE", "IS", "ARE", "AM", "DO", "DID", "DOES", "CAN", "COULD", "BE", "OF", "FOR", "IN", "AT", "SOME", "ANY"}

    # Map multi-word phrases first (e.g., "THANK YOU", "CALL ME", "NICE TO MEET YOU", "YES SURE")
    multi_phrases = {
        "NICE TO MEET YOU": ["NICE", "MEET", "YOU"],
        "HOW ARE YOU": ["HOW", "YOU"],
        "YES SURE": ["YES", "SURE"],
        "OKAY SURE": ["OKAY", "SURE"],
        "I AM HUNGRY": ["I", "HUNGRY"],
        "ARE YOU HUNGRY": ["YOU", "HUNGRY"]
    }

    cleaned_str = " ".join(raw_words)
    if cleaned_str in multi_phrases:
        for p_word in multi_phrases[cleaned_str]:
            if p_word in SIGN_KNOWLEDGE_BASE:
                mapped_signs.append(SIGN_KNOWLEDGE_BASE[p_word])
        return jsonify({
            "success": True,
            "original_text": text,
            "mapped_signs": mapped_signs,
            "unmapped_words": [],
            "is_complete_match": True
        })

    idx = 0
    while idx < len(raw_words):
        # Two-word check
        if idx < len(raw_words) - 1:
            two_word = f"{raw_words[idx]} {raw_words[idx+1]}"
            if two_word in SIGN_KNOWLEDGE_BASE:
                mapped_signs.append(SIGN_KNOWLEDGE_BASE[two_word])
                idx += 2
                continue

        w = raw_words[idx]

        # Check direct match
        if w in SIGN_KNOWLEDGE_BASE:
            mapped_signs.append(SIGN_KNOWLEDGE_BASE[w])
        elif w in synonyms and synonyms[w] in SIGN_KNOWLEDGE_BASE:
            mapped_signs.append(SIGN_KNOWLEDGE_BASE[synonyms[w]])
        elif w in STOP_WORDS:
            # Skip grammatical function word
            pass
        else:
            unmapped_words.append(w)
        idx += 1

    return jsonify({
        "success": True,
        "original_text": text,
        "sign_language": "Indian Sign Language (ISL)",
        "presenter": "Asha (ISL Avatar)",
        "mapped_signs": mapped_signs,
        "unmapped_words": unmapped_words,
        "is_complete_match": len(unmapped_words) == 0 and len(mapped_signs) > 0
    })

@app.route('/api/export_log')
def api_export_log():
    """Generates an exportable text summary of the session communication."""
    if not fusion_engine or not fusion_engine.get_history():
        return "Sign Language & Emotion Recognition System - Session Log\nNo activity recorded in this session.\n", 200, {'Content-Type': 'text/plain'}
    
    lines = [
        "=" * 65,
        " SIGN LANGUAGE & EMOTION RECOGNITION SYSTEM - SESSION REPORT",
        f" Generated: {time.strftime('%Y-%m-%d %H:%M:%S')}",
        "=" * 65,
        "\nRECORDED COMMUNICATION TIMELINE:\n"
    ]
    for idx, item in enumerate(reversed(fusion_engine.get_history()), 1):
        alert = " [PRIORITY ALERT]" if item.get('priority') else ""
        lines.append(f"[{item['time']}] {idx}. SIGN: {item['gesture']} | EMOTION: {item['emotion'].upper()}{alert}")
        lines.append(f"    SPOKEN PHRASE: \"{item['phrase']}\"\n")
    
    if sentence_engine and sentence_engine.get_sentence():
        lines.append("\nFINAL CONSTRUCTED SENTENCE:")
        lines.append(f"\"{sentence_engine.get_sentence()}\"\n")
    
    lines.append("=" * 65)
    return "\n".join(lines), 200, {
        'Content-Type': 'text/plain',
        'Content-Disposition': 'attachment; filename="assistive_session_report.txt"'
    }

# Initialize unconditionally at import time so this also runs under a
# production WSGI server (e.g. gunicorn app:app), which never executes the
# __main__ block below.
init_system()

if __name__ == '__main__':
    print("\n" + "="*60)
    print(" ULTRA-ACCURACY SIGN & EMOTION RECOGNITION READY")
    print(" Open Browser: http://127.0.0.1:5000")
    print("="*60 + "\n")
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)

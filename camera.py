"""
Threaded Camera Capture Module
Ensures non-blocking high-FPS webcam streaming
"""
import cv2
import threading
import time
import config

class VideoCamera:
    def __init__(self, source=config.CAMERA_INDEX):
        self.source = source
        self.cap = cv2.VideoCapture(self.source)
        
        # Configure camera resolution
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, config.FRAME_WIDTH)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, config.FRAME_HEIGHT)
        self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

        self.grabbed, self.frame = self.cap.read()
        self.running = True
        self.lock = threading.Lock()
        
        # Start background frame reader
        self.thread = threading.Thread(target=self._capture_loop, daemon=True)
        self.thread.start()

    def _capture_loop(self):
        while self.running:
            if not self.cap.isOpened():
                time.sleep(0.1)
                continue
            grabbed, frame = self.cap.read()
            if grabbed:
                with self.lock:
                    self.grabbed = grabbed
                    self.frame = frame
            time.sleep(0.01)

    def get_frame(self):
        with self.lock:
            if self.frame is not None:
                return self.frame.copy()
            return None

    def release(self):
        self.running = False
        if self.thread.is_alive():
            self.thread.join(timeout=1.0)
        if self.cap.isOpened():
            self.cap.release()

    def __del__(self):
        self.release()

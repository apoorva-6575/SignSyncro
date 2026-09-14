/**
 * SignSyncro - "Connecting Beyond Words."
 * Production Master Client Application
 * 
 * Manages:
 * 1. SPA Routing & View Management (Home, Communicate, My Signs, Transcript)
 * 2. 🤟 SIGN → TEXT → SPEECH (Camera vision, 3D Kinematics, Smart Frame guidance, Hold progress)
 * 3. 🎙️ SPEECH → TEXT → SIGN (Web Speech Recognition, pre-send editing, and prominent SignVisualizer)
 * 4. 💬 LIVE TWO-WAY CONVERSATION (Role-neutral bridge with distinct visual symbols & actions)
 * 5. ACCESSIBILITY SUITE (High contrast, text scaling, reduced motion, voice speech controls)
 * 6. SIGN DICTIONARY & SESSION TRANSCRIPT
 */

document.addEventListener('DOMContentLoaded', () => {
    // ================= STATE STORE =================
    const state = {
        currentView: 'view-landing',
        isRecordingEnabled: true,
        isMuted: false,
        voiceRate: 1.0,
        voicePitch: 1.0,
        highContrast: false,
        reducedMotion: false,
        textSize: 'md',
        conversation: [],
        currentGesture: 'NO_GESTURE',
        currentGestureConf: 0,
        currentEmotion: 'neutral',
        holdProgress: 0,
        isListeningSpeech: false,
        speechRecognition: null,
        speechTimeout: null,
        visSequence: [],
        visCurrentIndex: 0,
        visTimer: null,
        visLoop: false,
        visPlaying: false,
        signsDictionary: {},
        isCommunicateActive: false,
        telemetryPollTimer: null,
        activeMediaStream: null,
        activeAudioStream: null,
        frameCaptureTimer: null,
        frameCaptureBusy: false
    };

    // ================= DOM ELEMENTS =================
    // View Navigation
    const navLinks = document.querySelectorAll('.nav-link[data-view]');
    const viewContainers = document.querySelectorAll('.view-container');
    const headerStartBtn = document.getElementById('header-start-btn');
    const heroStartBtn = document.getElementById('hero-start-btn');
    const ctaStartBtn = document.getElementById('cta-start-btn');
    const brandHomeLink = document.getElementById('brand-home-link');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const headerNav = document.getElementById('header-nav');

    // Camera & Sign Input
    const cameraStreamImg = document.getElementById('camera-stream');
    const cameraCaptureVideo = document.getElementById('camera-capture-video');
    const smartFrameEl = document.getElementById('smart-frame');
    const smartFrameText = document.getElementById('smart-frame-text');
    const toggleRecordBtn = document.getElementById('toggle-record-btn');
    const recordIcon = document.getElementById('record-icon');
    const recordText = document.getElementById('record-text');
    const muteToggleBtn = document.getElementById('mute-toggle-btn');
    const muteIcon = document.getElementById('mute-icon');
    const muteText = document.getElementById('mute-text');
    const toggleStreamBtn = document.getElementById('toggle-stream-btn');
    const currentGestureEl = document.getElementById('current-gesture');
    const gestureConfValEl = document.getElementById('gesture-conf-val');
    const currentEmotionEl = document.getElementById('current-emotion');
    const holdProgressValEl = document.getElementById('hold-progress-val');
    const holdProgressBarEl = document.getElementById('hold-progress-bar');
    const addToChatBtn = document.getElementById('add-to-chat-btn');
    const speakSignBtn = document.getElementById('speak-sign-btn');
    const tryAgainBtn = document.getElementById('try-again-btn');
    const clearSignBtn = document.getElementById('clear-sign-btn');
    const commFramingPill = document.getElementById('comm-framing-pill');
    const commFramingText = document.getElementById('comm-framing-text');
    const commFramingIcon = document.getElementById('comm-framing-icon');
    const commLightingPill = document.getElementById('comm-lighting-pill');
    const commLightingText = document.getElementById('comm-lighting-text');

    // Live Conversation
    const conversationFeed = document.getElementById('conversation-feed');
    const convEmptyState = document.getElementById('conv-empty-state');
    const directChatInput = document.getElementById('direct-chat-input');
    const directSendBtn = document.getElementById('direct-send-btn');
    const speakSentenceBtn = document.getElementById('speak-sentence-btn');
    const copyTranscriptBtn = document.getElementById('copy-transcript-btn');
    const undoMessageBtn = document.getElementById('undo-message-btn');
    const clearChatBtn = document.getElementById('clear-chat-btn');

    // Speech → Sign
    const speechToSignBtn = document.getElementById('speech-to-sign-btn');
    const micIcon = document.getElementById('mic-icon');
    const micText = document.getElementById('mic-text');
    const speechTextInput = document.getElementById('speech-text-input');
    const confirmShowSignBtn = document.getElementById('confirm-show-sign-btn');
    const editSpeechBtn = document.getElementById('edit-speech-btn');
    const retrySpeechBtn = document.getElementById('retry-speech-btn');
    const speechErrorBanner = document.getElementById('speech-error-banner');
    const speechErrorText = document.getElementById('speech-error-text');
    const errorRetryBtn = document.getElementById('error-retry-btn');
    const errorTypeBtn = document.getElementById('error-type-btn');

    // Sign Visualizer
    const visSequenceBar = document.getElementById('vis-sequence-bar');
    const visBadgeLarge = document.getElementById('vis-badge-large');
    const visIconLarge = document.getElementById('vis-icon-large');
    const visWordTitle = document.getElementById('vis-word-title');
    const visCategory = document.getElementById('vis-category');
    const visDescription = document.getElementById('vis-description');
    const visHandShape = document.getElementById('vis-hand-shape');
    const visMovement = document.getElementById('vis-movement');
    const visStepIndicator = document.getElementById('vis-step-indicator');
    const visPrevStep = document.getElementById('vis-prev-step');
    const visNextStep = document.getElementById('vis-next-step');
    const visReplayBtn = document.getElementById('vis-replay-btn');
    const visPauseBtn = document.getElementById('vis-pause-btn');
    const visLoopBtn = document.getElementById('vis-loop-btn');
    const visFallbackNotice = document.getElementById('vis-fallback-notice');
    const visFallbackText = document.getElementById('vis-fallback-text');
    const visEditTextBtn = document.getElementById('vis-edit-text-btn');
    const visTryAnotherBtn = document.getElementById('vis-try-another-btn');

    // Modals
    const accessibilityBtn = document.getElementById('accessibility-btn');
    const accessibilityModal = document.getElementById('accessibility-modal');
    const accCloseBtn = document.getElementById('acc-close-btn');
    const accSaveBtn = document.getElementById('acc-save-btn');
    const toggleContrastBtn = document.getElementById('toggle-contrast-btn');
    const toggleMotionBtn = document.getElementById('toggle-motion-btn');
    const textSizeSelect = document.getElementById('text-size-select');
    const speechRateSelect = document.getElementById('speech-rate-select');
    const speechPitchSelect = document.getElementById('speech-pitch-select');

    const helpBtn = document.getElementById('help-btn');
    const helpModal = document.getElementById('help-modal');
    const helpCloseBtn = document.getElementById('help-close-btn');
    const helpOkBtn = document.getElementById('help-ok-btn');

    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const settingsCloseBtn = document.getElementById('settings-close-btn');
    const settingsSaveBtn = document.getElementById('settings-save-btn');
    const footerPrivacyBtn = document.getElementById('footer-privacy-btn');

    // Telemetry Collapsible Drawer
    const telemetryToggleBtn = document.getElementById('telemetry-toggle-btn');
    const telemetryBody = document.getElementById('telemetry-body');
    const telemetryChevron = document.getElementById('telemetry-chevron');

    // My Signs & Transcript
    const signsCatalogGrid = document.getElementById('signs-catalog-grid');
    const filterChips = document.querySelectorAll('.filter-chip');
    const statTotalMsgs = document.getElementById('stat-total-msgs');
    const statSignMsgs = document.getElementById('stat-sign-msgs');
    const statVoiceMsgs = document.getElementById('stat-voice-msgs');
    const transcriptFullList = document.getElementById('transcript-full-list');
    const transcriptSearchInput = document.getElementById('transcript-search-input');
    const transcriptCopyAllBtn = document.getElementById('transcript-copy-all-btn');

    // ================= TOAST NOTIFICATION SYSTEM =================
    function showToast(message, iconClass = 'fa-solid fa-check text-emerald') {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<i class="${iconClass}"></i> <span>${message}</span>`;
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-6px)';
            toast.style.transition = 'all 0.25s ease';
            setTimeout(() => toast.remove(), 250);
        }, 3000);
    }

    // ================= BROWSER-SIDE CAMERA CAPTURE =================
    // The browser owns the camera (getUserMedia) and periodically ships a
    // JPEG snapshot to the backend for gesture/emotion inference. The
    // backend has no camera of its own — this is required for the feature
    // to work at all once deployed off the developer's own machine.
    let frameCaptureCanvas = null;

    async function startBrowserCameraCapture() {
        const standbyEl = document.getElementById('camera-standby-placeholder');

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            showToast('Camera access is not supported in this browser', 'fa-solid fa-triangle-exclamation text-amber');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 } },
                audio: false
            });
            state.activeMediaStream = stream;

            if (cameraCaptureVideo) {
                cameraCaptureVideo.srcObject = stream;
                await cameraCaptureVideo.play().catch(() => {});
            }

            if (standbyEl) standbyEl.classList.add('hidden');
            if (cameraStreamImg) cameraStreamImg.style.display = 'block';

            if (state.frameCaptureTimer) clearInterval(state.frameCaptureTimer);
            state.frameCaptureTimer = setInterval(captureAndSendFrame, 200);
        } catch (err) {
            console.error('[CAMERA] getUserMedia failed:', err);
            showToast('Camera permission denied or unavailable', 'fa-solid fa-video-slash text-rose');
            if (standbyEl) standbyEl.classList.remove('hidden');
        }
    }

    async function captureAndSendFrame() {
        if (!state.isCommunicateActive || state.frameCaptureBusy) return;
        if (!cameraCaptureVideo || cameraCaptureVideo.readyState < 2) return; // HAVE_CURRENT_DATA
        if (!cameraCaptureVideo.videoWidth || !cameraCaptureVideo.videoHeight) return;

        state.frameCaptureBusy = true;
        try {
            if (!frameCaptureCanvas) frameCaptureCanvas = document.createElement('canvas');
            frameCaptureCanvas.width = cameraCaptureVideo.videoWidth;
            frameCaptureCanvas.height = cameraCaptureVideo.videoHeight;
            const ctx = frameCaptureCanvas.getContext('2d');
            ctx.drawImage(cameraCaptureVideo, 0, 0, frameCaptureCanvas.width, frameCaptureCanvas.height);
            const dataUrl = frameCaptureCanvas.toDataURL('image/jpeg', 0.7);

            const res = await fetch('/api/process_frame', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: dataUrl })
            });
            if (!res.ok) return;
            const data = await res.json();
            if (data && data.success && data.annotated_image && cameraStreamImg && state.isCommunicateActive) {
                cameraStreamImg.src = data.annotated_image;
            }
        } catch (err) {
            // Transient network hiccup on one frame — not worth surfacing to the user.
        } finally {
            state.frameCaptureBusy = false;
        }
    }

    // ================= COMMUNICATION RESOURCE LIFECYCLE (PAGE-SCOPED) =================
    function startCommunicationSession() {
        if (state.isCommunicateActive && state.telemetryPollTimer) return;
        state.isCommunicateActive = true;

        // 1. Activate Camera (browser-captured, sent to the backend for
        // inference — the server has no camera of its own in production).
        startBrowserCameraCapture();

        // 2. Start Telemetry Polling (if not already polling)
        if (state.telemetryPollTimer) {
            clearInterval(state.telemetryPollTimer);
            state.telemetryPollTimer = null;
        }
        state.telemetryPollTimer = setInterval(pollTelemetry, 180);
        pollTelemetry(); // Fire initial poll immediately

        // 3. Reset indicators for active workspace
        if (commFramingPill) {
            commFramingPill.className = 'status-pill pill-neutral';
            if (commFramingText) commFramingText.textContent = 'Awaiting Hands';
            if (commFramingIcon) commFramingIcon.className = 'fa-regular fa-circle';
        }
        const commMicPill = document.getElementById('comm-mic-pill');
        if (commMicPill) {
            commMicPill.className = 'status-pill pill-good';
            const commMicText = document.getElementById('comm-mic-text');
            if (commMicText) commMicText.textContent = 'Mic Ready';
        }
    }

    function stopCommunicationSession() {
        state.isCommunicateActive = false;

        // 1. Cancel Browser Speech Synthesis immediately
        if ('speechSynthesis' in window) {
            try {
                window.speechSynthesis.cancel();
            } catch (e) {}
        }

        // 2. Stop Any HTML Audio Elements
        document.querySelectorAll('audio').forEach(audio => {
            try {
                audio.pause();
                audio.currentTime = 0;
            } catch (e) {}
        });

        // 3. Stop Telemetry Polling Interval
        if (state.telemetryPollTimer) {
            clearInterval(state.telemetryPollTimer);
            state.telemetryPollTimer = null;
        }

        // 4. Sever Video Stream & Clean MediaStream
        if (state.frameCaptureTimer) {
            clearInterval(state.frameCaptureTimer);
            state.frameCaptureTimer = null;
        }
        if (cameraStreamImg) {
            cameraStreamImg.src = '';
            cameraStreamImg.removeAttribute('src');
            cameraStreamImg.style.display = 'none';
        }
        if (cameraCaptureVideo) {
            cameraCaptureVideo.srcObject = null;
        }
        const standbyEl = document.getElementById('camera-standby-placeholder');
        if (standbyEl) standbyEl.classList.remove('hidden');

        // 5. Clean up any active MediaStream tracks (Video & Audio)
        if (state.activeMediaStream) {
            try {
                state.activeMediaStream.getTracks().forEach(t => t.stop());
            } catch (e) {}
            state.activeMediaStream = null;
        }
        if (state.activeAudioStream) {
            try {
                state.activeAudioStream.getTracks().forEach(t => t.stop());
            } catch (e) {}
            state.activeAudioStream = null;
        }

        // 6. Stop / Abort Speech Recognition & Prevent Auto-Restart
        if (state.speechRecognition) {
            try {
                state.speechRecognition.abort();
            } catch (e) {}
            try {
                state.speechRecognition.stop();
            } catch (e) {}
        }
        state.isListeningSpeech = false;
        if (state.speechTimeout) {
            clearTimeout(state.speechTimeout);
            state.speechTimeout = null;
        }
        if (speechToSignBtn) speechToSignBtn.classList.remove('listening');
        if (micText) micText.textContent = 'Tap to Speak';

        // 7. Clear Sign Replay Timers
        if (state.visTimer) {
            clearInterval(state.visTimer);
            state.visTimer = null;
        }
        state.visPlaying = false;
        if (visReplayBtn) visReplayBtn.innerHTML = '<i class="fa-solid fa-play"></i> Replay';

        state.conversation.forEach(msg => {
            if (msg.signTimer) {
                clearInterval(msg.signTimer);
                msg.signTimer = null;
            }
        });

        // 8. Reset UI Smart Frame Overlays and Telemetry values
        if (smartFrameEl) {
            smartFrameEl.className = 'smart-frame-overlay framed-waiting';
            if (smartFrameText) smartFrameText.innerHTML = '<i class="fa-solid fa-hand"></i> Place hands inside guide box';
        }
        if (holdProgressBarEl) holdProgressBarEl.style.width = '0%';
        if (holdProgressValEl) holdProgressValEl.textContent = '0%';
        if (currentGestureEl) currentGestureEl.textContent = 'Waiting for gesture...';
        if (gestureConfValEl) gestureConfValEl.textContent = 'Confidence: 0%';

        // 9. Reset backend sentence builder so pending holds don't bleed into future sessions
        fetch('/api/sentence/clear', { method: 'POST' }).catch(() => {});
    }

    // ================= VIEW SWITCHING & ROUTING =================
    function switchView(targetViewId) {
        state.currentView = targetViewId;
        viewContainers.forEach(container => {
            if (container.id === targetViewId) {
                container.classList.add('active-view');
            } else {
                container.classList.remove('active-view');
            }
        });

        // Update nav links
        navLinks.forEach(link => {
            if (link.getAttribute('data-view') === targetViewId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Close mobile menu if open
        if (headerNav) headerNav.classList.remove('mobile-active');

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Update URL hash without jumping
        const hash = targetViewId === 'view-landing' ? '#home' :
                     targetViewId === 'view-communicate' ? '#communicate' :
                     targetViewId === 'view-my-signs' ? '#my-signs' :
                     targetViewId === 'view-transcript' ? '#transcript' : '#home';
        history.replaceState(null, '', hash);

        // PAGE-SCOPED RESOURCE MANAGEMENT
        if (targetViewId === 'view-communicate') {
            startCommunicationSession();
        } else {
            stopCommunicationSession();
        }

        // View-specific initialization
        if (targetViewId === 'view-my-signs') {
            loadSignsCatalog();
        } else if (targetViewId === 'view-transcript') {
            renderTranscriptView();
        }
    }

    // Bind nav links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetView = link.getAttribute('data-view');
            if (targetView) switchView(targetView);
        });
    });

    if (brandHomeLink) {
        brandHomeLink.addEventListener('click', (e) => {
            e.preventDefault();
            switchView('view-landing');
        });
    }

    // CTA buttons to open communicate workspace
    [headerStartBtn, heroStartBtn, ctaStartBtn].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                switchView('view-communicate');
                showToast('Welcome to SignSyncro Workspace!', 'fa-solid fa-hands-asl-interpreting');
            });
        }
    });

    const heroHowBtn = document.getElementById('hero-how-btn');
    const navHowItWorks = document.getElementById('nav-how-it-works');
    [heroHowBtn, navHowItWorks].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (state.currentView !== 'view-landing') {
                    switchView('view-landing');
                }
                const section = document.getElementById('how-it-works-section');
                if (section) section.scrollIntoView({ behavior: 'smooth' });
            });
        }
    });

    // Mobile Hamburger Toggle
    if (mobileMenuBtn && headerNav) {
        mobileMenuBtn.addEventListener('click', () => {
            headerNav.classList.toggle('mobile-active');
        });
    }

    // Check Initial Hash
    function initRoute() {
        const hash = window.location.hash.toLowerCase();
        if (hash === '#communicate') {
            switchView('view-communicate');
        } else if (hash === '#my-signs') {
            switchView('view-my-signs');
        } else if (hash === '#transcript') {
            switchView('view-transcript');
        } else if (hash === '#how-it-works') {
            switchView('view-landing');
            const section = document.getElementById('how-it-works-section');
            if (section) setTimeout(() => section.scrollIntoView({ behavior: 'smooth' }), 60);
        } else {
            switchView('view-landing');
        }
    }

    // ================= TELEMETRY POLLING & LIVE CAMERA SENSORS =================
    let lastSpokenGesture = null;
    let gestureStableCounter = 0;
    let noGestureCounter = 0;

    async function pollTelemetry() {
        if (!state.isCommunicateActive) return;
        try {
            const res = await fetch('/api/status');
            if (!res.ok) return;
            if (!state.isCommunicateActive) return;
            const data = await res.json();
            if (!state.isCommunicateActive) return;

            // Update gesture and emotion state
            state.currentGesture = data.gesture || 'NO_GESTURE';
            state.currentGestureConf = data.gesture_conf || 0;
            state.currentEmotion = data.emotion || 'neutral';
            state.holdProgress = data.hold_progress || 0;

            // Update UI elements
            if (currentGestureEl) {
                currentGestureEl.textContent = state.currentGesture !== 'NO_GESTURE' ? state.currentGesture : 'Waiting for gesture...';
            }
            if (gestureConfValEl) {
                gestureConfValEl.textContent = `Confidence: ${Math.round(state.currentGestureConf * 100)}%`;
            }
            if (currentEmotionEl) {
                currentEmotionEl.textContent = state.currentEmotion.toUpperCase();
            }

            // Update hold progress bar
            if (holdProgressBarEl) {
                const pct = Math.min(100, Math.round(state.holdProgress * 100));
                holdProgressBarEl.style.width = `${pct}%`;
                if (holdProgressValEl) holdProgressValEl.textContent = `${pct}%`;
            }

            // Update Smart Frame Visual Guidance (Symbol + Text)
            const framedStatus = data.hand_framed || 'WAITING';
            if (smartFrameEl) {
                smartFrameEl.className = 'smart-frame-overlay';
                if (framedStatus === 'FRAMED') {
                    smartFrameEl.classList.add('framed-ready');
                    if (smartFrameText) smartFrameText.innerHTML = '<i class="fa-solid fa-check text-emerald"></i> Ready to sign';
                    if (commFramingPill) {
                        commFramingPill.className = 'status-pill pill-good';
                        commFramingText.textContent = 'Hands Detected';
                        commFramingIcon.className = 'fa-solid fa-check';
                    }
                } else if (framedStatus === 'EDGE_WARNING') {
                    smartFrameEl.classList.add('framed-adjust');
                    if (smartFrameText) smartFrameText.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-amber"></i> Center your hands';
                    if (commFramingPill) {
                        commFramingPill.className = 'status-pill pill-warn';
                        commFramingText.textContent = 'Center Hands';
                        commFramingIcon.className = 'fa-solid fa-triangle-exclamation';
                    }
                } else {
                    smartFrameEl.classList.add('framed-waiting');
                    if (smartFrameText) smartFrameText.innerHTML = '<i class="fa-solid fa-hand"></i> Place hands inside guide box';
                    if (commFramingPill) {
                        commFramingPill.className = 'status-pill pill-neutral';
                        commFramingText.textContent = 'Awaiting Hands';
                        commFramingIcon.className = 'fa-regular fa-circle';
                    }
                }
            }

            // Lighting indicator
            const lighting = data.lighting_status || 'GOOD';
            if (commLightingPill) {
                if (lighting === 'GOOD') {
                    commLightingPill.className = 'status-pill pill-good';
                    commLightingText.textContent = 'Good Lighting';
                } else {
                    commLightingPill.className = 'status-pill pill-warn';
                    commLightingText.textContent = 'Improve Lighting';
                }
            }

            // Auto-Commit Trigger: When gesture held for 0.70s (ONLY within active Communicate workspace)
            if (state.isCommunicateActive && state.isRecordingEnabled && state.holdProgress >= 1.0 && state.currentGesture !== 'NO_GESTURE') {
                noGestureCounter = 0;
                if (state.currentGesture !== lastSpokenGesture) {
                    lastSpokenGesture = state.currentGesture;

                    const phrase = (data.sentence && data.sentence.length > 0) ? data.sentence : (data.phrase || state.currentGesture);
                    const wordsCount = (data.sentence_words && data.sentence_words.length) || 1;
                    const lastMsg = state.conversation[state.conversation.length - 1];

                    // Check if previous message in conversation was an interim part of this ongoing sign sentence
                    if (lastMsg && lastMsg.source === 'sign' && lastMsg.isAutoSequence && wordsCount > 1) {
                        // Update the message in-place to the full smart sentence
                        lastMsg.text = phrase;
                        lastMsg.emotion = state.currentEmotion;
                        lastMsg.words = data.sentence_words;
                        renderConversationFeed();
                        updateTranscriptStats();
                        if (!state.isMuted && state.isCommunicateActive) speakText(phrase);
                        showToast(`Sentence Formed: "${phrase}"`, 'fa-solid fa-sparkles text-amber');
                        return;
                    }

                    // Avoid duplicate consecutive identical messages
                    if (lastMsg && lastMsg.source === 'sign' && lastMsg.text === phrase) {
                        return;
                    }

                    addMessageToConversation('sign', phrase, state.currentEmotion, true);
                    if (!state.isMuted && state.isCommunicateActive) {
                        speakText(phrase);
                    }
                }
            } else if (state.currentGesture === 'NO_GESTURE') {
                noGestureCounter = (noGestureCounter || 0) + 1;
                // Only reset lastSpokenGesture if hand is lowered for at least 5 consecutive polls (~900ms)
                if (noGestureCounter >= 5) {
                    lastSpokenGesture = null;
                }
                // Hands rested for > 2.2s: finalize sequence so next gesture starts new
                if (noGestureCounter >= 12) {
                    const lastMsg = state.conversation[state.conversation.length - 1];
                    if (lastMsg) lastMsg.isAutoSequence = false;
                }
            }

        } catch (err) {
            // Server temporarily unreachable
        }
    }

    // Refresh Camera View (Only active inside Communicate session)
    if (toggleStreamBtn) {
        toggleStreamBtn.addEventListener('click', () => {
            if (!state.isCommunicateActive) return;
            startBrowserCameraCapture();
            showToast('Camera feed refreshed', 'fa-solid fa-rotate');
        });
    }

    // Toggle Auto-Record
    if (toggleRecordBtn) {
        toggleRecordBtn.addEventListener('click', () => {
            state.isRecordingEnabled = !state.isRecordingEnabled;
            if (state.isRecordingEnabled) {
                recordIcon.className = 'fa-solid fa-circle text-rose';
                recordText.textContent = 'Auto-Record ON';
                showToast('Gesture auto-recording active');
            } else {
                recordIcon.className = 'fa-regular fa-circle text-muted';
                recordText.textContent = 'Auto-Record OFF';
                showToast('Gesture auto-recording paused', 'fa-solid fa-pause');
            }
        });
    }

    // Toggle Voice Mute
    if (muteToggleBtn) {
        muteToggleBtn.addEventListener('click', () => {
            state.isMuted = !state.isMuted;
            if (state.isMuted) {
                muteIcon.className = 'fa-solid fa-volume-xmark text-muted';
                muteText.textContent = 'Voice Muted';
                showToast('Spoken voice muted', 'fa-solid fa-volume-xmark');
            } else {
                muteIcon.className = 'fa-solid fa-volume-high text-emerald';
                muteText.textContent = 'Voice ON';
                showToast('Spoken voice active', 'fa-solid fa-volume-high');
            }
        });
    }

    // ================= CURRENT SIGN BUTTON ACTIONS =================
    if (addToChatBtn) {
        addToChatBtn.addEventListener('click', () => {
            if (state.currentGesture && state.currentGesture !== 'NO_GESTURE') {
                addMessageToConversation('sign', state.currentGesture, state.currentEmotion);
                if (!state.isMuted) speakText(state.currentGesture);
                showToast(`Added sign: "${state.currentGesture}"`);
            } else {
                showToast('Please perform a gesture in view first', 'fa-solid fa-triangle-exclamation');
            }
        });
    }

    if (speakSignBtn) {
        speakSignBtn.addEventListener('click', () => {
            if (state.currentGesture && state.currentGesture !== 'NO_GESTURE') {
                speakText(state.currentGesture);
            } else {
                showToast('No gesture recognized to speak', 'fa-solid fa-triangle-exclamation');
            }
        });
    }

    if (tryAgainBtn) {
        tryAgainBtn.addEventListener('click', () => {
            state.holdProgress = 0;
            if (holdProgressBarEl) holdProgressBarEl.style.width = '0%';
            showToast('Ready for new gesture');
        });
    }

    if (clearSignBtn) {
        clearSignBtn.addEventListener('click', () => {
            state.currentGesture = 'NO_GESTURE';
            if (currentGestureEl) currentGestureEl.textContent = 'NO_GESTURE';
            if (gestureConfValEl) gestureConfValEl.textContent = 'Confidence: 0%';
            if (holdProgressBarEl) holdProgressBarEl.style.width = '0%';
        });
    }

    // Predictive suggestions chips
    const suggestChips = document.querySelectorAll('.suggest-chip');
    suggestChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const word = chip.getAttribute('data-word');
            if (word) {
                addMessageToConversation('sign', word, 'neutral');
                if (!state.isMuted) speakText(word);
                showToast(`Added sign: "${word}"`);
            }
        });
    });

    // Quick Needs Buttons
    const quickNeedBtns = document.querySelectorAll('.quick-need-btn');
    quickNeedBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const phrase = btn.getAttribute('data-phrase') || btn.getAttribute('data-word');
            addMessageToConversation('sign', phrase, 'urgent');
            if (!state.isMuted) speakText(phrase);
            showToast(`Quick message sent: "${phrase}"`);
        });
    });

    // ================= LIVE TWO-WAY CONVERSATION SYSTEM & ISL AVATAR =================
    function startAvatarPlayback(msgObj) {
        if (!msgObj || !msgObj.signData || msgObj.signData.length === 0) return;
        if (msgObj.signTimer) {
            clearInterval(msgObj.signTimer);
            msgObj.signTimer = null;
        }
        msgObj.isPlaying = true;

        if (msgObj.signData.length === 1) {
            msgObj.signCurrentIndex = 0;
            renderConversationFeed();
            return;
        }

        const intervalMs = Math.round(1350 / (msgObj.signSpeed || 1.0));
        msgObj.signTimer = setInterval(() => {
            if (msgObj.signCurrentIndex < msgObj.signData.length - 1) {
                msgObj.signCurrentIndex++;
                renderConversationFeed();
            } else {
                clearInterval(msgObj.signTimer);
                msgObj.signTimer = null;
                msgObj.isPlaying = false;
                renderConversationFeed();
            }
        }, intervalMs);
    }

    function stopAvatarPlayback(msgObj) {
        if (!msgObj) return;
        if (msgObj.signTimer) {
            clearInterval(msgObj.signTimer);
            msgObj.signTimer = null;
        }
        msgObj.isPlaying = false;
        renderConversationFeed();
    }

    async function fetchSignForMessage(msgObj) {
        if (!msgObj || !msgObj.text) return;
        try {
            const res = await fetch('/api/text_to_sign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: msgObj.text })
            });
            const data = await res.json();
            if (data.success && data.mapped_signs && data.mapped_signs.length > 0) {
                msgObj.signStatus = 'ready';
                msgObj.signData = data.mapped_signs;
                msgObj.signCurrentIndex = 0;
                renderConversationFeed();
                // Automatically begin visual sign performance!
                startAvatarPlayback(msgObj);
            } else {
                msgObj.signStatus = 'unavailable';
                msgObj.signData = [];
                msgObj.signUnmapped = data.unmapped_words || [];
                renderConversationFeed();
            }
        } catch (err) {
            console.error('[SIGN FETCH ERROR]', err);
            msgObj.signStatus = 'unavailable';
            msgObj.signData = [];
            renderConversationFeed();
        }
    }

    function createVoiceMessageWithSign(text) {
        if (!text || !text.trim()) return null;

        const msgObj = {
            id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            source: 'voice',
            text: text.trim(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            signStatus: 'loading',
            signData: [],
            signCurrentIndex: 0,
            signSpeed: 1.0,
            isPlaying: false,
            signTimer: null,
            detailsOpen: false
        };

        state.conversation.push(msgObj);
        renderConversationFeed();
        updateTranscriptStats();
        fetchSignForMessage(msgObj);
        return msgObj;
    }

    function addMessageToConversation(source, text, emotion = 'neutral', isAutoSequence = false) {
        if (!text || !text.trim()) return null;

        const msgObj = {
            id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            source: source, // 'sign', 'voice', 'text'
            text: text.trim(),
            emotion: emotion,
            isAutoSequence: isAutoSequence,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            signStatus: 'ready',
            signData: [],
            signCurrentIndex: 0,
            signTimer: null
        };

        state.conversation.push(msgObj);
        renderConversationFeed();
        updateTranscriptStats();
        return msgObj;
    }

    function renderConversationFeed() {
        if (!conversationFeed) return;

        if (state.conversation.length === 0) {
            conversationFeed.innerHTML = `
                <div class="conv-empty-state" id="conv-empty-state">
                    <i class="fa-regular fa-comment-dots"></i>
                    <strong>Start a conversation</strong>
                    <p>Show a sign in the camera, tap the microphone to speak, or select a phrase below.</p>
                </div>
            `;
            return;
        }

        conversationFeed.innerHTML = '';

        // Only the newest message gets the full signing stage — it must always
        // be fully visible without scrolling. Older messages render compactly
        // inside their own scrollable history strip so they can never push the
        // current sign/avatar off-screen.
        const historyMsgs = state.conversation.slice(0, -1);
        const latestMsg = state.conversation[state.conversation.length - 1];

        if (historyMsgs.length > 0) {
            const historyWrap = document.createElement('div');
            historyWrap.className = 'conv-history-scroll';
            historyWrap.id = 'conv-history-scroll';
            historyMsgs.forEach(msg => historyWrap.appendChild(buildConvBubble(msg, true)));
            conversationFeed.appendChild(historyWrap);
        }

        const pinnedWrap = document.createElement('div');
        pinnedWrap.className = 'conv-current-pinned ' + (latestMsg.source === 'voice' ? 'pinned-fill' : 'pinned-compact');
        pinnedWrap.id = 'conv-current-pinned';
        pinnedWrap.appendChild(buildConvBubble(latestMsg, false));
        conversationFeed.appendChild(pinnedWrap);

        // Keep the history strip scrolled to its newest entry; the pinned
        // current message never scrolls, so it needs no such handling.
        const historyScrollEl = document.getElementById('conv-history-scroll');
        if (historyScrollEl) historyScrollEl.scrollTop = historyScrollEl.scrollHeight;

        // Bind Read buttons
        conversationFeed.querySelectorAll('.btn-read-msg').forEach(btn => {
            btn.addEventListener('click', () => {
                const text = btn.getAttribute('data-text');
                if (text) speakText(text);
            });
        });

        // Bind Stepper Chip Click (Jumps directly to that sign)
        conversationFeed.querySelectorAll('.avatar-step-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                const msgId = btn.getAttribute('data-msg-id');
                const stepIdx = parseInt(btn.getAttribute('data-step-idx'), 10);
                const msg = state.conversation.find(m => m.id === msgId);
                if (msg) {
                    if (msg.signTimer) {
                        clearInterval(msg.signTimer);
                        msg.signTimer = null;
                        msg.isPlaying = false;
                    }
                    msg.signCurrentIndex = stepIdx;
                    renderConversationFeed();
                }
            });
        });

        // Bind Prev Sign Buttons
        conversationFeed.querySelectorAll('.btn-prev-sign').forEach(btn => {
            btn.addEventListener('click', () => {
                const msgId = btn.getAttribute('data-msg-id');
                const msg = state.conversation.find(m => m.id === msgId);
                if (msg && msg.signCurrentIndex > 0) {
                    if (msg.signTimer) {
                        clearInterval(msg.signTimer);
                        msg.signTimer = null;
                        msg.isPlaying = false;
                    }
                    msg.signCurrentIndex--;
                    renderConversationFeed();
                }
            });
        });

        // Bind Next Sign Buttons
        conversationFeed.querySelectorAll('.btn-next-sign').forEach(btn => {
            btn.addEventListener('click', () => {
                const msgId = btn.getAttribute('data-msg-id');
                const msg = state.conversation.find(m => m.id === msgId);
                if (msg && msg.signCurrentIndex < (msg.signData.length - 1)) {
                    if (msg.signTimer) {
                        clearInterval(msg.signTimer);
                        msg.signTimer = null;
                        msg.isPlaying = false;
                    }
                    msg.signCurrentIndex++;
                    renderConversationFeed();
                }
            });
        });

        // Bind Play / Pause Toggle Buttons
        conversationFeed.querySelectorAll('.btn-play-toggle').forEach(btn => {
            btn.addEventListener('click', () => {
                const msgId = btn.getAttribute('data-msg-id');
                const msg = state.conversation.find(m => m.id === msgId);
                if (!msg) return;

                if (msg.isPlaying) {
                    stopAvatarPlayback(msg);
                } else {
                    if (msg.signCurrentIndex >= msg.signData.length - 1) {
                        msg.signCurrentIndex = 0;
                    }
                    startAvatarPlayback(msg);
                }
            });
        });

        // Bind Replay Buttons
        conversationFeed.querySelectorAll('.btn-replay-avatar').forEach(btn => {
            btn.addEventListener('click', () => {
                const msgId = btn.getAttribute('data-msg-id');
                const msg = state.conversation.find(m => m.id === msgId);
                if (msg && msg.signData && msg.signData.length > 0) {
                    msg.signCurrentIndex = 0;
                    startAvatarPlayback(msg);
                }
            });
        });

        // Bind Playback Speed Chips
        conversationFeed.querySelectorAll('.speed-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                const msgId = btn.getAttribute('data-msg-id');
                const speed = parseFloat(btn.getAttribute('data-speed')) || 1.0;
                const msg = state.conversation.find(m => m.id === msgId);
                if (msg) {
                    msg.signSpeed = speed;
                    if (msg.isPlaying) {
                        startAvatarPlayback(msg);
                    } else {
                        renderConversationFeed();
                    }
                }
            });
        });

        // Bind Technical Details Drawer Toggles
        conversationFeed.querySelectorAll('.avatar-details-toggle').forEach(btn => {
            btn.addEventListener('click', () => {
                const msgId = btn.getAttribute('data-msg-id');
                const msg = state.conversation.find(m => m.id === msgId);
                if (msg) {
                    msg.detailsOpen = !msg.detailsOpen;
                    renderConversationFeed();
                }
            });
        });

        // Bind In-Place Edit Buttons
        conversationFeed.querySelectorAll('.btn-edit-msg').forEach(btn => {
            btn.addEventListener('click', () => {
                const msgId = btn.getAttribute('data-msg-id');
                const msg = state.conversation.find(m => m.id === msgId);
                if (!msg) return;

                const textWrap = document.getElementById(`text-wrap-${msgId}`);
                if (!textWrap) return;

                textWrap.innerHTML = `
                    <div class="inline-edit-box">
                        <input type="text" class="inline-edit-input" id="input-${msgId}" value="${escapeHtml(msg.text)}">
                        <div class="inline-edit-actions">
                            <button class="btn btn-xs btn-primary btn-save-edit" data-msg-id="${msgId}">
                                <i class="fa-solid fa-check"></i> Save &amp; Update Sign
                            </button>
                            <button class="btn btn-xs btn-outline btn-cancel-edit" data-msg-id="${msgId}">
                                Cancel
                            </button>
                        </div>
                    </div>
                `;

                const editInput = document.getElementById(`input-${msgId}`);
                if (editInput) {
                    editInput.focus();
                    editInput.select();
                }

                const saveBtn = textWrap.querySelector('.btn-save-edit');
                if (saveBtn) {
                    saveBtn.addEventListener('click', () => {
                        const newText = editInput.value.trim();
                        if (newText) {
                            if (msg.signTimer) {
                                clearInterval(msg.signTimer);
                                msg.signTimer = null;
                            }
                            msg.text = newText;
                            msg.signStatus = 'loading';
                            msg.signData = [];
                            msg.signCurrentIndex = 0;
                            msg.isPlaying = false;
                            renderConversationFeed();
                            fetchSignForMessage(msg);
                            showToast('Message and sign updated', 'fa-solid fa-sparkles text-amber');
                        }
                    });
                }

                const cancelBtn = textWrap.querySelector('.btn-cancel-edit');
                if (cancelBtn) {
                    cancelBtn.addEventListener('click', () => {
                        renderConversationFeed();
                    });
                }
            });
        });
    }

    function buildConvBubble(msg, compact) {
        const bubble = document.createElement('div');
        bubble.className = `conv-msg-bubble msg-${msg.source}` + (compact ? ' msg-compact' : ' msg-current');
        bubble.id = `bubble-${msg.id}`;

        if (msg.source === 'sign') {
            const emotionBadge = (msg.emotion && msg.emotion !== 'neutral')
                ? `<span style="font-size: 0.72rem; color: var(--color-blue); font-weight: 600;">(${escapeHtml(msg.emotion)})</span>`
                : '';

            bubble.innerHTML = `
                <div class="msg-header-row">
                    <span class="msg-source-tag">
                        <i class="fa-solid fa-hand"></i> Sign Input ${emotionBadge}
                    </span>
                    <span class="msg-timestamp">${msg.timestamp}</span>
                </div>
                <div class="msg-content-text">${escapeHtml(msg.text)}</div>
                <div class="msg-actions-row">
                    <button class="btn btn-xs btn-outline btn-read-msg" data-text="${escapeHtml(msg.text)}" title="Read message aloud">
                        <i class="fa-solid fa-volume-high"></i> Read
                    </button>
                </div>
            `;
            return bubble;
        }

        if (msg.source === 'voice' && compact) {
            let signHint = '';
            if (msg.signStatus === 'ready' && msg.signData && msg.signData.length > 0) {
                const words = msg.signData.map(s => s.word).join(' → ');
                signHint = `<div class="compact-sign-hint"><i class="fa-solid fa-hands"></i> Signed: ${escapeHtml(words)}</div>`;
            } else if (msg.signStatus === 'loading') {
                signHint = `<div class="compact-sign-hint"><i class="fa-solid fa-spinner fa-spin"></i> Preparing sign…</div>`;
            }

            bubble.innerHTML = `
                <div class="msg-header-row">
                    <span class="msg-source-tag">
                        <i class="fa-solid fa-microphone text-amber"></i> Voice Input
                    </span>
                    <span class="msg-timestamp">${msg.timestamp}</span>
                </div>
                <div class="msg-content-text">${escapeHtml(msg.text)}</div>
                ${signHint}
                <div class="msg-actions-row">
                    <button class="btn btn-xs btn-outline btn-read-msg" data-text="${escapeHtml(msg.text)}" title="Read message aloud">
                        <i class="fa-solid fa-volume-high"></i> Read
                    </button>
                </div>
            `;
            return bubble;
        }

        if (msg.source === 'voice') {
                // PRIMARY VISUAL PERFORMANCE: Photorealistic ISL Signing Presenter (Asha)
                let signInnerHtml = '';
                if (msg.signStatus === 'loading') {
                    signInnerHtml = `
                        <div class="inline-sign-loading">
                            <i class="fa-solid fa-spinner fa-spin text-blue"></i>
                            <span>Preparing Indian Sign Language performance...</span>
                        </div>
                    `;
                } else if (msg.signStatus === 'ready' && msg.signData && msg.signData.length > 0) {
                    const curIdx = msg.signCurrentIndex || 0;
                    const curSign = msg.signData[curIdx] || msg.signData[0];
                    const avatarSrc = curSign.avatar_img || `/static/img/avatar_isl/${curSign.word.toLowerCase().replace(' ', '_')}.jpg`;
                    const isPlaying = !!msg.isPlaying;
                    const currentSpeed = msg.signSpeed || 1.0;

                    signInnerHtml = `
                        <div class="avatar-stage-card">
                            <div class="avatar-stage-header">
                                <span class="isl-tag">
                                    <i class="fa-solid fa-hands-asl-interpreting"></i> Indian Sign Language (ISL)
                                </span>
                                <span class="presenter-tag">
                                    <i class="fa-solid fa-user-check text-emerald"></i> Presenter: Asha
                                </span>
                            </div>

                            <div class="avatar-stage-viewport">
                                <img src="${avatarSrc}" class="avatar-stage-img anim-pulse" alt="ISL Sign for ${escapeHtml(curSign.word)}" onerror="this.src='/static/img/avatar_isl/idle.jpg'">
                                <div class="avatar-current-overlay">
                                    <span class="avatar-current-word">${escapeHtml(curSign.word)}</span>
                                    <span class="avatar-current-category">${escapeHtml(curSign.category || 'ISL')}</span>
                                </div>
                                ${msg.signData.length > 1 ? `<span class="avatar-counter-badge">Sign ${curIdx + 1} of ${msg.signData.length}</span>` : ''}
                            </div>

                            <!-- Stepper Chips Progression -->
                            ${msg.signData.length > 1 ? `
                                <div class="avatar-stepper-wrap" style="padding: 10px 14px 4px;">
                                    <div class="avatar-stepper">
                                        ${msg.signData.map((s, idx) => `
                                            <button class="avatar-step-chip ${idx === curIdx ? 'active' : ''}" data-msg-id="${msg.id}" data-step-idx="${idx}">
                                                ${idx === curIdx ? '<span class="chip-dot"></span>' : ''}
                                                <span>${idx + 1}.</span> <strong>${escapeHtml(s.word)}</strong>
                                            </button>
                                            ${idx < msg.signData.length - 1 ? '<i class="fa-solid fa-arrow-right inline-step-arrow"></i>' : ''}
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}

                            <!-- Playback Controls & Speed Bar -->
                            <div class="avatar-playback-bar" style="margin: 8px 12px 10px;">
                                <div class="avatar-playback-actions">
                                    ${msg.signData.length > 1 ? `
                                        <button class="avatar-ctrl-btn btn-prev-sign" data-msg-id="${msg.id}" title="Previous sign" ${curIdx === 0 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                                            <i class="fa-solid fa-backward-step"></i> Prev
                                        </button>
                                    ` : ''}

                                    <button class="avatar-ctrl-btn btn-play-toggle ${isPlaying ? '' : 'btn-primary'}" data-msg-id="${msg.id}" title="${isPlaying ? 'Pause' : 'Play'}">
                                        <i class="fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}"></i> ${isPlaying ? 'Pause' : 'Play'}
                                    </button>

                                    <button class="avatar-ctrl-btn btn-replay-avatar" data-msg-id="${msg.id}" title="Replay from start">
                                        <i class="fa-solid fa-rotate-right"></i> Replay
                                    </button>

                                    ${msg.signData.length > 1 ? `
                                        <button class="avatar-ctrl-btn btn-next-sign" data-msg-id="${msg.id}" title="Next sign" ${curIdx >= msg.signData.length - 1 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                                            Next <i class="fa-solid fa-forward-step"></i>
                                        </button>
                                    ` : ''}
                                </div>

                                <!-- Speed Selector -->
                                <div class="speed-control-group">
                                    <span>Speed:</span>
                                    <button class="speed-chip ${currentSpeed === 0.75 ? 'active' : ''}" data-msg-id="${msg.id}" data-speed="0.75">0.75x</button>
                                    <button class="speed-chip ${currentSpeed === 1.0 ? 'active' : ''}" data-msg-id="${msg.id}" data-speed="1.0">1x</button>
                                    <button class="speed-chip ${currentSpeed === 1.25 ? 'active' : ''}" data-msg-id="${msg.id}" data-speed="1.25">1.25x</button>
                                </div>
                            </div>

                            <!-- Collapsible Technical Details (Subordinate to Visual) -->
                            <div class="avatar-details-drawer" style="margin: 0 12px 10px;">
                                <button class="avatar-details-toggle" data-msg-id="${msg.id}">
                                    <span><i class="fa-solid fa-circle-info text-blue"></i> Technical Sign Details</span>
                                    <i class="fa-solid fa-chevron-${msg.detailsOpen ? 'up' : 'down'}"></i>
                                </button>
                                <div class="avatar-details-body ${msg.detailsOpen ? '' : 'hidden'}" id="details-body-${msg.id}">
                                    <div><strong>Hand Shape:</strong> ${escapeHtml(curSign.hand_shape || 'Standard ISL configuration')}</div>
                                    <div><strong>Movement:</strong> ${escapeHtml(curSign.movement || 'Stationary or deliberate motion')}</div>
                                    ${curSign.description ? `<div><strong>Description:</strong> ${escapeHtml(curSign.description)}</div>` : ''}
                                </div>
                            </div>
                        </div>

                        <!-- Bottom Row: Spoken words + Edit + Read -->
                        <div class="inline-sign-bottom-bar">
                            <span class="inline-sign-phrase-label">&ldquo;${escapeHtml(msg.text)}&rdquo;</span>
                            <div class="inline-sign-actions">
                                <button class="btn btn-xs btn-outline btn-edit-msg" data-msg-id="${msg.id}" title="Edit spoken words">
                                    <i class="fa-solid fa-pen-to-square"></i> Edit
                                </button>
                                <button class="btn btn-xs btn-outline btn-read-msg" data-text="${escapeHtml(msg.text)}" title="Read message aloud">
                                    <i class="fa-solid fa-volume-high"></i> Read
                                </button>
                            </div>
                        </div>
                    `;
                } else {
                    // Unavailable fallback
                    signInnerHtml = `
                        <div class="inline-sign-unavailable">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <i class="fa-solid fa-circle-info text-amber"></i>
                                <span>Sign visualization isn't available for this phrase yet.</span>
                            </div>
                            <div class="inline-sign-actions">
                                <button class="btn btn-xs btn-outline btn-edit-msg" data-msg-id="${msg.id}">
                                    <i class="fa-solid fa-pen-to-square"></i> Edit / Type
                                </button>
                                <button class="btn btn-xs btn-outline btn-read-msg" data-text="${escapeHtml(msg.text)}">
                                    <i class="fa-solid fa-volume-high"></i> Read
                                </button>
                            </div>
                        </div>
                    `;
                }

                bubble.innerHTML = `
                    <div class="msg-header-row">
                        <span class="msg-source-tag">
                            <i class="fa-solid fa-microphone text-amber"></i> Voice Input
                        </span>
                        <span class="msg-timestamp">${msg.timestamp}</span>
                    </div>
                    <div class="msg-content-text" id="text-wrap-${msg.id}">${escapeHtml(msg.text)}</div>
                    <div class="inline-sign-container">
                        ${signInnerHtml}
                    </div>
                `;
            return bubble;
        }

        // Text input
        bubble.innerHTML = `
            <div class="msg-header-row">
                <span class="msg-source-tag">
                    <i class="fa-solid fa-keyboard"></i> Text Input
                </span>
                <span class="msg-timestamp">${msg.timestamp}</span>
            </div>
            <div class="msg-content-text">${escapeHtml(msg.text)}</div>
            ${compact ? '' : `
            <div class="msg-actions-row">
                <button class="btn btn-xs btn-outline btn-read-msg" data-text="${escapeHtml(msg.text)}" title="Read message aloud">
                    <i class="fa-solid fa-volume-high"></i> Read
                </button>
            </div>`}
        `;
        return bubble;
    }

    function escapeHtml(string) {
        if (!string) return '';
        const div = document.createElement('div');
        div.innerText = string;
        return div.innerHTML;
    }

    // Direct Chat Input Send (Sends conversational message with automatic inline visual sign)
    if (directSendBtn && directChatInput) {
        const sendDirect = () => {
            const val = directChatInput.value.trim();
            if (val) {
                createVoiceMessageWithSign(val);
                directChatInput.value = '';
                showToast('Voice message & visual sign sent', 'fa-solid fa-microphone');
            }
        };
        directSendBtn.addEventListener('click', sendDirect);
        directChatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendDirect();
            }
        });
    }

    // Conversation Toolbar Actions
    if (speakSentenceBtn) {
        speakSentenceBtn.addEventListener('click', () => {
            if (state.conversation.length > 0) {
                const lastMsg = state.conversation[state.conversation.length - 1];
                speakText(lastMsg.text);
            } else {
                showToast('No messages to read aloud', 'fa-solid fa-circle-info');
            }
        });
    }

    if (copyTranscriptBtn) {
        copyTranscriptBtn.addEventListener('click', () => {
            if (state.conversation.length === 0) {
                showToast('Transcript is empty', 'fa-solid fa-circle-info');
                return;
            }
            const fullTranscript = state.conversation.map(m => `[${m.timestamp}] ${m.source.toUpperCase()}: ${m.text}`).join('\n');
            navigator.clipboard.writeText(fullTranscript).then(() => {
                showToast('Transcript copied to clipboard!', 'fa-solid fa-copy');
            });
        });
    }

    if (undoMessageBtn) {
        undoMessageBtn.addEventListener('click', () => {
            if (state.conversation.length > 0) {
                const removed = state.conversation.pop();
                renderConversationFeed();
                updateTranscriptStats();
                showToast(`Undid message: "${removed.text.substring(0, 20)}..."`, 'fa-solid fa-rotate-left');
            }
        });
    }

    if (clearChatBtn) {
        clearChatBtn.addEventListener('click', async () => {
            if (confirm('Clear the entire live conversation?')) {
                state.conversation = [];
                renderConversationFeed();
                updateTranscriptStats();
                try { await fetch('/api/sentence/clear', { method: 'POST' }); } catch(e) {}
                showToast('Conversation cleared', 'fa-solid fa-trash-can');
            }
        });
    }

    // ================= 🎙️ SPEECH RECOGNITION (SPEECH → SIGN) =================
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    function initSpeechRecognition() {
        if (!SpeechRecognition) {
            console.warn('[SPEECH] Web Speech API not supported in this browser.');
            return;
        }

        const recognizer = new SpeechRecognition();
        recognizer.continuous = false;
        recognizer.interimResults = true;
        recognizer.lang = 'en-US';

        let capturedSpeechText = '';

        recognizer.onstart = () => {
            state.isListeningSpeech = true;
            capturedSpeechText = '';
            if (speechToSignBtn) speechToSignBtn.classList.add('listening');
            if (micText) micText.textContent = 'Listening... Speak now';
            if (speechErrorBanner) speechErrorBanner.classList.add('hidden');
        };

        recognizer.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            capturedSpeechText = (finalTranscript || interimTranscript).trim();
            if (capturedSpeechText && micText) {
                micText.textContent = `“${capturedSpeechText}”`;
            }
        };

        recognizer.onerror = (event) => {
            console.error('[SPEECH ERROR]', event.error);
            stopSpeechRecognition();
            if (speechErrorBanner) {
                speechErrorBanner.classList.remove('hidden');
                if (speechErrorText) speechErrorText.textContent = `Could not recognize audio (${event.error}).`;
            }
        };

        recognizer.onend = () => {
            stopSpeechRecognition();
            if (!state.isCommunicateActive) {
                // Do not auto-send or restart if navigated away from Communicate
                capturedSpeechText = '';
                return;
            }
            // Automatically add message + inline sign representation directly below it!
            if (capturedSpeechText && capturedSpeechText.trim()) {
                const textToSend = capturedSpeechText.trim();
                capturedSpeechText = '';
                createVoiceMessageWithSign(textToSend);
                showToast(`Voice message: "${textToSend}"`, 'fa-solid fa-microphone');
            }
        };

        state.speechRecognition = recognizer;
    }

    function startSpeechRecognition() {
        if (!state.isCommunicateActive) return;
        if (!state.speechRecognition) initSpeechRecognition();
        if (state.speechRecognition) {
            try {
                state.speechRecognition.start();
            } catch (e) {
                // already active
            }
        } else {
            // Browser doesn't support Web Speech API
            const simulated = prompt('Speech recognition is not supported in this browser. Enter spoken phrase:');
            if (simulated && simulated.trim()) {
                createVoiceMessageWithSign(simulated.trim());
            }
        }
    }

    function stopSpeechRecognition() {
        state.isListeningSpeech = false;
        if (speechToSignBtn) speechToSignBtn.classList.remove('listening');
        if (micText) micText.textContent = 'Tap to Speak';
    }

    if (speechToSignBtn) {
        speechToSignBtn.addEventListener('click', () => {
            if (state.isListeningSpeech) {
                if (state.speechRecognition) state.speechRecognition.stop();
                stopSpeechRecognition();
            } else {
                startSpeechRecognition();
            }
        });
    }

    if (errorRetryBtn) {
        errorRetryBtn.addEventListener('click', () => {
            if (speechErrorBanner) speechErrorBanner.classList.add('hidden');
            startSpeechRecognition();
        });
    }

    if (errorTypeBtn && directChatInput) {
        errorTypeBtn.addEventListener('click', () => {
            if (speechErrorBanner) speechErrorBanner.classList.add('hidden');
            directChatInput.focus();
        });
    }

    // Quick partner phrases (One-Tap: Instantly creates message with inline visual sign)
    const quickPhraseBtns = document.querySelectorAll('.quick-phrase-btn');
    quickPhraseBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const phrase = btn.getAttribute('data-phrase');
            if (phrase) {
                createVoiceMessageWithSign(phrase);
                showToast(`Voice phrase sent: "${phrase}"`, 'fa-solid fa-bolt text-amber');
            }
        });
    });

    // ================= 👁️ SIGN VISUALIZER ENGINE =================
    async function loadSignVisualizer(text) {
        if (!text || !text.trim()) return;

        try {
            const res = await fetch('/api/text_to_sign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: text })
            });
            const data = await res.json();

            if (data.success && data.mapped_signs && data.mapped_signs.length > 0) {
                state.visSequence = data.mapped_signs;
                state.visCurrentIndex = 0;
                if (visFallbackNotice) visFallbackNotice.classList.add('hidden');
                renderSignVisualizerStage();
                startSignPlayback();
            } else {
                // Fallback state when phrase has no mapped signs
                state.visSequence = [];
                if (visFallbackNotice) {
                    visFallbackNotice.classList.remove('hidden');
                    if (visFallbackText) {
                        visFallbackText.textContent = `Sign visualization for "${text}" is not in the current dictionary yet.`;
                    }
                }
                if (visSequenceBar) {
                    visSequenceBar.innerHTML = `<span style="font-size: 0.8rem; color: var(--color-text-muted);">No matching signs in dictionary for this phrase.</span>`;
                }
            }
        } catch (err) {
            console.error('[VISUALIZER ERROR]', err);
        }
    }

    function renderSignVisualizerStage() {
        if (state.visSequence.length === 0) return;
        const current = state.visSequence[state.visCurrentIndex];
        if (!current) return;

        // Render Sequence Chips
        if (visSequenceBar) {
            visSequenceBar.innerHTML = '';
            state.visSequence.forEach((item, idx) => {
                const chip = document.createElement('button');
                chip.className = `vis-seq-chip ${idx === state.visCurrentIndex ? 'active' : ''}`;
                chip.innerHTML = `<span>${idx + 1}.</span> <strong>${item.word}</strong>`;
                chip.addEventListener('click', () => {
                    pauseSignPlayback();
                    state.visCurrentIndex = idx;
                    renderSignVisualizerStage();
                });
                visSequenceBar.appendChild(chip);
            });
        }

        // Render Main Stage
        if (visWordTitle) visWordTitle.textContent = current.word;
        if (visCategory) visCategory.textContent = current.category || 'Assistive';
        if (visDescription) visDescription.textContent = current.description || 'Perform sign as instructed.';
        if (visHandShape) visHandShape.textContent = current.hand_shape || 'Standard configuration';
        if (visMovement) visMovement.textContent = current.movement || 'Stationary or gentle motion';
        if (visIconLarge) visIconLarge.className = current.icon || 'fa-solid fa-hands-asl-interpreting';
        if (visStepIndicator) {
            visStepIndicator.textContent = `Sign ${state.visCurrentIndex + 1} of ${state.visSequence.length}`;
        }
    }

    function startSignPlayback() {
        pauseSignPlayback();
        state.visPlaying = true;
        if (visReplayBtn) visReplayBtn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Replaying';

        state.visTimer = setInterval(() => {
            if (state.visCurrentIndex < state.visSequence.length - 1) {
                state.visCurrentIndex++;
                renderSignVisualizerStage();
            } else {
                if (state.visLoop) {
                    state.visCurrentIndex = 0;
                    renderSignVisualizerStage();
                } else {
                    pauseSignPlayback();
                }
            }
        }, 1600); // 1.6s per sign
    }

    function pauseSignPlayback() {
        state.visPlaying = false;
        if (state.visTimer) {
            clearInterval(state.visTimer);
            state.visTimer = null;
        }
        if (visReplayBtn) visReplayBtn.innerHTML = '<i class="fa-solid fa-play"></i> Replay';
    }

    if (visReplayBtn) {
        visReplayBtn.addEventListener('click', () => {
            state.visCurrentIndex = 0;
            renderSignVisualizerStage();
            startSignPlayback();
        });
    }

    if (visPauseBtn) {
        visPauseBtn.addEventListener('click', () => {
            pauseSignPlayback();
            showToast('Playback paused', 'fa-solid fa-pause');
        });
    }

    if (visLoopBtn) {
        visLoopBtn.addEventListener('click', () => {
            state.visLoop = !state.visLoop;
            visLoopBtn.classList.toggle('active', state.visLoop);
            showToast(state.visLoop ? 'Looping enabled' : 'Looping disabled');
        });
    }

    if (visPrevStep) {
        visPrevStep.addEventListener('click', () => {
            pauseSignPlayback();
            if (state.visCurrentIndex > 0) {
                state.visCurrentIndex--;
                renderSignVisualizerStage();
            }
        });
    }

    if (visNextStep) {
        visNextStep.addEventListener('click', () => {
            pauseSignPlayback();
            if (state.visCurrentIndex < state.visSequence.length - 1) {
                state.visCurrentIndex++;
                renderSignVisualizerStage();
            }
        });
    }

    if (visEditTextBtn && speechTextInput) {
        visEditTextBtn.addEventListener('click', () => {
            speechTextInput.focus();
            speechTextInput.select();
        });
    }

    if (visTryAnotherBtn && speechTextInput) {
        visTryAnotherBtn.addEventListener('click', () => {
            speechTextInput.value = '';
            speechTextInput.focus();
        });
    }

    // ================= SPEECH SYNTHESIS (VOICE OUTPUT) =================
    function speakText(text) {
        if (!state.isCommunicateActive || !('speechSynthesis' in window) || state.isMuted) return;
        window.speechSynthesis.cancel(); // stop previous
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = state.voiceRate;
        utterance.pitch = state.voicePitch;
        window.speechSynthesis.speak(utterance);
    }

    // ================= MY SIGNS DICTIONARY =================
    async function loadSignsCatalog() {
        if (!signsCatalogGrid) return;
        try {
            const res = await fetch('/api/signs');
            const data = await res.json();
            if (data.success && data.signs) {
                state.signsDictionary = data.signs;
                renderSignsCatalog('all');
            }
        } catch (err) {
            console.error('[SIGNS CATALOG ERROR]', err);
        }
    }

    function renderSignsCatalog(filter = 'all') {
        if (!signsCatalogGrid) return;
        signsCatalogGrid.innerHTML = '';

        const signs = Object.values(state.signsDictionary);
        const filtered = filter === 'all' ? signs : signs.filter(s => s.category.toLowerCase() === filter.toLowerCase());

        filtered.forEach(sign => {
            const card = document.createElement('div');
            card.className = 'sign-card';
            const avatarImg = sign.avatar_img || '/static/img/avatar_isl/idle.jpg';
            card.innerHTML = `
                <div class="sign-card-thumb">
                    <img src="${avatarImg}" alt="${sign.word} - Asha ISL Avatar" loading="lazy">
                    <span class="avatar-badge-mini"><i class="fa-solid fa-person text-blue"></i> ISL Avatar</span>
                </div>
                <div class="sign-card-top">
                    <div class="sign-card-icon">
                        <i class="${sign.icon || 'fa-solid fa-hands-asl-interpreting'}"></i>
                    </div>
                    <span class="vis-category-pill">${sign.category}</span>
                </div>
                <h4 class="sign-card-title">${sign.word}</h4>
                <p class="sign-card-desc">${sign.description}</p>
                <div class="sign-specs-box">
                    <div><strong>Hand Shape:</strong> ${sign.hand_shape}</div>
                    <div><strong>Movement:</strong> ${sign.movement}</div>
                </div>
                <button class="btn btn-xs btn-outline btn-test-sign" style="margin-top: 4px;" data-word="${sign.word}">
                    <i class="fa-solid fa-person-walking-arrow-right text-blue"></i> View Avatar Sign
                </button>
            `;
            signsCatalogGrid.appendChild(card);
        });

        signsCatalogGrid.querySelectorAll('.btn-test-sign').forEach(btn => {
            btn.addEventListener('click', () => {
                const word = btn.getAttribute('data-word');
                switchView('view-communicate');
                loadSignVisualizer(word);
            });
        });
    }

    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            renderSignsCatalog(chip.getAttribute('data-filter'));
        });
    });

    // ================= TRANSCRIPT VIEW =================
    function updateTranscriptStats() {
        if (statTotalMsgs) statTotalMsgs.textContent = state.conversation.length;
        if (statSignMsgs) statSignMsgs.textContent = state.conversation.filter(m => m.source === 'sign').length;
        if (statVoiceMsgs) statVoiceMsgs.textContent = state.conversation.filter(m => m.source === 'voice').length;
    }

    function renderTranscriptView() {
        updateTranscriptStats();
        if (!transcriptFullList) return;

        const query = transcriptSearchInput ? transcriptSearchInput.value.toLowerCase().trim() : '';
        const list = query
            ? state.conversation.filter(m => m.text.toLowerCase().includes(query))
            : state.conversation;

        if (list.length === 0) {
            transcriptFullList.innerHTML = `
                <div style="text-align: center; color: var(--color-text-muted); padding: 30px 0;">
                    <i class="fa-solid fa-search fa-2x" style="margin-bottom: 8px; opacity: 0.5;"></i>
                    <p>${state.conversation.length === 0 ? 'No communication messages recorded yet.' : 'No matching messages found.'}</p>
                </div>
            `;
            return;
        }

        transcriptFullList.innerHTML = '';
        list.forEach(msg => {
            const row = document.createElement('div');
            row.className = 'transcript-row-item';
            const icon = msg.source === 'sign' ? 'fa-solid fa-hand text-blue' :
                         msg.source === 'voice' ? 'fa-solid fa-microphone text-amber' : 'fa-solid fa-keyboard text-navy';
            row.innerHTML = `
                <div class="t-icon-badge"><i class="${icon}"></i></div>
                <div class="t-content">
                    <div class="t-meta">
                        <span>${msg.source.toUpperCase()}</span>
                        <span>&bull;</span>
                        <span>${msg.timestamp}</span>
                    </div>
                    <div class="t-text">${escapeHtml(msg.text)}</div>
                </div>
            `;
            transcriptFullList.appendChild(row);
        });
    }

    if (transcriptSearchInput) {
        transcriptSearchInput.addEventListener('input', renderTranscriptView);
    }

    if (transcriptCopyAllBtn) {
        transcriptCopyAllBtn.addEventListener('click', () => {
            if (state.conversation.length === 0) {
                showToast('Transcript is empty');
                return;
            }
            const fullTranscript = state.conversation.map(m => `[${m.timestamp}] ${m.source.toUpperCase()}: ${m.text}`).join('\n');
            navigator.clipboard.writeText(fullTranscript).then(() => {
                showToast('All messages copied to clipboard!', 'fa-solid fa-copy');
            });
        });
    }

    // ================= MODALS & SETTINGS LOGIC =================
    // Accessibility Modal
    if (accessibilityBtn && accessibilityModal) {
        accessibilityBtn.addEventListener('click', () => {
            accessibilityModal.classList.remove('hidden');
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        });
        accCloseBtn.addEventListener('click', () => accessibilityModal.classList.add('hidden'));
        accSaveBtn.addEventListener('click', () => {
            accessibilityModal.classList.add('hidden');
            showToast('Accessibility preferences saved');
        });
    }

    if (toggleContrastBtn) {
        toggleContrastBtn.addEventListener('click', () => {
            state.highContrast = !state.highContrast;
            document.body.classList.toggle('high-contrast', state.highContrast);
            localStorage.setItem('signsync_high_contrast', state.highContrast);
            showToast(state.highContrast ? 'High Contrast ON' : 'High Contrast OFF');
        });
    }

    if (toggleMotionBtn) {
        toggleMotionBtn.addEventListener('click', () => {
            state.reducedMotion = !state.reducedMotion;
            document.body.classList.toggle('reduced-motion', state.reducedMotion);
            localStorage.setItem('signsync_reduced_motion', state.reducedMotion);
            showToast(state.reducedMotion ? 'Reduced Motion ON' : 'Reduced Motion OFF');
        });
    }

    if (textSizeSelect) {
        textSizeSelect.addEventListener('change', (e) => {
            state.textSize = e.target.value;
            document.body.classList.remove('font-sm', 'font-lg');
            if (state.textSize === 'sm') document.body.classList.add('font-sm');
            if (state.textSize === 'lg') document.body.classList.add('font-lg');
            localStorage.setItem('signsync_text_size', state.textSize);
        });
    }

    if (speechRateSelect) {
        speechRateSelect.addEventListener('change', (e) => {
            state.voiceRate = parseFloat(e.target.value) || 1.0;
        });
    }

    if (speechPitchSelect) {
        speechPitchSelect.addEventListener('change', (e) => {
            state.voicePitch = parseFloat(e.target.value) || 1.0;
        });
    }

    // Help Modal
    if (helpBtn && helpModal) {
        helpBtn.addEventListener('click', () => {
            helpModal.classList.remove('hidden');
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        });
        helpCloseBtn.addEventListener('click', () => helpModal.classList.add('hidden'));
        helpOkBtn.addEventListener('click', () => helpModal.classList.add('hidden'));
    }

    // Settings Modal
    if (settingsBtn && settingsModal) {
        settingsBtn.addEventListener('click', () => {
            settingsModal.classList.remove('hidden');
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        });
        settingsCloseBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));
        settingsSaveBtn.addEventListener('click', () => {
            settingsModal.classList.add('hidden');
            showToast('Settings saved');
        });
    }

    if (footerPrivacyBtn && settingsModal) {
        footerPrivacyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            settingsModal.classList.remove('hidden');
        });
    }

    // ================= CREATOR PROFILE POPUP (FOOTER) =================
    (function CreatorPopup() {
        const trigger = document.getElementById('creator-profile-btn');
        const popup = document.getElementById('creator-popup');
        const closeBtn = document.getElementById('creator-popup-close');
        if (!trigger || !popup || !closeBtn) return;

        let closeTimer = null;

        function cancelPendingClose() {
            if (closeTimer) {
                clearTimeout(closeTimer);
                closeTimer = null;
            }
        }

        function openPopup() {
            cancelPendingClose();
            popup.classList.remove('hidden');
            trigger.setAttribute('aria-expanded', 'true');
            document.addEventListener('click', handleOutsideClick, true);
            document.addEventListener('keydown', handleEscape);
        }

        function closePopup() {
            cancelPendingClose();
            popup.classList.add('hidden');
            trigger.setAttribute('aria-expanded', 'false');
            document.removeEventListener('click', handleOutsideClick, true);
            document.removeEventListener('keydown', handleEscape);
        }

        // Small delay before closing on mouse-out so moving the cursor from
        // the name into the card itself doesn't immediately close it.
        function scheduleClose() {
            cancelPendingClose();
            closeTimer = setTimeout(closePopup, 200);
        }

        function handleOutsideClick(e) {
            if (!popup.contains(e.target) && e.target !== trigger) {
                closePopup();
            }
        }

        function handleEscape(e) {
            if (e.key === 'Escape') closePopup();
        }

        // Hover (desktop) — open immediately, close shortly after the
        // pointer leaves both the trigger and the card.
        trigger.addEventListener('mouseenter', openPopup);
        trigger.addEventListener('mouseleave', scheduleClose);
        popup.addEventListener('mouseenter', cancelPendingClose);
        popup.addEventListener('mouseleave', scheduleClose);

        // Focus (keyboard) — mirrors hover for accessibility.
        trigger.addEventListener('focus', openPopup);
        trigger.addEventListener('blur', scheduleClose);

        // Click / tap (touch devices, and as a toggle fallback).
        trigger.addEventListener('click', () => {
            const isOpen = !popup.classList.contains('hidden');
            if (isOpen) {
                closePopup();
            } else {
                openPopup();
            }
        });

        closeBtn.addEventListener('click', closePopup);
    })();

    // Telemetry Collapsible Drawer
    if (telemetryToggleBtn && telemetryBody && telemetryChevron) {
        telemetryToggleBtn.addEventListener('click', () => {
            const isHidden = telemetryBody.classList.toggle('hidden');
            telemetryChevron.className = isHidden ? 'fa-solid fa-chevron-down' : 'fa-solid fa-chevron-up';
        });
    }

    // Global Modal Backdrop Click to Close
    [accessibilityModal, helpModal, settingsModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.classList.add('hidden');
            });
        }
    });

    // ================= KEYBOARD SHORTCUTS =================
    document.addEventListener('keydown', (e) => {
        // Ignore if user is currently typing in an input
        const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;

        if (e.key === ' ' || e.code === 'Space') {
            e.preventDefault();
            if (addToChatBtn) addToChatBtn.click();
        } else if (e.key === 'Backspace') {
            e.preventDefault();
            if (undoMessageBtn) undoMessageBtn.click();
        } else if (e.key === 'm' || e.key === 'M') {
            e.preventDefault();
            if (muteToggleBtn) muteToggleBtn.click();
        } else if (e.key === 'c' || e.key === 'C') {
            e.preventDefault();
            if (copyTranscriptBtn) copyTranscriptBtn.click();
        } else if (e.key === 'r' || e.key === 'R') {
            e.preventDefault();
            if (clearChatBtn) clearChatBtn.click();
        } else if (e.key === '?') {
            e.preventDefault();
            if (helpModal) helpModal.classList.toggle('hidden');
        }
    });

    // ================= PERSISTENT PREFERENCES INITIALIZATION =================
    if (localStorage.getItem('signsync_high_contrast') === 'true') {
        state.highContrast = true;
        document.body.classList.add('high-contrast');
    }
    if (localStorage.getItem('signsync_reduced_motion') === 'true') {
        state.reducedMotion = true;
        document.body.classList.add('reduced-motion');
    }
    const savedTextSize = localStorage.getItem('signsync_text_size');
    if (savedTextSize) {
        state.textSize = savedTextSize;
        if (textSizeSelect) textSizeSelect.value = savedTextSize;
        if (savedTextSize === 'sm') document.body.classList.add('font-sm');
        if (savedTextSize === 'lg') document.body.classList.add('font-lg');
    }

    // Cancel any active speech if browser tab loses visibility
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    });

    // Initialize SPA route
    initRoute();
    window.addEventListener('hashchange', initRoute);

    // Initial sign dictionary prefetch & clean session reset
    loadSignsCatalog();
    fetch('/api/sentence/clear', { method: 'POST' }).catch(() => {});
});

/* ==========================================================
   SIGNSYNC SPLASH INTRO ORCHESTRATOR
   Runs once per browser session.  Respects prefers-reduced-motion.
   ========================================================== */
(function SignSyncIntro() {
    const SPLASH_KEY  = 'signsync_intro_seen';
    const splash      = document.getElementById('signsync-splash');
    const splashInner = document.getElementById('splash-center');

    if (!splash || !splashInner) return;

    // Detect reduced-motion preference
    const reducedMotion =
        window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        document.body.classList.contains('reduced-motion');

    // Show intro only once per session
    const alreadySeen = sessionStorage.getItem(SPLASH_KEY);

    function hideSplash() {
        splash.classList.add('splash-hidden');
        // Remove from DOM after fade completes so it never blocks interaction
        splash.addEventListener('transitionend', () => {
            if (splash.parentNode) splash.parentNode.removeChild(splash);
        }, { once: true });
        // Mark as seen for this session
        sessionStorage.setItem(SPLASH_KEY, '1');
    }

    if (alreadySeen) {
        // Skip immediately — no DOM trace
        hideSplash();
        splash.style.transition = 'none';
        splash.style.opacity = '0';
        splash.style.pointerEvents = 'none';
        return;
    }

    if (reducedMotion) {
        // Gentle quick fade, no scale animation
        splashInner.style.animation = 'none';
        splashInner.style.opacity  = '1';
        splashInner.style.transform = 'none';
        const tagline = splash.querySelector('.splash-tagline');
        const divider = splash.querySelector('.splash-divider');
        if (tagline) { tagline.style.opacity = '1'; tagline.style.animation = 'none'; }
        if (divider) { divider.style.opacity = '1'; divider.style.animation = 'none'; }

        setTimeout(() => {
            splash.style.transition = 'opacity 0.3s ease';
            hideSplash();
        }, 700);
        return;
    }

    // ── Full cinematic sequence (~3.8s total) ───────────────────────
    // Phase 1 (0–400ms):    splashLogoIn CSS animation — calm settle-in
    // Phase 2 (400–1500ms): slow zoom IN  (scale 1.00 → 1.22)
    // Phase 3 (1500–2100ms): hold at hero size, fully readable
    // Phase 4 (2100–3400ms): slow zoom OUT, shrinking + moving toward the
    //                        real navbar logo's on-screen position
    // Phase 5 (3400ms+):    overlay fades, revealing the navbar already
    //                        sitting exactly where the logo just landed
    const EASE = 'cubic-bezier(0.65, 0, 0.35, 1)'; // smooth in/out, no overshoot
    const navLogo = document.getElementById('navbar-logo-img');

    splashInner.style.transformOrigin = 'center center';

    const zoomIn = splashInner.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.22)' }],
        { duration: 1100, delay: 400, easing: EASE, fill: 'forwards' }
    );

    zoomIn.onfinish = () => {
        setTimeout(runZoomOutToNavbar, 600); // Phase 3: hold
    };

    function runZoomOutToNavbar() {
        // Measure the real navbar logo's position now, so the shrink target
        // is exact rather than a guessed fixed offset.
        let dx = 0, dy = 0, endScale = 0.2;
        if (navLogo) {
            const from = splashInner.getBoundingClientRect();
            const to = navLogo.getBoundingClientRect();
            dx = (to.left + to.width / 2) - (from.left + from.width / 2);
            dy = (to.top + to.height / 2) - (from.top + from.height / 2);
            endScale = Math.max(0.14, Math.min(0.4, to.height / from.height));
        }

        const zoomOut = splashInner.animate(
            [
                { transform: 'translate(0px, 0px) scale(1.22)', opacity: 1 },
                { transform: `translate(${dx}px, ${dy}px) scale(${endScale})`, opacity: 0.2, offset: 0.88 },
                { transform: `translate(${dx}px, ${dy}px) scale(${endScale})`, opacity: 0 }
            ],
            { duration: 1300, easing: EASE, fill: 'forwards' }
        );

        // Phase 5: reveal the app right as the logo settles into the navbar
        zoomOut.onfinish = hideSplash;
    }
})();

/* ==========================================================
   WATER RIPPLE INTERACTION ENGINE
   Attaches to every .ripple-host element.
   Pointer-position tracked for authentic tactile feel.
   ========================================================== */
(function WaterRippleEngine() {
    // Determine if ripples should be suppressed (reduced-motion)
    const reducedMotion =
        window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        document.body.classList.contains('reduced-motion');

    if (reducedMotion) return;

    function spawnRipple(el, clientX, clientY) {
        const rect   = el.getBoundingClientRect();
        const size   = Math.max(rect.width, rect.height) * 2.2;
        const x      = (clientX != null ? clientX : rect.left + rect.width  / 2) - rect.left;
        const y      = (clientY != null ? clientY : rect.top  + rect.height / 2) - rect.top;

        // Choose style: ring variant for small nav links, fill for buttons/cards
        const isNavLink = el.classList.contains('nav-link') || el.classList.contains('header-brand');
        const ripple = document.createElement('span');
        ripple.className = isNavLink ? 'water-ripple-ring' : 'water-ripple';
        ripple.style.cssText = [
            `width:${size}px`,
            `height:${size}px`,
            `left:${x}px`,
            `top:${y}px`,
        ].join(';');

        el.appendChild(ripple);

        // Auto-remove after animation completes
        const dur = isNavLink ? 650 : 720;
        setTimeout(() => {
            if (ripple.parentNode === el) el.removeChild(ripple);
        }, dur + 50);
    }

    function attachRipple(el) {
        // Ensure the host can clip the ripple
        const style = window.getComputedStyle(el);
        if (style.position === 'static') el.style.position = 'relative';
        if (style.overflow !== 'hidden') el.style.overflow = 'hidden';

        el.addEventListener('mouseenter', (e) => {
            spawnRipple(el, e.clientX, e.clientY);
        }, { passive: true });

        // Touch feedback (no pointer position on touch start coords are available)
        el.addEventListener('touchstart', (e) => {
            const t = e.touches[0];
            spawnRipple(el, t ? t.clientX : null, t ? t.clientY : null);
        }, { passive: true });
    }

    function initRipples() {
        document.querySelectorAll('.ripple-host').forEach(attachRipple);
    }

    // Run immediately (elements already in DOM) + observe future additions
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initRipples);
    } else {
        initRipples();
    }

    // Re-attach if new ripple-host elements are added dynamically
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(m => {
            m.addedNodes.forEach(node => {
                if (!(node instanceof Element)) return;
                if (node.classList.contains('ripple-host')) attachRipple(node);
                node.querySelectorAll && node.querySelectorAll('.ripple-host').forEach(attachRipple);
            });
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();

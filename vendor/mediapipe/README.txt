MediaPipe Hand Landmarker - optional camera dependency
Pinned JavaScript/WASM package: @mediapipe/tasks-vision 0.10.21 (Apache 2.0)
Pinned model: hand_landmarker / float16 / version 1 (Google MediaPipe)

This delivery uses sources.json with mode=cdn. No camera image is uploaded:
only the JS, WASM and model are fetched, on explicit camera activation.
An Internet connection is required for that initial resource load.

To install the resources in this folder and work offline:
  Windows:       py preparar_camara.py
  macOS / Linux: python3 preparar_camara.py
Verification:    python3 preparar_camara.py --verify

The installer stores upstream license, source URLs, byte counts and SHA256
checksums; it changes sources.json to mode=local only after full validation.
The camera is never activated by the installer or by loading a page.
Do not use file://; start the local server with iniciar.py.

Documentation:
https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker/web_js
https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService

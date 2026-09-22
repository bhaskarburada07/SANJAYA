# SANJAYA Computer Vision & Edge AI Service Abstraction

This directory defines the decoupled AI/Computer Vision service interface for **SANJAYA**.

## Architecture & Design Principles

SANJAYA adopts a **Privacy-First Hybrid Edge Architecture**:
1. **Local Edge Video Processing**: Video feeds are processed locally on an edge gateway (or on-device NPU/Jetson/Coral) to preserve resident privacy. Raw video streams are never streamed to public cloud servers without explicit user consent.
2. **Deterministic Classification Pipeline**:
   - **Person Detection (YOLO / MediaPipe / RT-DETR)**: Detects human bounding boxes in the specified camera zones.
   - **Feature Extraction & Verification**: Extracts face and appearance embeddings locally and compares them against configured `trusted_people` face references with cosine similarity.
   - **Ethical & Objective Classification**:
     - Known Match (similarity > threshold): Tagged as `known` with the trusted person's name.
     - No Match (or similarity <= threshold): Tagged strictly as `unknown`.
     - **CRITICAL**: The system NEVER classifies or labels an unknown person as a "threat", "criminal", or "attacker". It objectively notifies the homeowner to **SEE → UNDERSTAND → VERIFY → RESPOND → ESCALATE**.

## Service Interface

The service contract is defined in:
- `interface.ts`: TypeScript contract for Node.js / Web backend consumption.
- `detection_service.py`: Reference Python implementation using FastAPI, OpenCV, and ONNX Runtime/Torch.

## Python Integration Runbook

To start the real Python CV service:
```bash
cd ai-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python detection_service.py --port 8080 --model-path ./models/yolov8n.onnx
```

In `.env`, set:
```env
AI_CV_SERVICE_URL="http://localhost:8080"
```
The Node.js Express backend will automatically stream RTSP frames or invoke the REST/gRPC endpoints of this service.

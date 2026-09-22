/**
 * SANJAYA AI/CV Service Abstraction Interface
 * Contract between Node.js backend and Computer Vision / Edge AI worker
 */

export type PersonType = 'known' | 'unknown';

export interface BoundingBox {
  x: number; // 0 to 1 normalized top-left x
  y: number; // 0 to 1 normalized top-left y
  width: number; // 0 to 1 normalized width
  height: number; // 0 to 1 normalized height
}

export interface DetectionEventPayload {
  id: string;
  cameraId: string;
  cameraName: string;
  zone: string;
  personType: PersonType;
  personName?: string;
  trustedPersonId?: string;
  confidence: number;
  boundingBox?: BoundingBox;
  snapshotUrl: string;
  detectedAt: string; // ISO 8601
  metadata?: {
    estimatedDistanceMeters?: number;
    dwellTimeSeconds?: number;
    lightingCondition?: 'day' | 'dusk' | 'night' | 'infrared';
    modelLatencyMs?: number;
  };
}

export interface ComputerVisionService {
  /**
   * Process a single video frame or RTSP stream snapshot
   */
  processFrame(frameBuffer: Buffer, cameraId: string): Promise<DetectionEventPayload | null>;

  /**
   * Register or update facial reference embedding for a trusted person
   */
  enrollTrustedPerson(personId: string, referenceImages: string[]): Promise<boolean>;

  /**
   * Remove facial reference embedding
   */
  removeTrustedPerson(personId: string): Promise<boolean>;

  /**
   * Check health and inference latency of the CV model engine
   */
  getServiceStatus(): Promise<{
    status: 'ready' | 'degraded' | 'offline';
    backend: 'simulation' | 'onnxruntime' | 'tensorrt' | 'mediapipe';
    averageInferenceMs: number;
    activeStreams: number;
  }>;
}

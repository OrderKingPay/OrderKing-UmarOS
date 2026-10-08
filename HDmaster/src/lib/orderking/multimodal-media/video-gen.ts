import fetch from 'node-fetch';

export interface VideoGenerationInstance {
    prompt: string;
    image?: {
        imageUri?: string;
        bytesBase64Encoded?: string;
    };
}

export interface VideoGenerationRequest {
    instances: VideoGenerationInstance[];
    parameters?: {
        fps?: number;
        durationSeconds?: number;
    };
}

export interface VideoGenerationResponse {
    predictions: Array<{
        bytesBase64Encoded: string;
        mimeType: string;
    }>;
}

/**
 * Generates a video using Veo 3.1 via Vertex AI predict endpoint structure.
 */
export async function generateVideo(
    prompt: string, 
    imagePath?: string, 
    projectId?: string, 
    token?: string
): Promise<VideoGenerationResponse> {
    const location = 'us-central1';
    
    // Targeting Veo 3.1 Vertex AI endpoint representation
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/veo-3.1:predict`;
    
    const instance: VideoGenerationInstance = { prompt };
    
    // If an image path is provided, attach it for image-to-video generation
    if (imagePath) {
        instance.image = { imageUri: imagePath };
    }

    const payload: VideoGenerationRequest = {
        instances: [instance],
        parameters: {
            fps: 24,
            durationSeconds: 5
        }
    };

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Video Generation Error (${response.status}): ${errText}`);
    }

    return response.json() as Promise<VideoGenerationResponse>;
}

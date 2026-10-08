import fetch from 'node-fetch';

export interface ImageGenerationRequest {
    instances: Array<{ prompt: string }>;
    parameters?: {
        sampleCount?: number;
        aspectRatio?: string;
    };
}

export interface ImageGenerationResponse {
    predictions: Array<{
        bytesBase64Encoded: string;
        mimeType: string;
    }>;
}

/**
 * Generates an image using Nano Banana 2.1 (Google's multimodal image model endpoint format)
 */
export async function generateImage(prompt: string, projectId: string, token: string): Promise<ImageGenerationResponse> {
    const location = 'us-central1';
    
    // Using standard Vertex AI endpoint format for multimodal prediction
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagegeneration:predict`;
    
    const payload: ImageGenerationRequest = {
        instances: [{ prompt }],
        parameters: {
            sampleCount: 1,
            aspectRatio: '1:1'
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
        throw new Error(`Image Generation Error (${response.status}): ${errText}`);
    }

    return response.json() as Promise<ImageGenerationResponse>;
}

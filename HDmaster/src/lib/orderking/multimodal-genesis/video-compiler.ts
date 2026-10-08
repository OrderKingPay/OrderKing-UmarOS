export async function compileVideoWithLuma(base64Image: string, prompt: string, lumaApiKey: string): Promise<any> {
    const response = await fetch('https://api.lumalabs.ai/dream-machine/v1/generations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${lumaApiKey}`
        },
        body: JSON.stringify({
            prompt: prompt,
            image_url: `data:image/jpeg;base64,${base64Image}`,
        })
    });
    
    if (!response.ok) {
        throw new Error(`Luma API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
}

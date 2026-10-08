import speech from '@google-cloud/speech';

export async function transcribeAudio(audioBuffer: Buffer, languageCode: string = 'en-US'): Promise<string> {
  const client = new speech.SpeechClient();
  const audio = {
    content: audioBuffer.toString('base64'),
  };
  const config = {
    encoding: 'LINEAR16' as const,
    sampleRateHertz: 16000,
    languageCode: languageCode,
  };
  const request = {
    audio: audio,
    config: config,
  };

  const [response] = await client.recognize(request);
  const transcription = response.results
    ?.map(result => result.alternatives?.[0]?.transcript)
    .join('\n');
    
  return transcription || '';
}

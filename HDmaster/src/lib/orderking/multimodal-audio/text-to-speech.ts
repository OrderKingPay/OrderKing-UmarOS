import textToSpeech from '@google-cloud/text-to-speech';

export async function synthesizeSpeech(text: string, lang: string = 'en-US'): Promise<Buffer> {
  const client = new textToSpeech.TextToSpeechClient();
  const request = {
    input: { text: text },
    voice: { languageCode: lang, name: `${lang}-Standard-A` },
    audioConfig: { audioEncoding: 'MP3' as const },
  };

  const [response] = await client.synthesizeSpeech(request);
  if (!response.audioContent) {
    throw new Error('Failed to generate audio content.');
  }
  return Buffer.from(response.audioContent);
}

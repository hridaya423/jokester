import { MemeTemplate, GeneratedMeme } from '@/types';

const IMGFLIP_API = 'https://api.imgflip.com';

export async function getMemeTemplates(): Promise<MemeTemplate[]> {
  try {
    const response = await fetch(`${IMGFLIP_API}/get_memes`);
    if (!response.ok) throw new Error('Failed to fetch templates');
    const data = await response.json();
    return data.data.memes;
  } catch (error) {
    console.error('Error fetching meme templates:', error);
    return [];
  }
}

export async function generateMeme(
  templateId: string,
  topText: string,
  bottomText: string
): Promise<GeneratedMeme | null> {
  try {
    const response = await fetch('/api/memes/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        templateId,
        topText,
        bottomText,
      }),
    });

    if (!response.ok) throw new Error('Failed to generate meme');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error generating meme:', error);
    return null;
  }
}
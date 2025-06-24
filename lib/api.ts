import { MemeTemplate, GeneratedMeme, TextBox } from '@/types';

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
  textBoxes: TextBox[]
): Promise<GeneratedMeme | null> {
  try {
    const response = await fetch('/api/memes/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        templateId,
        textBoxes,
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


export async function generateMemeSimple(
  templateId: string,
  topText: string,
  bottomText: string
): Promise<GeneratedMeme | null> {
  const defaultStyle = {
    text: '',
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Impact, "Arial Black", sans-serif',
    bold: true,
    italic: false,
    strokeColor: '#000000',
    strokeWidth: 2,
    backgroundColor: 'transparent',
    padding: 4
  };

  const textBoxes: TextBox[] = [
    {
      id: 0,
      text: topText,
      style: defaultStyle,
      position: { x: 50, y: 15 }
    },
    {
      id: 1,
      text: bottomText,
      style: defaultStyle,
      position: { x: 50, y: 85 }
    }
  ];
  
  return generateMeme(templateId, textBoxes);
}
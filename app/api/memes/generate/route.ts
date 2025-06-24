import { NextResponse } from 'next/server';
import { TextBox } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { templateId, textBoxes, topText, bottomText } = body;

    if (!templateId) {
      return NextResponse.json(
        { error: 'Missing template ID' },
        { status: 400 }
      );
    }

    
    if (!process.env.IMGFLIP_USERNAME || !process.env.IMGFLIP_PASSWORD) {
      console.error('Missing imgflip credentials');
      return NextResponse.json(
        { error: 'Service configuration error' },
        { status: 500 }
      );
    }

    
    let textsToUse: string[] = [];
    
    if (textBoxes && Array.isArray(textBoxes)) {
      
      textsToUse = (textBoxes as TextBox[])
        .sort((a, b) => a.id - b.id) 
        .map(box => box.text || '');
    } else if (topText !== undefined || bottomText !== undefined) {
      
      textsToUse = [topText || '', bottomText || ''];
    } else {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }

    
    const formData = new URLSearchParams({
      template_id: templateId,
      username: process.env.IMGFLIP_USERNAME,
      password: process.env.IMGFLIP_PASSWORD,
    });

    
    textsToUse.forEach((text, index) => {
      formData.append(`text${index}`, text);
    });

    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); 

    const response = await fetch('https://api.imgflip.com/caption_image', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('Imgflip API response error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'External service error' },
        { status: 500 }
      );
    }

    const data = await response.json();
    console.log('Imgflip API response:', data);

    if (!data.success) {
      console.error('Imgflip API error:', data.error_message);
      return NextResponse.json(
        { error: data.error_message || 'Failed to generate meme' },
        { status: 400 }
      );
    }

    
    if (!data.data?.url) {
      console.error('No URL in imgflip response:', data);
      return NextResponse.json(
        { error: 'Invalid response from meme service' },
        { status: 500 }
      );
    }

    return NextResponse.json(data.data);
  } catch (error) {
    console.error('Error generating meme:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timed out. Please try again.' },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate meme' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { templateId, topText, bottomText } = await request.json();

    if (!templateId || topText === undefined || bottomText === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const formData = new URLSearchParams({
      template_id: templateId,
      username: process.env.IMGFLIP_USERNAME!,
      password: process.env.IMGFLIP_PASSWORD!,
      text0: topText,
      text1: bottomText,
    });

    const response = await fetch('https://api.imgflip.com/caption_image', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const data = await response.json();

    if (!data.success) {
      return NextResponse.json(
        { error: data.error_message },
        { status: 400 }
      );
    }

    return NextResponse.json(data.data);
  } catch (error) {
    console.error('Error generating meme:', error);
    return NextResponse.json(
      { error: 'Failed to generate meme' },
      { status: 500 }
    );
  }
}
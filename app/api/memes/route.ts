import { NextResponse } from 'next/server';
import { fetchRedditMemes } from '@/lib/reddit';

export const runtime = 'edge';

export const revalidate = 120;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const after = searchParams.get('after');

  try {
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 12000); 
    });

    const fetchPromise = fetchRedditMemes('memes', 'day', after || undefined);
    
    const data = await Promise.race([fetchPromise, timeoutPromise]);
    
    const response = NextResponse.json(data);
    
    response.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=60');
    
    return response;
  } catch (error) {
    console.error('Error in memes API route:', error);
    
    
    if (after) {
      console.warn('Pagination request failed, returning fallback');
      const fallbackData = {
        memes: [
          {
            id: `fallback-api-${Date.now()}`,
            title: 'Content temporarily unavailable',
            url: 'https://i.imgur.com/3vLnXve.png',
            author: 'system',
            likes: 0,
            comments: 0
          }
        ],
        after: null
      };
      
      const fallbackResponse = NextResponse.json(fallbackData);
      fallbackResponse.headers.set('Cache-Control', 'no-store');
      return fallbackResponse;
    }
    
    const errorResponse = NextResponse.json(
      { error: 'Failed to fetch memes' }, 
      { status: 500 }
    );
    errorResponse.headers.set('Cache-Control', 'no-store');
    
    return errorResponse;
  }
}
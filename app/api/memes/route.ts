import { NextResponse } from 'next/server';
import { fetchRedditMemes } from '@/lib/reddit';

export const runtime = 'edge';

export const revalidate = 120;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const after = searchParams.get('after');

  try {
    const data = await fetchRedditMemes(after ?? undefined);
    
    const response = NextResponse.json(data);
    
    response.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=60');
    
    return response;
  } catch (error) {
    console.error('Error in memes API route:', error);
    
    const errorResponse = NextResponse.json(
      { error: 'Failed to fetch memes' }, 
      { status: 500 }
    );
    errorResponse.headers.set('Cache-Control', 'no-store');
    
    return errorResponse;
  }
}
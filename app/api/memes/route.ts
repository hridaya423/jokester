import { NextResponse } from 'next/server';
import { fetchRedditMemes } from '@/lib/reddit';

export const runtime = 'nodejs';

export const revalidate = 120;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const after = searchParams.get('after');

  try {
    console.log('API: Starting memes fetch, after:', after);
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        console.log('API: Timeout triggered after 12s');
        reject(new Error('Request timeout'));
      }, 12000); 
    });

    const fetchPromise = fetchRedditMemes('memes', 'day', after || undefined)
      .then(result => {
        console.log('API: fetchRedditMemes resolved successfully:', result);
        return result;
      })
      .catch(error => {
        console.error('API: fetchRedditMemes rejected:', error);
        throw error;
      });
    
    console.log('API: Racing between fetch and timeout...');
    const data = await Promise.race([fetchPromise, timeoutPromise]) as Awaited<ReturnType<typeof fetchRedditMemes>>;
    console.log('API: Promise.race resolved with:', { 
      data, 
      hasMemesProperty: 'memes' in (data || {}),
      dataType: typeof data,
      dataKeys: data ? Object.keys(data) : []
    });
    
    console.log('API: Successfully fetched data:', { 
      memesCount: data?.memes?.length || 0, 
      hasAfter: !!data?.after,
      dataStructure: Object.keys(data || {})
    });
    
    const safeData = {
      memes: Array.isArray(data?.memes) ? data.memes : [],
      after: data?.after || null
    };
    
    if (data && (!data.memes || !Array.isArray(data.memes))) {
      console.error('API: Invalid data structure from Reddit function:', data);
    }
    
    const response = NextResponse.json(safeData);
    
    response.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=60');
    
    return response;
  } catch (error) {
    console.error('Error in memes API route:', error, {
      errorName: error instanceof Error ? error.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : String(error),
      isTimeout: error instanceof Error && error.message === 'Request timeout',
      after: after
    });
    if (after) {
      console.warn('Pagination request failed, returning empty result');
      const emptyResponse = NextResponse.json({ memes: [], after: null });
      emptyResponse.headers.set('Cache-Control', 'no-store');
      return emptyResponse;
    }
    
    console.warn('Initial load failed, returning empty result');
    const emptyResponse = NextResponse.json({ memes: [], after: null });
    emptyResponse.headers.set('Cache-Control', 'no-store');
    return emptyResponse;
  }
}
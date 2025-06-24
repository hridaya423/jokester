import { getMemeTemplates } from '@/lib/api';
import { fetchRedditMemes } from '@/lib/reddit';
import MemeGrid from '@/components/MemeGrid';
import Navbar from '@/components/layout/Navbar';

export const runtime = 'edge';

export const revalidate = 120;

export default async function Home() {
  const [memesData, templates] = await Promise.all([
    fetchRedditMemes('memes', 'day')
      .catch((error) => {
        console.error('Error fetching memes:', error);
        
        return { 
          memes: [
            {
              id: 'fallback-home-1',
              title: 'Welcome to Jokester!',
              url: 'https://i.imgur.com/3vLnXve.png',
              author: 'system',
              likes: 1000,
              comments: 50
            },
            {
              id: 'fallback-home-2',
              title: 'Content loading...',
              url: 'https://i.imgur.com/2ZyFfWO.png',
              author: 'system',
              likes: 800,
              comments: 30
            }
          ], 
          after: 'cycle-0-0' 
        };
      }),
    getMemeTemplates()
      .catch((error) => {
        console.error('Error fetching templates:', error);
        return [];
      })
  ]);

  const memes = memesData.memes;

  const headers = new Headers();
  headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=60');

  
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="container mx-auto pt-20 px-4">
        {memes.length === 0 && templates.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-[#c2f970] mb-4">
              Loading content...
            </h2>
            <p className="text-gray-400 mb-4">
              Please wait while we fetch the latest memes.
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#c2f970] border-t-transparent mx-auto" />
          </div>
        ) : (
          <MemeGrid 
            initialMemes={memes} 
            templates={templates} 
            initialAfter={memesData.after || 'cycle-0-0'} 
          />
        )}
      </div>
    </main>
  );
}
import { getMemeTemplates } from '@/lib/api';
import { fetchRedditMemes } from '@/lib/reddit';
import MemeGrid from '@/components/MemeGrid';
import Navbar from '@/components/layout/Navbar';

export const runtime = 'edge';

export const revalidate = 120;


export default async function Home() {
  const [memes, templates] = await Promise.all([
    fetchRedditMemes('memes', 'day')
      .catch((error) => {
        console.error('Error fetching memes:', error);
        return [];
      }),
    getMemeTemplates()
      .catch((error) => {
        console.error('Error fetching templates:', error);
        return [];
      })
  ]);

  const headers = new Headers();
  headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=60');

  if (memes.length === 0 && templates.length === 0) {
    return (
      <main className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="container mx-auto pt-20 px-4">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-[#c2f970] mb-4">
              Unable to load content
            </h2>
            <p className="text-gray-400 mb-4">
              We&apos;re having trouble connecting to our services.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#c2f970] text-black rounded-lg hover:bg-opacity-90 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="container mx-auto pt-20 px-4">
        <MemeGrid initialMemes={memes} templates={templates} />
      </div>
    </main>
  );
}
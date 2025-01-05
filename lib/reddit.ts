/* eslint-disable @typescript-eslint/no-explicit-any */
import { Meme } from '@/types';

const FALLBACK_MEMES: Meme[] = [
  {
    id: 'sample1',
    title: 'Example Meme 1',
    url: 'https://i.imgur.com/3vLnXve.png',
    author: 'user1',
    likes: 1200,
    comments: 45
  },
  {
    id: 'sample2',
    title: 'Example Meme 2',
    url: 'https://i.imgur.com/2ZyFfWO.png',
    author: 'user2',
    likes: 980,
    comments: 32
  }
];

const SUBREDDITS = ['memes', 'dankmemes', 'wholesomememes', 'me_irl'];

async function fetchFromReddit(subreddit: string, timeframe: string): Promise<Response> {
  return fetch(
    `https://www.reddit.com/r/${subreddit}/top/.json?t=${timeframe}&limit=25`,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      },
      next: { revalidate: 60 } // Cache for 1 minute
    }
  );
}

async function tryFetchWithRetry(
  subreddit: string, 
  timeframe: string, 
  retries = 3
): Promise<Response | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetchFromReddit(subreddit, timeframe);
      if (response.ok) return response;
      
      // If we get a 429 or 403, try a different subreddit
      if (response.status === 429 || response.status === 403) {
        break;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      if (i === retries - 1) return null;
    }
  }
  return null;
}

export async function fetchRedditMemes(
  preferredSubreddit = 'memes',
  timeframe = 'day'
): Promise<Meme[]> {
  // Start with the preferred subreddit, then try others if it fails
  const subredditsToTry = [
    preferredSubreddit,
    ...SUBREDDITS.filter(s => s !== preferredSubreddit)
  ];

  for (const subreddit of subredditsToTry) {
    try {
      const response = await tryFetchWithRetry(subreddit, timeframe);
      if (!response) continue;

      const data = await response.json();
      
      if (!data?.data?.children?.length) {
        console.warn(`No posts found in r/${subreddit}`);
        continue;
      }

      const memes = data.data.children
        .map((post: any) => ({
          id: post.data.id,
          title: post.data.title,
          url: post.data.url,
          author: post.data.author,
          likes: post.data.ups,
          comments: post.data.num_comments,
        }))
        .filter((post: Meme) => {
          const url = post.url.toLowerCase();
          return (
            url.endsWith('.jpg') || 
            url.endsWith('.jpeg') || 
            url.endsWith('.png') || 
            url.endsWith('.gif') ||
            url.includes('imgur.com') ||
            url.includes('i.redd.it')
          );
        });

      if (memes.length > 0) {
        console.log(`Successfully fetched memes from r/${subreddit}`);
        return memes;
      }
    } catch (error) {
      console.error(`Error fetching from r/${subreddit}:`, error);
      continue;
    }
  }

  console.warn('All subreddit attempts failed, using fallback memes');
  return FALLBACK_MEMES;
}
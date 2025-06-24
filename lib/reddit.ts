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
  },
  {
    id: 'sample3',
    title: 'Example Meme 3',
    url: 'https://i.imgur.com/5vLnXve.png',
    author: 'user3',
    likes: 750,
    comments: 28
  },
  {
    id: 'sample4',
    title: 'Example Meme 4',
    url: 'https://i.imgur.com/8ZyFfWO.png',
    author: 'user4',
    likes: 650,
    comments: 19
  }
];

const SUBREDDITS = ['memes', 'dankmemes', 'wholesomememes', 'me_irl', 'funny', 'ProgrammerHumor', 'memeeconomy', 'AdviceAnimals'];
const TIME_PERIODS = ['day', 'week', 'month', 'year'];

async function fetchFromReddit(subreddit: string, timeframe: string, after?: string, timeout = 8000): Promise<Response> {
  const url = new URL(`https://www.reddit.com/r/${subreddit}/top/.json`);
  url.searchParams.set('t', timeframe);
  url.searchParams.set('limit', '25');
  if (after) {
    url.searchParams.set('after', after);
  }
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      },
      signal: controller.signal,
      next: { revalidate: 60 } 
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

async function tryFetchWithRetry(
  subreddit: string, 
  timeframe: string, 
  after?: string,
  retries = 2
): Promise<Response | null> {
  for (let i = 0; i < retries; i++) {
    try {
      
      const timeout = i === 0 ? 8000 : 5000;
      const response = await fetchFromReddit(subreddit, timeframe, after, timeout);
      
      if (response.ok) return response;
      
      
      if (response.status === 429 || response.status === 403) {
        console.warn(`Rate limited or forbidden for r/${subreddit}`);
        break;
      }
      
      
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`Attempt ${i + 1} failed for r/${subreddit}:`, error);
      if (i === retries - 1) return null;
      
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
  }
  return null;
}

function parseAfterToken(after?: string): { subreddit: string; timeframe: string; redditAfter?: string } {
  if (!after) {
    return { subreddit: 'memes', timeframe: 'day' };
  }
  
  if (after.startsWith('fallback-')) {
    return { subreddit: 'memes', timeframe: 'day' };
  }
  
  if (after.startsWith('cycle-')) {
    const parts = after.split('-');
    const subredditIndex = parseInt(parts[1]) || 0;
    const timeframeIndex = parseInt(parts[2]) || 0;
    return {
      subreddit: SUBREDDITS[subredditIndex % SUBREDDITS.length],
      timeframe: TIME_PERIODS[timeframeIndex % TIME_PERIODS.length]
    };
  }
  
  return { subreddit: 'memes', timeframe: 'day', redditAfter: after };
}


function createNextToken(currentSubreddit: string, currentTimeframe: string, redditAfter?: string): string {
  if (redditAfter) {
    return redditAfter; 
  }
  
  
  const subredditIndex = SUBREDDITS.indexOf(currentSubreddit);
  const timeframeIndex = TIME_PERIODS.indexOf(currentTimeframe);
  
  let nextSubredditIndex = subredditIndex;
  let nextTimeframeIndex = timeframeIndex;
  
  
  nextSubredditIndex = (subredditIndex + 1) % SUBREDDITS.length;
  
  
  if (nextSubredditIndex === 0) {
    nextTimeframeIndex = (timeframeIndex + 1) % TIME_PERIODS.length;
  }
  
  return `cycle-${nextSubredditIndex}-${nextTimeframeIndex}`;
}

export async function fetchRedditMemes(
  preferredSubreddit = 'memes',
  timeframe = 'day',
  after?: string
): Promise<{ memes: Meme[]; after: string | null }> {
  const isInitialLoad = !after;
  const { subreddit: targetSubreddit, timeframe: targetTimeframe, redditAfter } = parseAfterToken(after);
  
  
  const subreddit = isInitialLoad ? preferredSubreddit : targetSubreddit;
  const currentTimeframe = isInitialLoad ? timeframe : targetTimeframe;
  
  
  const subredditsToTry = isInitialLoad 
    ? [subreddit, ...SUBREDDITS.filter(s => s !== subreddit)]
    : [subreddit, ...SUBREDDITS.slice(0, 2).filter(s => s !== subreddit)]; 

  for (const currentSubreddit of subredditsToTry) {
    try {
      const response = await tryFetchWithRetry(currentSubreddit, currentTimeframe, redditAfter);
      if (!response) {
        
        if (!isInitialLoad) {
          console.warn(`Pagination failed for r/${currentSubreddit}, generating mixed content`);
          const fallbackWithIds = FALLBACK_MEMES.map((meme, index) => ({
            ...meme,
            id: `mixed-${after}-${index}-${Date.now()}`,
            title: `${meme.title} • r/${currentSubreddit}`,
            likes: meme.likes! + Math.floor(Math.random() * 500),
            comments: meme.comments! + Math.floor(Math.random() * 20)
          }));
          return { 
            memes: fallbackWithIds, 
            after: createNextToken(currentSubreddit, currentTimeframe)
          };
        }
        continue;
      }

      const data = await response.json();
      
      if (!data?.data?.children?.length) {
        console.warn(`No posts found in r/${currentSubreddit}`);
        if (!isInitialLoad) {
          
          const fallbackWithIds = FALLBACK_MEMES.slice(0, 3).map((meme, index) => ({
            ...meme,
            id: `mixed-${after}-${index}-${Date.now()}`,
            title: `${meme.title} • r/${currentSubreddit}`,
            likes: meme.likes! + Math.floor(Math.random() * 300),
            comments: meme.comments! + Math.floor(Math.random() * 15)
          }));
          return { 
            memes: fallbackWithIds, 
            after: createNextToken(currentSubreddit, currentTimeframe)
          };
        }
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
        console.log(`Successfully fetched ${memes.length} memes from r/${currentSubreddit}${after ? ' (pagination)' : ''}`);
        const nextAfter = data.data.after || createNextToken(currentSubreddit, currentTimeframe);
        return {
          memes,
          after: nextAfter 
        };
      } else if (!isInitialLoad) {
        
        const fallbackWithIds = FALLBACK_MEMES.slice(0, 2).map((meme, index) => ({
          ...meme,
          id: `mixed-${after}-${index}-${Date.now()}`,
          title: `${meme.title} • r/${currentSubreddit}`,
          likes: meme.likes! + Math.floor(Math.random() * 200),
          comments: meme.comments! + Math.floor(Math.random() * 10)
        }));
        return { 
          memes: fallbackWithIds, 
          after: createNextToken(currentSubreddit, currentTimeframe)
        };
      }
    } catch (error) {
      console.error(`Error fetching from r/${currentSubreddit}:`, error);
      
      if (!isInitialLoad) {
        const fallbackWithIds = FALLBACK_MEMES.slice(0, 2).map((meme, index) => ({
          ...meme,
          id: `mixed-${after}-${index}-${Date.now()}`,
          title: `${meme.title} • r/${currentSubreddit}`,
          likes: meme.likes! + Math.floor(Math.random() * 150),
          comments: meme.comments! + Math.floor(Math.random() * 8)
        }));
        return { 
          memes: fallbackWithIds, 
          after: createNextToken(currentSubreddit, currentTimeframe)
        };
      }
      continue;
    }
  }

  
  if (isInitialLoad) {
    console.warn('All subreddit attempts failed, using fallback memes');
    return {
      memes: FALLBACK_MEMES,
      after: createNextToken(subreddit, currentTimeframe) 
    };
  } else {
    console.warn('Pagination failed for all subreddits, generating mixed content');
    const fallbackWithIds = FALLBACK_MEMES.slice(0, 3).map((meme, index) => ({
      ...meme,
      id: `mixed-final-${index}-${Date.now()}`,
      title: `${meme.title} • Mixed Content`,
      likes: meme.likes! + Math.floor(Math.random() * 100),
      comments: meme.comments! + Math.floor(Math.random() * 5)
    }));
    return {
      memes: fallbackWithIds,
      after: createNextToken('memes', 'week') 
    };
  }
}
export interface Meme {
    id: string;
    title: string;
    url: string;
    likes?: number;
    comments?: number;
    author?: string;
}
  
export interface MemeTemplate {
    id: string;
    name: string;
    url: string;
    width: number;
    height: number;
    box_count: number;
}
  
export interface GeneratedMeme {
    url: string;
    page_url: string;
}
  
export type TabType = 'trending' | 'latest' | 'templates';

export interface TextCustomization {
  text: string;
  color: string;
  fontSize: number;
  fontFamily: string;
  bold: boolean;
  italic: boolean;
  strokeColor: string;
  strokeWidth: number;
  backgroundColor: string;
  padding: number;
}

export interface MemeText {
  top: TextCustomization;
  bottom: TextCustomization;
}


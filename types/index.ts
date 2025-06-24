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

export interface TextBox {
  id: number;
  text: string;
  style: TextCustomization;
  position: {
    x: number; 
    y: number; 
  };
}


export const TEMPLATE_TEXT_POSITIONS: Record<string, TextBox[]> = {
  
  '181913649': [
    { id: 0, text: '', style: {} as TextCustomization, position: { x: 70, y: 25 } },
    { id: 1, text: '', style: {} as TextCustomization, position: { x: 70, y: 75 } }
  ],
  
  '87743020': [
    { id: 0, text: '', style: {} as TextCustomization, position: { x: 20, y: 30 } },
    { id: 1, text: '', style: {} as TextCustomization, position: { x: 60, y: 30 } },
    { id: 2, text: '', style: {} as TextCustomization, position: { x: 40, y: 90 } }
  ],
  
  '112126428': [
    { id: 0, text: '', style: {} as TextCustomization, position: { x: 20, y: 10 } }, 
    { id: 1, text: '', style: {} as TextCustomization, position: { x: 50, y: 10 } }, 
    { id: 2, text: '', style: {} as TextCustomization, position: { x: 80, y: 10 } }  
  ],
  
  '93895088': [
    { id: 0, text: '', style: {} as TextCustomization, position: { x: 70, y: 15 } },
    { id: 1, text: '', style: {} as TextCustomization, position: { x: 70, y: 35 } },
    { id: 2, text: '', style: {} as TextCustomization, position: { x: 70, y: 60 } },
    { id: 3, text: '', style: {} as TextCustomization, position: { x: 70, y: 85 } }
  ],
  
  '131940431': [
    { id: 0, text: '', style: {} as TextCustomization, position: { x: 50, y: 15 } },
    { id: 1, text: '', style: {} as TextCustomization, position: { x: 50, y: 40 } },
    { id: 2, text: '', style: {} as TextCustomization, position: { x: 50, y: 65 } },
    { id: 3, text: '', style: {} as TextCustomization, position: { x: 50, y: 90 } }
  ],
  
  '131087935': [
    { id: 0, text: '', style: {} as TextCustomization, position: { x: 30, y: 15 } }, 
    { id: 1, text: '', style: {} as TextCustomization, position: { x: 60, y: 40 } }, 
    { id: 2, text: '', style: {} as TextCustomization, position: { x: 70, y: 25 } }, 
    { id: 3, text: '', style: {} as TextCustomization, position: { x: 75, y: 35 } }, 
    { id: 4, text: '', style: {} as TextCustomization, position: { x: 20, y: 85 } }  
  ],
  
  '1035805': [
    { id: 0, text: '', style: {} as TextCustomization, position: { x: 50, y: 15 } }, 
    { id: 1, text: '', style: {} as TextCustomization, position: { x: 20, y: 60 } }, 
    { id: 2, text: '', style: {} as TextCustomization, position: { x: 50, y: 60 } }, 
    { id: 3, text: '', style: {} as TextCustomization, position: { x: 80, y: 60 } }  
  ]
};


export function getDefaultTextPositions(boxCount: number): TextBox[] {
  const positions: TextBox[] = [];
  
  if (boxCount === 1) {
    positions.push({ id: 0, text: '', style: {} as TextCustomization, position: { x: 50, y: 50 } });
  } else if (boxCount === 2) {
    
    positions.push({ id: 0, text: '', style: {} as TextCustomization, position: { x: 50, y: 15 } });
    positions.push({ id: 1, text: '', style: {} as TextCustomization, position: { x: 50, y: 85 } });
  } else if (boxCount === 3) {
    
    positions.push({ id: 0, text: '', style: {} as TextCustomization, position: { x: 50, y: 15 } });
    positions.push({ id: 1, text: '', style: {} as TextCustomization, position: { x: 50, y: 50 } });
    positions.push({ id: 2, text: '', style: {} as TextCustomization, position: { x: 50, y: 85 } });
  } else if (boxCount === 4) {
    
    positions.push({ id: 0, text: '', style: {} as TextCustomization, position: { x: 25, y: 25 } });
    positions.push({ id: 1, text: '', style: {} as TextCustomization, position: { x: 75, y: 25 } });
    positions.push({ id: 2, text: '', style: {} as TextCustomization, position: { x: 25, y: 75 } });
    positions.push({ id: 3, text: '', style: {} as TextCustomization, position: { x: 75, y: 75 } });
  } else {
    
    for (let i = 0; i < boxCount; i++) {
      positions.push({
        id: i,
        text: '',
        style: {} as TextCustomization,
        position: { x: 50, y: (100 / (boxCount + 1)) * (i + 1) }
      });
    }
  }
  
  return positions;
}


/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    const templateId = params.templateId;

    const imgflipAnalysis = await analyzeImgflipExamples(templateId);
    
    if (imgflipAnalysis.length > 0) {
      return NextResponse.json(imgflipAnalysis);
    }

    const heuristicPositions = await getHeuristicPositions(templateId);
    
    return NextResponse.json(heuristicPositions);

  } catch (error) {
    console.error('Error analyzing text positions:', error);
    return NextResponse.json(
      { error: 'Failed to analyze text positions' },
      { status: 500 }
    );
  }
}

async function analyzeImgflipExamples(templateId: string) {
  try {
    const knownPatterns = await getKnownTemplatePatterns(templateId);
    if (knownPatterns.length > 0) {
      return knownPatterns;
    }

    
    return [];
  } catch (error) {
    console.error('Error analyzing Imgflip examples:', error);
    return [];
  }
}

async function getKnownTemplatePatterns(templateId: string) {
  
  const templatePatterns: Record<string, Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    score: number;
    reason: string;
  }>> = {
    
    '181913649': [
      { x: 55, y: 15, width: 40, height: 25, score: 0.95, reason: 'Top right text area for "No" option' },
      { x: 55, y: 55, width: 40, height: 25, score: 0.95, reason: 'Bottom right text area for "Yes" option' }
    ],
    
    
    '112126428': [
      { x: 65, y: 10, width: 30, height: 15, score: 0.9, reason: 'Other woman label' },
      { x: 25, y: 75, width: 25, height: 15, score: 0.9, reason: 'Boyfriend label' },
      { x: 5, y: 60, width: 25, height: 15, score: 0.85, reason: 'Girlfriend label' }
    ],
    
    
    '87743020': [
      { x: 15, y: 25, width: 25, height: 15, score: 0.9, reason: 'Left button text' },
      { x: 60, y: 25, width: 25, height: 15, score: 0.9, reason: 'Right button text' },
      { x: 35, y: 75, width: 30, height: 15, score: 0.8, reason: 'Person reaction' }
    ],
    
    
    '93895088': [
      { x: 55, y: 12, width: 40, height: 15, score: 0.9, reason: 'Level 1 text' },
      { x: 55, y: 32, width: 40, height: 15, score: 0.9, reason: 'Level 2 text' },
      { x: 55, y: 52, width: 40, height: 15, score: 0.9, reason: 'Level 3 text' },
      { x: 55, y: 72, width: 40, height: 15, score: 0.9, reason: 'Level 4 text' }
    ],
    
    
    '131940431': [
      { x: 20, y: 15, width: 35, height: 15, score: 0.85, reason: 'Panel 1: The plan' },
      { x: 65, y: 15, width: 30, height: 15, score: 0.85, reason: 'Panel 2: Execute plan' },
      { x: 20, y: 60, width: 35, height: 15, score: 0.85, reason: 'Panel 3: Unexpected result' },
      { x: 65, y: 60, width: 30, height: 15, score: 0.85, reason: 'Panel 4: Gru reaction' }
    ],
    
    
    '131087935': [
      { x: 15, y: 70, width: 20, height: 12, score: 0.8, reason: 'Person label' },
      { x: 25, y: 10, width: 15, height: 10, score: 0.9, reason: 'Balloon 1' },
      { x: 45, y: 8, width: 15, height: 10, score: 0.9, reason: 'Balloon 2' },
      { x: 65, y: 12, width: 15, height: 10, score: 0.9, reason: 'Balloon 3' },
      { x: 85, y: 15, width: 15, height: 10, score: 0.85, reason: 'Balloon 4' }
    ],
    
    
    '55311130': [
      { x: 25, y: 75, width: 50, height: 15, score: 0.9, reason: 'Bottom text for situation' },
      { x: 30, y: 10, width: 40, height: 12, score: 0.8, reason: 'Top text for context' }
    ],
    
    
    '188390779': [
      { x: 15, y: 15, width: 30, height: 15, score: 0.9, reason: 'Woman\'s argument' },
      { x: 65, y: 15, width: 30, height: 15, score: 0.9, reason: 'Cat\'s response' }
    ],
    
    
    '155067746': [
      { x: 25, y: 10, width: 50, height: 15, score: 0.9, reason: 'Setup text' },
      { x: 25, y: 75, width: 50, height: 15, score: 0.9, reason: 'Surprised reaction context' }
    ],
    
    
    '129242436': [
      { x: 35, y: 25, width: 45, height: 20, score: 0.95, reason: 'Sign text with controversial statement' },
      { x: 15, y: 75, width: 30, height: 12, score: 0.7, reason: 'Optional context text' }
    ]
  };

  return templatePatterns[templateId] || [];
}

async function getHeuristicPositions(templateId: string) {
  try {
    const response = await fetch('https://api.imgflip.com/get_memes');
    const data = await response.json();
    
    if (!data.success) {
      throw new Error('Failed to fetch template info');
    }
    
    const template = data.data.memes.find((m: any) => m.id === templateId);
    if (!template) {
      return [
        { x: 10, y: 10, width: 80, height: 15, score: 0.7, reason: 'Top text area' },
        { x: 10, y: 75, width: 80, height: 15, score: 0.7, reason: 'Bottom text area' }
      ];
    }

    
    const width = template.width;
    const height = template.height;
    const aspectRatio = width / height;
    
    const positions = [];
    
    if (aspectRatio > 1.5) {
      
      positions.push(
        { x: 10, y: 15, width: 35, height: 20, score: 0.8, reason: 'Left side text' },
        { x: 55, y: 15, width: 35, height: 20, score: 0.8, reason: 'Right side text' }
      );
    } else if (aspectRatio < 0.8) {
      
      positions.push(
        { x: 20, y: 10, width: 60, height: 15, score: 0.8, reason: 'Top text' },
        { x: 20, y: 45, width: 60, height: 15, score: 0.75, reason: 'Middle text' },
        { x: 20, y: 80, width: 60, height: 15, score: 0.8, reason: 'Bottom text' }
      );
    } else {
      
      positions.push(
        { x: 15, y: 10, width: 70, height: 15, score: 0.85, reason: 'Top text area' },
        { x: 15, y: 75, width: 70, height: 15, score: 0.85, reason: 'Bottom text area' }
      );
    }
    
    return positions;
    
  } catch (error) {
    console.error('Error generating heuristic positions:', error);
    
    
    return [
      { x: 10, y: 10, width: 80, height: 15, score: 0.6, reason: 'Fallback top text' },
      { x: 10, y: 75, width: 80, height: 15, score: 0.6, reason: 'Fallback bottom text' }
    ];
  }
} 
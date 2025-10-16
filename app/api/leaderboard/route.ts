import { NextResponse } from 'next/server';

// In-memory storage for leaderboard
let leaderboard: Array<{ playerName: string; score: number; level: number; theme: string }> = [];

export async function GET() {
  try {
    const limit = 10; // Default limit
    const sortedLeaderboard = [...leaderboard]
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    
    return NextResponse.json(sortedLeaderboard);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { playerName, score, level, theme } = await request.json();

    // Validation
    if (!playerName?.trim()) {
      return NextResponse.json(
        { error: 'Player name is required' },
        { status: 400 }
      );
    }
    if (typeof score !== 'number' || score < 0) {
      return NextResponse.json(
        { error: 'Valid score is required' },
        { status: 400 }
      );
    }
    if (typeof level !== 'number' || level < 1) {
      return NextResponse.json(
        { error: 'Valid level is required' },
        { status: 400 }
      );
    }

    // Add to leaderboard
    leaderboard.push({ playerName, score, level, theme });
    
    // Keep only top 100 scores to prevent memory issues
    leaderboard = leaderboard
      .sort((a, b) => b.score - a.score)
      .slice(0, 100);

    return NextResponse.json(
      { message: 'Score added to leaderboard' },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to add score to leaderboard', message: error.message },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}

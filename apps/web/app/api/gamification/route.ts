import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { GamificationEngine } from '@/lib/gamification/engine';

const gamification = new GamificationEngine(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET /api/gamification?type=stats
export async function GET(request: NextRequest) {
    try {
        const supabase = createRouteHandlerClient({ cookies });
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const searchParams = request.nextUrl.searchParams;
        const type = searchParams.get('type') || 'stats';
        
        let data;
        
        switch (type) {
            case 'stats':
                data = await gamification.getUserStats(user.id);
                break;
            case 'leaderboard':
                const limit = parseInt(searchParams.get('limit') || '50');
                data = await gamification.getLeaderboard(limit);
                break;
            case 'achievements':
                data = await gamification.getAchievementsProgress(user.id);
                break;
            default:
                data = await gamification.getUserStats(user.id);
        }
        
        return NextResponse.json({ success: true, data });
        
    } catch (error) {
        console.error('Gamification API error:', error);
        return NextResponse.json({ error: 'Failed to fetch gamification data' }, { status: 500 });
    }
}

// POST /api/gamification - Track action
export async function POST(request: NextRequest) {
    try {
        const supabase = createRouteHandlerClient({ cookies });
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const body = await request.json();
        const { action, metadata } = body;
        
        if (!action) {
            return NextResponse.json({ error: 'Action required' }, { status: 400 });
        }
        
        const result = await gamification.trackAction(user.id, action, metadata);
        
        return NextResponse.json({ success: true, data: result });
        
    } catch (error) {
        console.error('Track action error:', error);
        return NextResponse.json({ error: 'Failed to track action' }, { status: 500 });
    }
}
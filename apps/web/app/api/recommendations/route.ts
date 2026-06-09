import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { RecommendationScoring } from '@/lib/recommendations/scoring';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type') || 'personalized';
    
    const recommender = new RecommendationScoring(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    let recommendations;
    
    switch(type) {
      case 'trending':
        const { data: trending } = await supabase.rpc('get_trending_content', {
          p_limit: limit
        });
        recommendations = trending;
        break;
        
      case 'related':
        const universeId = searchParams.get('universe_id');
        if (!universeId) throw new Error('universe_id required for related type');
        
        const { data: related } = await supabase.rpc('get_related_universes', {
          p_universe_id: universeId,
          p_limit: limit
        });
        recommendations = related;
        break;
        
      default:
        recommendations = await recommender.getUserRecommendations(user.id, limit);
    }
    
    // Add tracking metadata
    const response = {
      recommendations,
      metadata: {
        type,
        limit,
        userId: user.id,
        timestamp: new Date().toISOString()
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Recommendation error:', error);
    return NextResponse.json({ error: 'Failed to get recommendations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { entity_type, entity_id, interaction_type } = body;
    
    const recommender = new RecommendationScoring(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    await recommender.trackInteraction(user.id, entity_type, entity_id, interaction_type);
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Track error:', error);
    return NextResponse.json({ error: 'Failed to track interaction' }, { status: 500 });
  }
}
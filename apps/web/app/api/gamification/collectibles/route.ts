import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
    try {
        const supabase = createRouteHandlerClient({ cookies });
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const searchParams = request.nextUrl.searchParams;
        const userId = searchParams.get('userId') || user.id;
        
        const { data: collectibles } = await supabase
            .from('user_collectibles')
            .select('*, collectibles(*)')
            .eq('user_id', userId)
            .eq('display_in_gallery', true)
            .order('acquired_at', { ascending: false });
        
        return NextResponse.json(collectibles || []);
        
    } catch (error) {
        console.error('Collectibles API error:', error);
        return NextResponse.json({ error: 'Failed to fetch collectibles' }, { status: 500 });
    }
}
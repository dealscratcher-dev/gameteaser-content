import { NextRequest, NextResponse } from 'next/server';
import { KnowledgeGraph } from '@/lib/graph/knowledgeGraph';

interface RouteContext {
    params: Promise<{ universeId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
    try {
        const { universeId } = await params;
        const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10');

        const kg = new KnowledgeGraph(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const data = await kg.getRelatedUniverses(universeId, limit);
        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Related universes API error:', error);
        return NextResponse.json({ error: 'Failed to fetch related universes' }, { status: 500 });
    }
}

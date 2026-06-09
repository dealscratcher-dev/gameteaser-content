import { NextRequest, NextResponse } from 'next/server';
import { TaxonomyEngine } from '@/lib/taxonomy/taxonomyEngine';

// ─── Singleton ────────────────────────────────────────────────────────────────
// Uses server-only env vars so the service key is never baked into the
// client bundle. Falls back to the public anon vars if the server-side
// equivalents are absent (e.g. during local dev without a .env.local).
// ─────────────────────────────────────────────────────────────────────────────
const taxonomy = new TaxonomyEngine(
    process.env.SUPABASE_URL          ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// ─── Per-method literal unions (sourced directly from taxonomyEngine.ts) ─────
//
// Each TaxonomyEngine method accepts a *different* subset of taxonomy types.
// searchParams.get() returns `string | null`, which TypeScript will not
// automatically narrow to a literal union. We validate against the exact
// tuple for each method and use a type-predicate guard so the compiler
// sees the narrowed type — no `as any` casts required.
//
//   getContentByTaxonomy  → 'category' | 'subcategory' | 'genre' | 'tag'
//   getRelatedTaxonomy    → 'category' | 'genre' | 'tag'          (no subcategory)
//   getTaxonomyBreadcrumbs→ 'category' | 'subcategory' | 'genre'  (no tag)
//   generateSeoMetadata   → 'category' | 'subcategory' | 'genre' | 'tag'
// ─────────────────────────────────────────────────────────────────────────────

type ContentTaxonomyType   = 'category' | 'subcategory' | 'genre' | 'tag';
type RelatedTaxonomyType   = 'category' | 'genre' | 'tag';
type BreadcrumbTaxonomyType= 'category' | 'subcategory' | 'genre';
type SeoTaxonomyType       = 'category' | 'subcategory' | 'genre' | 'tag';

const CONTENT_TYPES:    readonly ContentTaxonomyType[]    = ['category', 'subcategory', 'genre', 'tag'];
const RELATED_TYPES:    readonly RelatedTaxonomyType[]    = ['category', 'genre', 'tag'];
const BREADCRUMB_TYPES: readonly BreadcrumbTaxonomyType[] = ['category', 'subcategory', 'genre'];
const SEO_TYPES:        readonly SeoTaxonomyType[]        = ['category', 'subcategory', 'genre', 'tag'];

function isContentType(v: string): v is ContentTaxonomyType {
    return (CONTENT_TYPES as readonly string[]).includes(v);
}
function isRelatedType(v: string): v is RelatedTaxonomyType {
    return (RELATED_TYPES as readonly string[]).includes(v);
}
function isBreadcrumbType(v: string): v is BreadcrumbTaxonomyType {
    return (BREADCRUMB_TYPES as readonly string[]).includes(v);
}
function isSeoType(v: string): v is SeoTaxonomyType {
    return (SEO_TYPES as readonly string[]).includes(v);
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const type         = searchParams.get('type') || 'categories';
        const taxonomyId   = searchParams.get('id');
        const page         = parseInt(searchParams.get('page')  || '1',  10);
        const limit        = parseInt(searchParams.get('limit') || '20', 10);

        if (Number.isNaN(page) || Number.isNaN(limit)) {
            return NextResponse.json(
                { error: '`page` and `limit` must be integers' },
                { status: 400 },
            );
        }

        let data: unknown;

        switch (type) {
            case 'categories': {
                data = await taxonomy.getCategories();
                break;
            }

            case 'genres': {
                data = await taxonomy.getGenres();
                break;
            }

            case 'tags': {
                data = await taxonomy.getTrendingTags(limit);
                break;
            }

            // getContentByTaxonomy: 'category' | 'subcategory' | 'genre' | 'tag'
            case 'content': {
                if (!taxonomyId) {
                    return NextResponse.json(
                        { error: '`id` is required for type=content' },
                        { status: 400 },
                    );
                }
                const raw = searchParams.get('taxonomyType');
                if (!raw) {
                    return NextResponse.json(
                        { error: '`taxonomyType` is required for type=content' },
                        { status: 400 },
                    );
                }
                if (!isContentType(raw)) {
                    return NextResponse.json(
                        { error: `\`taxonomyType\` must be one of: ${CONTENT_TYPES.join(', ')}` },
                        { status: 400 },
                    );
                }
                data = await taxonomy.getContentByTaxonomy(raw, taxonomyId, page, limit);
                break;
            }

            // getRelatedTaxonomy: 'category' | 'genre' | 'tag'  (no subcategory)
            case 'related': {
                if (!taxonomyId) {
                    return NextResponse.json(
                        { error: '`id` is required for type=related' },
                        { status: 400 },
                    );
                }
                const raw = searchParams.get('relatedType');
                if (!raw) {
                    return NextResponse.json(
                        { error: '`relatedType` is required for type=related' },
                        { status: 400 },
                    );
                }
                if (!isRelatedType(raw)) {
                    return NextResponse.json(
                        { error: `\`relatedType\` must be one of: ${RELATED_TYPES.join(', ')}` },
                        { status: 400 },
                    );
                }
                data = await taxonomy.getRelatedTaxonomy(raw, taxonomyId, limit);
                break;
            }

            // getTaxonomyBreadcrumbs: 'category' | 'subcategory' | 'genre'  (no tag)
            case 'breadcrumbs': {
                if (!taxonomyId) {
                    return NextResponse.json(
                        { error: '`id` is required for type=breadcrumbs' },
                        { status: 400 },
                    );
                }
                const raw = searchParams.get('breadcrumbType');
                if (!raw) {
                    return NextResponse.json(
                        { error: '`breadcrumbType` is required for type=breadcrumbs' },
                        { status: 400 },
                    );
                }
                if (!isBreadcrumbType(raw)) {
                    return NextResponse.json(
                        { error: `\`breadcrumbType\` must be one of: ${BREADCRUMB_TYPES.join(', ')}` },
                        { status: 400 },
                    );
                }
                data = await taxonomy.getTaxonomyBreadcrumbs(raw, taxonomyId);
                break;
            }

            // generateSeoMetadata: 'category' | 'subcategory' | 'genre' | 'tag'
            case 'seo': {
                if (!taxonomyId) {
                    return NextResponse.json(
                        { error: '`id` is required for type=seo' },
                        { status: 400 },
                    );
                }
                const raw = searchParams.get('seoType');
                if (!raw) {
                    return NextResponse.json(
                        { error: '`seoType` is required for type=seo' },
                        { status: 400 },
                    );
                }
                if (!isSeoType(raw)) {
                    return NextResponse.json(
                        { error: `\`seoType\` must be one of: ${SEO_TYPES.join(', ')}` },
                        { status: 400 },
                    );
                }
                data = await taxonomy.generateSeoMetadata(raw, taxonomyId);
                break;
            }

            default: {
                data = await taxonomy.getCategories();
            }
        }

        return NextResponse.json({ success: true, data });

    } catch (error) {
        console.error('Taxonomy API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch taxonomy data' },
            { status: 500 },
        );
    }
}

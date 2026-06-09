export class SchemaGenerator {
    private siteUrl: string;
    
    constructor(siteUrl: string) {
        this.siteUrl = siteUrl;
    }
    
    generateUniverseSchema(universe: {
        id: string;
        name: string;
        description: string | null;
        url: string;
        image: string | null;
        genre: string;
        dateCreated: Date;
        dateModified: Date;
        numberOfCharacters: number;
        numberOfReleases: number;
        interactionCount: number;
    }): any {
        return {
            '@context': 'https://schema.org',
            '@type': 'CreativeWorkSeries',
            '@id': `${this.siteUrl}/universe/${universe.id}`,
            'name': universe.name,
            'description': universe.description,
            'url': universe.url,
            'image': universe.image,
            'genre': universe.genre,
            'dateCreated': universe.dateCreated.toISOString(),
            'dateModified': universe.dateModified.toISOString(),
            'creativeWorkStatus': 'Active',
            'numberOfItems': universe.numberOfReleases,
            'interactionStatistic': {
                '@type': 'InteractionCounter',
                'interactionType': 'https://schema.org/FollowAction',
                'userInteractionCount': universe.interactionCount
            },
            'hasPart': {
                '@type': 'ItemList',
                'itemListElement': [
                    {
                        '@type': 'ListItem',
                        'position': 1,
                        'name': 'Characters',
                        'item': `${universe.url}/characters`,
                        'numberOfItems': universe.numberOfCharacters
                    },
                    {
                        '@type': 'ListItem',
                        'position': 2,
                        'name': 'Releases',
                        'item': `${universe.url}/releases`,
                        'numberOfItems': universe.numberOfReleases
                    }
                ]
            }
        };
    }
    
    generateCharacterSchema(character: {
        id: string;
        name: string;
        description: string | null;
        url: string;
        image: string | null;
        role: string | null;
        universeName: string;
        universeUrl: string;
        aliases: string[];
        interactionCount: number;
    }): any {
        return {
            '@context': 'https://schema.org',
            '@type': 'Person',
            '@id': `${this.siteUrl}/character/${character.id}`,
            'name': character.name,
            'description': character.description,
            'url': character.url,
            'image': character.image,
            'jobTitle': character.role || 'Character',
            'additionalName': character.aliases,
            'interactionStatistic': {
                '@type': 'InteractionCounter',
                'interactionType': 'https://schema.org/LikeAction',
                'userInteractionCount': character.interactionCount
            },
            'worksFor': {
                '@type': 'CreativeWorkSeries',
                'name': character.universeName,
                'url': character.universeUrl
            }
        };
    }
    
    generateReleaseSchema(release: {
        id: string;
        name: string;
        description: string | null;
        url: string;
        image: string | null;
        type: string;
        status: string;
        releaseDate: Date | null;
        universeName: string;
        universeUrl: string;
    }): any {
        const typeMapping: Record<string, string> = {
            'game': 'VideoGame',
            'movie': 'Movie',
            'series': 'TVSeries',
            'manga': 'Book',
            'comic': 'ComicIssue'
        };
        
        return {
            '@context': 'https://schema.org',
            '@type': typeMapping[release.type] || 'CreativeWork',
            '@id': `${this.siteUrl}/release/${release.id}`,
            'name': release.name,
            'description': release.description,
            'url': release.url,
            'image': release.image,
            'creativeWorkStatus': release.status.toUpperCase(),
            'datePublished': release.releaseDate?.toISOString(),
            'isPartOf': {
                '@type': 'CreativeWorkSeries',
                'name': release.universeName,
                'url': release.universeUrl
            }
        };
    }
    
    generateVideoSchema(video: {
        name: string;
        description: string;
        thumbnailUrl: string;
        contentUrl: string;
        embedUrl: string;
        uploadDate: Date;
        duration?: string;
    }): any {
        return {
            '@context': 'https://schema.org',
            '@type': 'VideoObject',
            'name': video.name,
            'description': video.description,
            'thumbnailUrl': video.thumbnailUrl,
            'contentUrl': video.contentUrl,
            'embedUrl': video.embedUrl,
            'uploadDate': video.uploadDate.toISOString(),
            'duration': video.duration
        };
    }
    
    generateFAQSchema(faqs: Array<{ question: string; answer: string }>): any {
        return {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            'mainEntity': faqs.map(faq => ({
                '@type': 'Question',
                'name': faq.question,
                'acceptedAnswer': {
                    '@type': 'Answer',
                    'text': faq.answer
                }
            }))
        };
    }
    
    generateReviewSchema(review: {
        itemName: string;
        itemUrl: string;
        reviewBody: string;
        reviewRating: number;
        authorName: string;
        datePublished: Date;
    }): any {
        return {
            '@context': 'https://schema.org',
            '@type': 'Review',
            'itemReviewed': {
                '@type': 'CreativeWork',
                'name': review.itemName,
                'url': review.itemUrl
            },
            'reviewBody': review.reviewBody,
            'reviewRating': {
                '@type': 'Rating',
                'ratingValue': review.reviewRating,
                'bestRating': 5,
                'worstRating': 1
            },
            'author': {
                '@type': 'Person',
                'name': review.authorName
            },
            'datePublished': review.datePublished.toISOString()
        };
    }
    
    generateHowToSchema(howTo: {
        name: string;
        description: string;
        steps: Array<{ name: string; text: string; image?: string }>;
        totalTime?: string;
        estimatedCost?: string;
    }): any {
        return {
            '@context': 'https://schema.org',
            '@type': 'HowTo',
            'name': howTo.name,
            'description': howTo.description,
            'totalTime': howTo.totalTime,
            'estimatedCost': howTo.estimatedCost,
            'step': howTo.steps.map((step, index) => ({
                '@type': 'HowToStep',
                'position': index + 1,
                'name': step.name,
                'text': step.text,
                'image': step.image
            }))
        };
    }
}
'use client';

import { SocialShareData } from '@/lib/seo/types';

interface SocialShareProps {
    data: SocialShareData;
    className?: string;
}

export function SocialShare({ data, className = '' }: SocialShareProps) {
    const shareUrls = {
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(data.title)}&url=${encodeURIComponent(data.url)}&hashtags=${data.hashtags?.join(',') || ''}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.url)}`,
        reddit: `https://reddit.com/submit?url=${encodeURIComponent(data.url)}&title=${encodeURIComponent(data.title)}`,
        linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(data.url)}&title=${encodeURIComponent(data.title)}`,
        pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(data.url)}&media=${encodeURIComponent(data.imageUrl || '')}&description=${encodeURIComponent(data.description)}`
    };
    
    const handleShare = async (platform: keyof typeof shareUrls | 'native') => {
        if (platform === 'native' && navigator.share) {
            try {
                await navigator.share({
                    title: data.title,
                    text: data.description,
                    url: data.url
                });
            } catch {
                console.log('Share cancelled');
            }
        } else if (platform !== 'native') {
            window.open(shareUrls[platform], '_blank', 'width=600,height=400');
        }
    };
    
    return (
        <div className={`flex gap-2 ${className}`}>
            <button
                onClick={() => handleShare('twitter')}
                className="p-2 bg-[#1DA1F2] rounded-lg hover:opacity-80 transition"
                aria-label="Share on Twitter"
            >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
            </button>
            
            <button
                onClick={() => handleShare('facebook')}
                className="p-2 bg-[#4267B2] rounded-lg hover:opacity-80 transition"
                aria-label="Share on Facebook"
            >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879v-6.99h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.99C18.343 21.128 22 16.991 22 12z"/>
                </svg>
            </button>
            
            <button
                onClick={() => handleShare('reddit')}
                className="p-2 bg-[#FF4500] rounded-lg hover:opacity-80 transition"
                aria-label="Share on Reddit"
            >
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z"/>
                </svg>
            </button>
            
            {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                    onClick={() => handleShare('native')}
                    className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
                    aria-label="Share"
                >
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.05 4.11c-.05.23-.09.46-.09.7 0 1.66 1.34 3 3 3s3-1.34 3-3-1.34-3-3-3z"/>
                    </svg>
                </button>
            )}
        </div>
    );
}
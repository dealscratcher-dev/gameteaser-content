import Hero, { type HeroProps } from './Hero';

export type HeroBannerProps = HeroProps;

/** Full-width hero banner — thin wrapper around Hero with sensible defaults. */
export default function HeroBanner(props: HeroBannerProps) {
    return (
        <Hero
            kicker="games · anime · comic-cons"
            imageSrc="/assets/hero-banner.png"
            imageAlt="Tactical operators showdown"
            {...props}
        />
    );
}

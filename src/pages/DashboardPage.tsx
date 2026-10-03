import { useState } from "react";
import { Link } from "react-router-dom";
import { ReviewBadge } from "@/components/content";
import { PageHeader } from "@/components/layout";
import { ArrowDownIcon, ArrowUpIcon, Button, Card, MediaCell, PlayIcon, StatCard } from "@/components/ui";
import { useBookingsStore, useFilters, useLiveShows, useRolls, useSections, useTitles } from "@/hooks/useStores";
import { CONTENT_LABEL } from "@/lib/content";
import { formatShowTime } from "@/lib/live";
import { placeholderImageUrl } from "@/lib/placeholder-media";
import { posterSrc } from "@/lib/poster";
import { resolveSection } from "@/lib/sections";

const art = (item: { id: string; kind: string }, width: number, height: number) => `url(${posterSrc(item) ?? placeholderImageUrl(item.id, width, height)})`;

/** Overview laid out like the site's Home: the hero carousel up top, then the numbers. */
export function DashboardPage() {
  const titles = useTitles().items;
  const shows = useLiveShows().items;
  const rolls = useRolls().items;
  const bookings = useBookingsStore().items;
  const filters = useFilters().items;
  const heroSection = useSections().items.find((section) => section.page === "home" && section.layout === "hero");
  const [index, setIndex] = useState(0);

  const heroItems = heroSection ? resolveSection(heroSection, { titles, liveShows: shows, rolls, filters }) : [];
  const hero = titles.find((title) => title.id === heroItems[index % Math.max(1, heroItems.length)]?.id);
  const step = (delta: number) => setIndex((current) => (current + delta + heroItems.length) % heroItems.length);

  const pending = [
    ...titles.map((title) => ({ id: title.id, type: title.kind === "movie" ? ("movie" as const) : ("show" as const), title: title.title, review: title.review, src: posterSrc(title) })),
    ...shows.map((show) => ({ id: show.id, type: "live" as const, title: show.title, review: show.review, src: undefined })),
    ...rolls.map((roll) => ({ id: roll.id, type: "roll" as const, title: roll.handle, review: roll.review, src: undefined })),
  ].filter((item) => item.review.status === "pending");
  const topRated = titles.filter((title) => title.rating && title.review.status === "approved").sort((a, b) => Number(b.rating) - Number(a.rating)).slice(0, 3);
  const upcoming = shows.filter((show) => show.status === "scheduled").sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const revenue = bookings.filter((booking) => booking.status === "confirmed").reduce((sum, booking) => sum + booking.amount, 0);
  const movieCount = titles.filter((title) => title.kind === "movie").length;

  return (
    <div>
      {hero && (
        <section className="hero" style={{ backgroundImage: art(hero, 1600, 900) }}>
          <div className="hero-body">
            <span className="glass-pill">
              🔥 Home hero · {(index % heroItems.length) + 1} of {heroItems.length}
            </span>
            <h1 className="hero-title">{hero.title}</h1>
            <p className="muted">
              {hero.meta}
              {hero.rating && ` · ★ ${hero.rating}`}
            </p>
            {hero.synopsis && <p className="muted">{hero.synopsis}</p>}
            <div className="inline">
              <Link to="/sections" className="btn btn-light">
                <PlayIcon size={16} />
                Edit Home sections
              </Link>
              <Link to={hero.kind === "movie" ? "/movies" : "/shows"} className="btn">
                Manage {hero.kind === "movie" ? "movies" : "shows"}
              </Link>
            </div>
          </div>
          {heroItems.length > 1 && (
            <div className="hero-nav">
              <Button round aria-label="Previous hero title" onClick={() => step(-1)}>
                <ArrowUpIcon size={20} />
              </Button>
              <Button round variant="light" aria-label="Next hero title" onClick={() => step(1)}>
                <ArrowDownIcon size={20} />
              </Button>
            </div>
          )}
        </section>
      )}

      <div className="stats">
        <StatCard label="Movies & shows" value={titles.length} meta={`${movieCount} movies · ${titles.length - movieCount} shows`} />
        <StatCard label="Live now" value={shows.filter((show) => show.status === "live").length} meta={`${upcoming.length} upcoming`} />
        <StatCard label="Ticket revenue" value={`₹${revenue.toLocaleString("en-IN")}`} meta={`${bookings.length} bookings`} />
        <StatCard label="Waiting for review" value={pending.length} meta={`${rolls.length} rolls · ${filters.length} filters`} />
      </div>

      <div className="grid-3">
        <Card title="Waiting for review" actions={<Link to="/reviews" className="muted">Open queue</Link>}>
          <div className="stack-sm">
            {pending.map((item) => (
              <div key={item.id} className="inline">
                <div className="grow">
                  <MediaCell seed={item.id} src={item.src} title={item.title} meta={CONTENT_LABEL[item.type]} width={64} radius={8} />
                </div>
                <ReviewBadge review={item.review} />
              </div>
            ))}
            {pending.length === 0 && <p className="muted">All caught up.</p>}
          </div>
        </Card>
        <Card title="Coming up" actions={<Link to="/live" className="muted">Live events</Link>}>
          <div className="stack-sm">
            {upcoming.map((show) => (
              <MediaCell key={show.id} seed={show.id} title={show.title} meta={`${formatShowTime(show.startsAt)} · ${show.access === "free" ? "Free" : `₹${show.price}`}`} width={64} radius={8} />
            ))}
          </div>
        </Card>
        <Card title="Catalog setup" actions={<Link to="/filters" className="muted">Filters</Link>}>
          <div className="stack-sm">
            {filters.map((group) => (
              <div key={group.id} className="inline">
                <span className="grow strong">{group.name}</span>
                <span className="muted">{group.options.length} options</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt">
        <PageHeader section title="Top rated" description="Highest-rated approved titles." actions={<Link to="/movies" className="muted">See all</Link>} />
        <div className="grid-3">
          {topRated.map((title) => (
            <Link key={title.id} to={title.kind === "movie" ? "/movies" : "/shows"} className="poster-card" style={{ backgroundImage: art(title, 800, 640) }}>
              <span className="poster-footer">
                <span className="grow">
                  <span className="card-title truncate block">
                    {title.title}
                  </span>
                  <span className="muted small">{title.meta}</span>
                </span>
                <span className="play-dot">
                  <PlayIcon size={14} />
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

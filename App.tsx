import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowLeft, ArrowRight, Bookmark, Check, ChevronDown, Clapperboard, ExternalLink, Heart, Menu, Play, Search, Shuffle, SlidersHorizontal, Sparkles, Star, X } from 'lucide-react';
import './index.css';

type Anime = {
  id: number;
  title: { romaji: string; english?: string | null };
  coverImage?: { extraLarge?: string; large?: string };
  bannerImage?: string | null;
  description?: string | null;
  averageScore?: number | null;
  genres?: string[];
  episodes?: number | null;
  format?: string | null;
  seasonYear?: number | null;
  trailer?: { id: string; site: string; thumbnail?: string } | null;
  externalLinks?: { site: string; url: string; type?: string }[];
};

const fallbackNames = `Attack on Titan|Death Note|Fullmetal Alchemist: Brotherhood|One Piece|Naruto|Naruto: Shippuden|Demon Slayer: Kimetsu no Yaiba|Jujutsu Kaisen|Chainsaw Man|My Hero Academia|Hunter x Hunter|One Punch Man|Mob Psycho 100|Tokyo Ghoul|Sword Art Online|Spy x Family|Blue Lock|Haikyu!!|Dr. Stone|Black Clover|Bleach|Dragon Ball Z|Dragon Ball Super|Code Geass|Steins;Gate|Cowboy Bebop|Neon Genesis Evangelion|Vinland Saga|Solo Leveling|Frieren: Beyond Journey's End|The Apothecary Diaries|Bungo Stray Dogs|JoJo's Bizarre Adventure|The Promised Neverland|Parasyte: The Maxim|Re:ZERO -Starting Life in Another World-|KonoSuba|Overlord|That Time I Got Reincarnated as a Slime|Mushoku Tensei: Jobless Reincarnation|The Rising of the Shield Hero|No Game No Life|Fate/Zero|Fate/stay night: Unlimited Blade Works|Fate/stay night: Heaven's Feel|Violet Evergarden|Your Lie in April|A Silent Voice|Your Name.|Weathering With You|Suzume|Spirited Away|Howl's Moving Castle|Princess Mononoke|My Neighbor Totoro|Kiki's Delivery Service|Ponyo|The Boy and the Heron|Akira|Ghost in the Shell|Cyberpunk: Edgerunners|Psycho-Pass|86 Eighty-Six|Gurren Lagann|Kill la Kill|Darling in the Franxx|Made in Abyss|Puella Magi Madoka Magica|Erased|Monster|Pluto|Odd Taxi|The Tatami Galaxy|Samurai Champloo|Trigun|Trigun Stampede|Hellsing Ultimate|Berserk|Claymore|Dororo|Golden Kamuy|Kingdom|Ranking of Kings|To Your Eternity|The Ancient Magus' Bride|Noragami|Fire Force|Soul Eater|Fairy Tail|The Seven Deadly Sins|Magi: The Labyrinth of Magic|Assassination Classroom|Classroom of the Elite|Kaguya-sama: Love Is War|Horimiya|Toradora!|Clannad|Fruits Basket|Nana|Komi Can't Communicate|My Dress-Up Darling|Oshi no Ko|Bocchi the Rock!|K-On!|Sound! Euphonium|Banana Fish|Given|Yuri!!! on Ice|SK8 the Infinity|Free!|Kuroko's Basketball|Slam Dunk|Hajime no Ippo|Baki|The Disastrous Life of Saiki K.|Gintama|Nichijou|The Devil is a Part-Timer!|Food Wars!|Beastars|Dorohedoro|Devilman Crybaby|Castlevania|Great Pretender|Carole & Tuesday|Vivy: Fluorite Eye's Song|Lycoris Recoil|The Eminence in Shadow|The Dangers in My Heart|Delicious in Dungeon|Kaiju No. 8|Wind Breaker|Hell's Paradise|Undead Unluck|Mashle: Magic and Muscles|Zom 100: Bucket List of the Dead|Blue Exorcist|D.Gray-man|Inuyasha|Rurouni Kenshin|Yu Yu Hakusho|The Quintessential Quintuplets|Rent-a-Girlfriend|The Angel Next Door Spoils Me Rotten|Skip and Loafer|A Sign of Affection|The Case Study of Vanitas|The Garden of Words|5 Centimeters per Second|The Girl Who Leapt Through Time|Paprika|Perfect Blue`;

const fallbackAnime: Anime[] = fallbackNames.split('|').map((name, index) => ({
  id: -(index + 1), title: { romaji: name }, averageScore: 77 + (index % 17),
  genres: [(['Action', 'Adventure', 'Fantasy', 'Drama', 'Romance', 'Comedy', 'Sci-Fi'][index % 7])],
  format: index % 9 === 0 ? 'MOVIE' : 'TV', seasonYear: 2024 - (index % 22),
}));

const query = `query ($page: Int) {
  Page(page: $page, perPage: 50) {
    media(type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
      id title { romaji english } coverImage { extraLarge large } bannerImage
      description(asHtml: false) averageScore genres episodes format seasonYear
      trailer { id site thumbnail } externalLinks { site url type }
    }
  }
}`;

async function fetchPage(page: number): Promise<Anime[]> {
  const response = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query, variables: { page } }),
  });
  if (!response.ok) throw new Error('Catalog unavailable');
  const result = await response.json();
  if (result.errors) throw new Error('Catalog unavailable');
  return result.data.Page.media;
}

const titleOf = (anime: Anime) => anime.title.english || anime.title.romaji;
const posterOf = (anime: Anime) => anime.coverImage?.extraLarge || anime.coverImage?.large;
const stripHtml = (text: string) => text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
const genres = ['All', 'Action', 'Adventure', 'Fantasy', 'Romance', 'Comedy', 'Drama', 'Sci-Fi', 'Slice of Life', 'Sports', 'Mystery'];
const fadeUp = { hidden: { opacity: 0, y: 25 }, show: { opacity: 1, y: 0 } };

function Poster({ anime, onClick, index = 0, saved = false, onSave }: { anime: Anime; onClick: () => void; index?: number; saved?: boolean; onSave: () => void }) {
  return (
    <motion.article variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }} transition={{ duration: .45, delay: Math.min(index % 6, 5) * .045 }} className="poster-item group">
      <button onClick={onClick} className="poster-art" aria-label={`View ${titleOf(anime)}`}>
        {posterOf(anime) ? <img src={posterOf(anime)} alt={`${titleOf(anime)} poster`} loading="lazy" /> : <div className={`poster-placeholder poster-tone-${Math.abs(anime.id) % 6}`}><span>{titleOf(anime)}</span></div>}
        <span className="poster-shade" />
        <span className="poster-play"><Play size={21} fill="currentColor" /></span>
        {anime.averageScore ? <span className="poster-rating"><Star size={11} fill="currentColor" /> {(anime.averageScore / 10).toFixed(1)}</span> : null}
      </button>
      <div className="poster-info">
        <button onClick={onClick} className="poster-title" title={titleOf(anime)}>{titleOf(anime)}</button>
        <button onClick={onSave} className={`poster-save ${saved ? 'is-saved' : ''}`} aria-label={saved ? `Remove ${titleOf(anime)} from My List` : `Add ${titleOf(anime)} to My List`}><Bookmark size={17} fill={saved ? 'currentColor' : 'none'} /></button>
      </div>
      <p className="poster-meta">{anime.seasonYear || 'Anime'} <span>·</span> {anime.format === 'MOVIE' ? 'Movie' : anime.episodes ? `${anime.episodes} eps` : anime.format || 'Series'}</p>
    </motion.article>
  );
}

function DetailModal({ anime, saved, onSave, onClose }: { anime: Anime; saved: boolean; onSave: () => void; onClose: () => void }) {
  const [tab, setTab] = useState<'episodes' | 'preview' | 'watch'>(anime.id > 0 ? 'episodes' : 'preview');
  const [episode, setEpisode] = useState(1);
  const [audio, setAudio] = useState<'sub' | 'dub'>('sub');
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);
  const streamLinks = (anime.externalLinks || []).filter(link => link.type === 'STREAMING' || /crunchyroll|netflix|hulu|disney|youtube|prime video|hidive|bilibili|tubi/i.test(link.site));
  const hasTrailer = anime.trailer?.site?.toLowerCase() === 'youtube' && !!anime.trailer.id;

  return (
    <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="detail-modal" role="dialog" aria-modal="true" aria-label={titleOf(anime)} initial={{ opacity: 0, y: 36, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: .97 }} transition={{ duration: .28 }} onClick={event => event.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close details"><X size={22} /></button>
        <div className="detail-visual" style={{ backgroundImage: `linear-gradient(90deg, #111018 4%, rgba(17,16,24,.65) 50%, rgba(17,16,24,.12)), linear-gradient(0deg, #111018, transparent 55%), url('${anime.bannerImage || posterOf(anime) || '/images/hero-anime.jpg'}')` }}>
          <div className="detail-visual-content">
            <span className="detail-kicker">WATCH ANIME 06 / THE COLLECTION</span>
            <h2>{titleOf(anime)}</h2>
            <div className="detail-meta"><span className="score"><Star size={14} fill="currentColor" /> {anime.averageScore ? (anime.averageScore / 10).toFixed(1) : 'N/A'}</span><span>{anime.seasonYear || 'Anime'}</span><span>{anime.format === 'MOVIE' ? 'Movie' : anime.format || 'Series'}</span>{anime.episodes ? <span>{anime.episodes} episodes</span> : null}</div>
            <div className="detail-genres">{anime.genres?.slice(0, 3).join('  /  ') || 'Anime series'}</div>
          </div>
        </div>
        <div className="detail-body">
          <div className="detail-copy">
            <p>{anime.description ? stripHtml(anime.description).slice(0, 360) + (anime.description.length > 360 ? '...' : '') : `Discover ${titleOf(anime)} and find your next favorite story.`}</p>
            <button className={`detail-save ${saved ? 'is-saved' : ''}`} onClick={onSave}>{saved ? <Check size={17} /> : <Bookmark size={17} />} {saved ? 'Added to My List' : 'Add to My List'}</button>
          </div>
          <div className="player-section">
            <div className="player-header"><h3>Watch & discover</h3><div className="player-tabs">{anime.id > 0 && <button className={tab === 'episodes' ? 'active' : ''} onClick={() => setTab('episodes')}>Episodes</button>}<button className={tab === 'preview' ? 'active' : ''} onClick={() => setTab('preview')}>Trailer</button><button className={tab === 'watch' ? 'active' : ''} onClick={() => setTab('watch')}>Watch options</button></div></div>
            {tab === 'episodes' ? <>
              <div className="episode-toolbar"><span>EPISODE <strong>{episode}</strong>{anime.episodes ? ` / ${anime.episodes}` : ''}</span><div className="audio-switch"><button className={audio === 'sub' ? 'active' : ''} onClick={() => setAudio('sub')}>SUB</button><button className={audio === 'dub' ? 'active' : ''} onClick={() => setAudio('dub')}>DUB</button></div></div>
              <div className="video-frame"><iframe key={`${anime.id}-${episode}-${audio}`} src={`https://megavid.buzz/ani/${anime.id}/${episode}/${audio}?color=%23a777f0`} title={`${titleOf(anime)} episode ${episode} ${audio}`} allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowFullScreen referrerPolicy="no-referrer" /></div>
              <div className="episode-navigation"><button onClick={() => setEpisode(value => Math.max(1, value - 1))} disabled={episode === 1}><ArrowLeft size={16} /> Previous episode</button><button onClick={() => setEpisode(value => Math.min(anime.episodes || 999, value + 1))} disabled={!!anime.episodes && episode >= anime.episodes}>Next episode <ArrowRight size={16} /></button></div>
              <p className="player-note">Episode playback is supplied by an independent third-party embed and may not be available for every title or region. If it does not load, try the trailer or watch options.</p>
            </> : tab === 'preview' ? (
              <div className="video-frame">
                {hasTrailer ? <iframe key={anime.id} src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(anime.trailer!.id)}?rel=0`} title={`${titleOf(anime)} official trailer`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /> : <div className="video-empty" style={{ backgroundImage: `linear-gradient(0deg, rgba(10,9,17,.92), rgba(10,9,17,.4)), url('${anime.bannerImage || posterOf(anime) || '/images/hero-anime.jpg'}')` }}><Clapperboard size={34} /><strong>Trailer not available</strong><span>Explore viewing options for this title.</span><button onClick={() => setTab('watch')}>Where to watch <ArrowRight size={15} /></button></div>}
              </div>
            ) : (
              <div className="watch-options">
                <p>Streaming availability depends on your region. Continue on a provider's website to watch full episodes.</p>
                {streamLinks.length ? <div className="provider-list">{streamLinks.map((link, i) => <a key={`${link.site}-${i}`} href={link.url} target="_blank" rel="noopener noreferrer"><span><Play size={15} /> {link.site}</span><ExternalLink size={16} /></a>)}</div> : <div className="no-provider">No streaming provider is listed for this title. <a href={`https://www.justwatch.com/us/search?q=${encodeURIComponent(titleOf(anime))}`} target="_blank" rel="noopener noreferrer">Search on JustWatch <ExternalLink size={14} /></a></div>}
              </div>
            )}
            {tab !== 'episodes' && <p className="player-note">Trailers are embedded from YouTube. Streaming availability varies by provider and region.</p>}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function App() {
  const [anime, setAnime] = useState<Anime[]>(fallbackAnime);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('All');
  const [sort, setSort] = useState('Popular');
  const [view, setView] = useState<'Discover' | 'Browse' | 'My List'>('Discover');
  const [visible, setVisible] = useState(24);
  const [selected, setSelected] = useState<Anime | null>(null);
  const [savedIds, setSavedIds] = useState<number[]>(() => { try { return JSON.parse(localStorage.getItem('wa06-list') || '[]'); } catch { return []; } });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [trendingOffset, setTrendingOffset] = useState(0);
  const catalogRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    Promise.allSettled([fetchPage(1), fetchPage(2), fetchPage(3)]).then(results => {
      if (!alive) return;
      const fetched = results.flatMap(result => result.status === 'fulfilled' ? result.value : []);
      if (fetched.length) {
        const fetchedTitles = new Set(fetched.flatMap(item => [item.title.romaji.toLowerCase(), item.title.english?.toLowerCase()].filter(Boolean)));
        setAnime(fetched.length >= 100 ? fetched : [...fetched, ...fallbackAnime.filter(item => !fetchedTitles.has(item.title.romaji.toLowerCase()))]);
      }
      setLoading(false);
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => { localStorage.setItem('wa06-list', JSON.stringify(savedIds)); }, [savedIds]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === '/' && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement)) {
        event.preventDefault();
        if (window.innerWidth <= 650) setMobileSearchOpen(true);
        setTimeout(() => searchRef.current?.focus(), 0);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const toggleSave = (id: number) => setSavedIds(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  const goCatalog = () => catalogRef.current?.scrollIntoView({ behavior: 'smooth' });
  const navigate = (next: typeof view) => { setView(next); setMobileOpen(false); if (next !== 'Discover') setTimeout(goCatalog, 60); else window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const filtered = useMemo(() => {
    let result = anime.filter(item => (view !== 'My List' || savedIds.includes(item.id)) && (genre === 'All' || item.genres?.includes(genre)) && (!search || `${item.title.romaji} ${item.title.english || ''}`.toLowerCase().includes(search.toLowerCase())));
    if (sort === 'Top rated') result = [...result].sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0));
    if (sort === 'Newest') result = [...result].sort((a, b) => (b.seasonYear || 0) - (a.seasonYear || 0));
    if (sort === 'A to Z') result = [...result].sort((a, b) => titleOf(a).localeCompare(titleOf(b)));
    return result;
  }, [anime, genre, search, sort, view, savedIds]);

  const trending = anime.slice(trendingOffset, trendingOffset + 8);
  const randomAnime = () => setSelected(anime[Math.floor(Math.random() * anime.length)]);

  return (
    <div className="site-shell">
      <header className="site-header">
        <button className="brand" onClick={() => navigate('Discover')} aria-label="Watch Anime 06 home"><span className="brand-mark"><Play size={15} fill="currentColor" strokeWidth={3} /></span><span>WATCH<span className="brand-accent">ANIME</span><b>06</b></span></button>
        <nav className="desktop-nav" aria-label="Main navigation">{(['Discover', 'Browse', 'My List'] as const).map(item => <button key={item} onClick={() => navigate(item)} className={view === item ? 'nav-active' : ''}>{item}</button>)}</nav>
        <div className="header-actions"><div className={`header-search ${mobileSearchOpen ? 'mobile-search-open' : ''}`}><Search size={18} /><input ref={searchRef} placeholder="Search anime..." aria-label="Search anime" value={search} onChange={event => { setSearch(event.target.value); setVisible(24); if (event.target.value) setView('Browse'); }} onKeyDown={event => { if (event.key === 'Enter') { goCatalog(); setMobileSearchOpen(false); } }} />{search && <button aria-label="Clear search" onClick={() => setSearch('')}><X size={15} /></button>}<kbd>/</kbd></div><button className="icon-search" aria-label="Search" onClick={() => { setMobileSearchOpen(value => !value); setMobileOpen(false); setTimeout(() => searchRef.current?.focus(), 100); }}><Search size={21} /></button><button className="mobile-menu-button" aria-label="Open menu" onClick={() => { setMobileOpen(!mobileOpen); setMobileSearchOpen(false); }}>{mobileOpen ? <X size={23} /> : <Menu size={23} />}</button></div>
        {mobileOpen && <nav className="mobile-nav">{(['Discover', 'Browse', 'My List'] as const).map(item => <button key={item} onClick={() => navigate(item)}>{item}</button>)}</nav>}
      </header>

      <main>
        <section className="hero" aria-label="Welcome to Watch Anime 06">
          <div className="hero-art" />
          <div className="hero-overlay" />
          <div className="hero-content">
            <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, delay: .1 }} className="hero-eyebrow"><span className="eyebrow-line" /> YOUR WORLD. YOUR STORIES.</motion.div>
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .75, delay: .22 }}>Watch Anime <span>06<span className="hero-period">.</span></span></motion.h1>
            <motion.p className="hero-lead" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, delay: .37 }}>A universe of stories awaits.</motion.p>
            <motion.p className="hero-sub" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, delay: .46 }}>Discover the anime everyone loves, find something new, and make every story your own.</motion.p>
            <motion.div className="hero-buttons" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, delay: .57 }}><button className="primary-button" onClick={goCatalog}><Play size={17} fill="currentColor" /> Explore anime</button><button className="secondary-button" onClick={randomAnime}><Shuffle size={17} /> Surprise me</button></motion.div>
          </div>
          <button className="scroll-cue" onClick={goCatalog}>SCROLL TO EXPLORE <ArrowDown size={15} /></button>
          <div className="hero-index"><span>01</span><div /><span>03</span></div>
        </section>

        <section className="trending-section content-wrap" aria-labelledby="trending-heading">
          <div className="section-heading"><div><p className="section-kicker"><Sparkles size={14} /> THE SPOTLIGHT</p><h2 id="trending-heading">Trending <em>right now.</em></h2><p className="section-description">The stories everyone's talking about.</p></div><div className="section-controls"><button aria-label="Previous trending anime" onClick={() => setTrendingOffset(Math.max(0, trendingOffset - 4))} disabled={trendingOffset === 0}><ArrowLeft size={19} /></button><button aria-label="Next trending anime" onClick={() => setTrendingOffset(Math.min(Math.max(0, anime.length - 8), trendingOffset + 4))}><ArrowRight size={19} /></button></div></div>
          <div className="trending-grid">{trending.map((item, index) => <Poster key={item.id} anime={item} index={index} onClick={() => setSelected(item)} saved={savedIds.includes(item.id)} onSave={() => toggleSave(item.id)} />)}</div>
        </section>

        <section className="catalog-section content-wrap" ref={catalogRef} aria-labelledby="catalog-heading">
          <div className="catalog-top"><div><p className="section-kicker"><span className="small-dot" /> THE COLLECTION</p><h2 id="catalog-heading">{view === 'My List' ? 'Your list.' : search ? 'Search results.' : 'Find your next favorite.'}</h2><p className="section-description">{view === 'My List' ? 'All the stories you saved for later.' : search ? `Showing matches for "${search}"` : 'From all-time classics to your next obsession.'}</p></div><span className="catalog-count">{filtered.length}{loading ? '+' : ''} TITLES</span></div>
          <div className="catalog-toolbar"><div className="genre-scroll" aria-label="Filter by genre">{genres.map(item => <button key={item} className={genre === item ? 'genre-active' : ''} onClick={() => { setGenre(item); setVisible(24); }}>{item}</button>)}</div><div className="sort-wrap"><SlidersHorizontal size={17} /><select aria-label="Sort anime" value={sort} onChange={event => setSort(event.target.value)}><option>Popular</option><option>Top rated</option><option>Newest</option><option>A to Z</option></select><ChevronDown size={15} /></div></div>
          {filtered.length ? <div className="catalog-grid">{filtered.slice(0, visible).map((item, index) => <Poster key={item.id} anime={item} index={index} onClick={() => setSelected(item)} saved={savedIds.includes(item.id)} onSave={() => toggleSave(item.id)} />)}</div> : <div className="empty-state"><Heart size={32} /><h3>{view === 'My List' ? 'Your list is waiting.' : 'No anime found.'}</h3><p>{view === 'My List' ? 'Save titles you love with the bookmark icon and find them here.' : 'Try another search or genre to find your next story.'}</p><button onClick={() => { setSearch(''); setGenre('All'); if (view === 'My List') setView('Browse'); }}>Explore anime <ArrowRight size={16} /></button></div>}
          {visible < filtered.length && <div className="load-more"><button onClick={() => setVisible(current => current + 24)}>Explore more anime <ArrowDown size={17} /></button><span>SHOWING {Math.min(visible, filtered.length)} OF {filtered.length}</span></div>}
        </section>
      </main>

      <footer className="footer"><div className="content-wrap footer-inner"><div><button className="brand" onClick={() => navigate('Discover')}><span className="brand-mark"><Play size={15} fill="currentColor" strokeWidth={3} /></span><span>WATCH<span className="brand-accent">ANIME</span><b>06</b></span></button><p>Find a story worth staying up for.</p></div><div className="footer-right"><span>Made for the love of anime.</span><span>Anime data by AniList. Video previews by YouTube.</span></div></div></footer>

      <AnimatePresence>{selected && <DetailModal key={selected.id} anime={selected} saved={savedIds.includes(selected.id)} onSave={() => toggleSave(selected.id)} onClose={() => setSelected(null)} />}</AnimatePresence>
    </div>
  );
}
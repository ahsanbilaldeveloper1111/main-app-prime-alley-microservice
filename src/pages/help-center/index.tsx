import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
  useEffect,
  useRef,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { useRouter } from "next/router";
import { ListFAQModules, getMostViewedFAQs, ListFAQItems } from "@utils/faqs";
import Link from "next/link";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";

import { Row, Col } from 'react-bootstrap';
import {
  BookOpen,
  Ticket,
  Headphones,
  Activity,
  Search,
  ChevronRight,
  FileQuestion,
  TrendingUp,
  X,
  Layers,
  HelpCircle,
  Settings,
  Users,
  Bell,
  CreditCard,
  ShieldCheck,
  Zap,
  Globe,
  BarChart2,
  MessageSquare,
  Lock,
  Package,
  Cpu,
  FileText,
  Phone,
  Mail,
  Star,
  Database,
  type LucideIcon,
} from 'lucide-react';

// Lucide icon map — used to render topic icons from the API's icon string
// Add more mappings here as needed to match your FAQ module icons
const LUCIDE_ICON_MAP: Record<string, LucideIcon> = {
  help_outline: HelpCircle,
  help: HelpCircle,
  settings: Settings,
  people: Users,
  group: Users,
  person: Users,
  notifications: Bell,
  payment: CreditCard,
  credit_card: CreditCard,
  security: ShieldCheck,
  flash_on: Zap,
  language: Globe,
  bar_chart: BarChart2,
  chat: MessageSquare,
  message: MessageSquare,
  lock: Lock,
  inventory: Package,
  computer: Cpu,
  description: FileText,
  article: FileText,
  phone: Phone,
  mail: Mail,
  email: Mail,
  star: Star,
  storage: Database,
  book: BookOpen,
  support: Headphones,
  ticket: Ticket,
  activity: Activity,
};

type FaqModule = {
  id: string | number;
  name: string;
  description?: string | null;
  faqs_count?: number | null;
  icon?: string | null;
};

type FaqItem = {
  id: string | number;
  title?: string | null;
  question?: string | null;
  description?: string | null;
  view_count?: number | null;
};

const MODULE_COLORS = [
  '#4680ff',
  '#04a9f5',
  '#1de9b6',
  '#f4c22b',
  '#ff6b6b',
  '#4ecdc4',
  '#95a5a6',
  '#e74c3c',
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const extractDataArray = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value;
  if (isRecord(value) && Array.isArray(value.data)) return value.data;
  return [];
};

const isFaqModule = (value: unknown): value is FaqModule =>
  isRecord(value) && ('id' in value) && typeof value.name === 'string';

const isFaqItem = (value: unknown): value is FaqItem =>
  isRecord(value) && ('id' in value) && (('question' in value) || ('title' in value));

const reportError = (message: string, error: unknown) => {
  // Keep noise out of production logs; still useful in dev.
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.error(message, error);
  }
};

const HelpCenterHome = () => {
  const router = useRouter();

  const [searchInput, setSearchInput] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<FaqItem[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLDivElement | null>(null);
  const [faqModules, setFaqModules] = useState<FaqModule[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [trendingSearches, setTrendingSearches] = useState<FaqItem[]>([]);
  const [loadingTrendingSearches, setLoadingTrendingSearches] = useState(false);

  useEffect(() => {
    setLoadingModules(true);

    Promise.resolve(ListFAQModules({ page: 1, perPage: 100 }) as unknown)
      .then((response) => {
        const modules = extractDataArray(response).filter(isFaqModule);
        setFaqModules(modules);
      })
      .catch((error) => {
        reportError('Error fetching FAQ modules:', error);
      })
      .finally(() => {
        setLoadingModules(false);
      });
  }, []);

  useEffect(() => {
    setLoadingTrendingSearches(true);

    Promise.resolve(getMostViewedFAQs() as unknown)
      .then((response) => {
        const faqs = extractDataArray(response).filter(isFaqItem);
        setTrendingSearches(faqs);
      })
      .catch((error) => {
        reportError('Error fetching trending searches:', error);
        setTrendingSearches([]);
      })
      .finally(() => {
        setLoadingTrendingSearches(false);
      });
  }, []);

  useEffect(() => {
    const query = searchInput.trim();

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      setLoadingSuggestions(true);

      Promise.resolve(ListFAQItems({ page: 1, perPage: 5, search: query }) as unknown)
        .then((response) => {
          const items = extractDataArray(response).filter(isFaqItem).slice(0, 5);
          setSearchSuggestions(items);
          setShowSuggestions(items.length > 0);
        })
        .catch((error) => {
          reportError('Error fetching search suggestions:', error);
          setSearchSuggestions([]);
          setShowSuggestions(false);
        })
        .finally(() => {
          setLoadingSuggestions(false);
        });
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchInput]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionClick = (article: FaqItem) => {
    router.push({
      pathname: '/help-center/knowledge-base/[id]',
      query: { id: String(article.id), search: searchInput || article.title || article.question || '' }
    }).catch((error) => {
      reportError('Failed to navigate to article:', error);
    });
    setSearchInput('');
    setShowSuggestions(false);
  };

  const handleSearchEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchInput.trim()) {
      router.push({ pathname: '/help-center/knowledge-base', query: { search: searchInput.trim() } }).catch((error) => {
        reportError('Failed to navigate to search results:', error);
      });
      setShowSuggestions(false);
    }
  };

  const mainCategories = [
    { icon: BookOpen, title: 'Knowledge Base', description: 'Browse help articles', color: '#4680ff', bg: '#eef2ff', href: '/help-center/knowledge-base' },
    { icon: Ticket, title: 'My Tickets', description: 'View your tickets', color: '#0ea5e9', bg: '#e0f2fe', href: '/help-center/my-tickets' },
    { icon: Headphones, title: 'Contact Support', description: 'Get in touch', color: '#10b981', bg: '#ecfdf5', href: '/help-center/contact-support' },
    { icon: Activity, title: 'System Status', description: 'Check platform status', color: '#f59e0b', bg: '#fffbeb', href: '/help-center/system-status' },
  ];

  const featuredTopics = faqModules.map((module, index) => ({
    id: module.id,
    title: module.name,
    description: module.description ?? '',
    faqCount: module.faqs_count ?? 0,
    color: MODULE_COLORS[index % MODULE_COLORS.length],
    icon: module.icon ?? 'help_outline',
  }));

  const transformedTrendingSearches = trendingSearches.map((faq) => ({
    id: faq.id,
    title: faq.question ?? faq.title ?? '',
    viewCount: faq.view_count ?? 0,
  }));

  const shouldShowSuggestionsDropdown =
    showSuggestions && (searchSuggestions.length > 0 || loadingSuggestions);

  let suggestionsDropdown: React.ReactNode = null;
  if (shouldShowSuggestionsDropdown) {
    suggestionsDropdown = (
      <div className="hc-suggestion-dropdown">
        {loadingSuggestions && (
          <div
            style={{
              padding: '14px',
              textAlign: 'center',
              fontSize: 13,
              color: '#9ca3af',
            }}
          >
            Searching...
          </div>
        )}

        {!loadingSuggestions && searchSuggestions.length > 0 && (
          <>
            <div className="hc-label">Suggestions ({searchSuggestions.length})</div>
            {searchSuggestions.map((item, index) => (
              <button
                key={item.id || index}
                type="button"
                className="hc-suggestion-item"
                onClick={() => handleSuggestionClick(item)}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: '#eef2ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <FileQuestion size={13} color="#4680ff" />
                </div>
                <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: '#141414',
                      marginBottom: 1,
                    }}
                  >
                    {item.title || item.question || 'Untitled'}
                  </div>
                  {item.description && (
                    <div
                      style={{
                        fontSize: 12,
                        color: '#6b7280',
                        lineHeight: 1.4,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {item.description}
                    </div>
                  )}
                </div>
                <ChevronRight
                  size={13}
                  color="#d1d5db"
                  style={{ flexShrink: 0 }}
                />
              </button>
            ))}
          </>
        )}
      </div>
    );
  }

  let browseTopicsBody: React.ReactNode;
  if (loadingModules) {
    browseTopicsBody = (
      <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af', fontSize: 13 }}>
        Loading topics...
      </div>
    );
  } else if (featuredTopics.length > 0) {
    browseTopicsBody = (
      <Row className="g-2">
        {featuredTopics.map((topic) => {
          const TopicIcon = LUCIDE_ICON_MAP[topic.icon] || HelpCircle;
          const articleSuffix = topic.faqCount === 1 ? '' : 's';
          const subtitle =
            topic.faqCount > 0
              ? `${topic.faqCount} article${articleSuffix}`
              : (topic.description || 'View articles');

          return (
            <Col xs={12} sm={6} key={topic.id || topic.title}>
              <Link
                href={`/help-center/knowledge-base?moduleId=${topic.id}&moduleName=${encodeURIComponent(topic.title)}`}
                className="hc-topic-card"
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: topic.color + '18',
                    borderRadius: 7,
                  }}
                >
                  <TopicIcon size={17} color={topic.color} strokeWidth={1.8} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#141414',
                      lineHeight: 1.3,
                      marginBottom: 2,
                    }}
                  >
                    {topic.title}
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{subtitle}</div>
                </div>
                <ChevronRight size={13} color="#d1d5db" style={{ flexShrink: 0 }} />
              </Link>
            </Col>
          );
        })}
      </Row>
    );
  } else {
    browseTopicsBody = (
      <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af', fontSize: 13 }}>
        No topics available
      </div>
    );
  }

  let trendingBody: React.ReactNode;
  if (loadingTrendingSearches) {
    trendingBody = (
      <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af', fontSize: 13 }}>
        Loading...
      </div>
    );
  } else if (transformedTrendingSearches.length > 0) {
    trendingBody = (
      <div>
        {transformedTrendingSearches.map((item, index) => (
          <button
            key={item.id || index}
            type="button"
            className="hc-trending-item"
            onClick={() => {
              router.push({
                pathname: '/help-center/knowledge-base/[id]',
                query: { id: item.id?.toString(), search: item.title },
              }).catch((error) => {
                reportError('Failed to navigate to trending article:', error);
              });
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#4680ff',
                width: 20,
                textAlign: 'center',
                flexShrink: 0,
              }}
            >
              {String(index + 1).padStart(2, '0')}
            </span>
            <span style={{ fontSize: 13, color: '#334155', flex: 1, lineHeight: 1.4 }}>
              {item.title}
            </span>
            <ChevronRight size={13} color="#d1d5db" style={{ flexShrink: 0 }} />
          </button>
        ))}
      </div>
    );
  } else {
    trendingBody = (
      <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af', fontSize: 13 }}>
        No trending searches available
      </div>
    );
  }

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Help Center" />

      <style>{`
        * { font-family: "Lexend Deca", Helvetica, Arial, sans-serif !important; }

        .hc-wrap {
          max-width: 1300px;
          margin: 0 auto;
          width: 100%;
        }

        .hc-card {
          background: #ffffff;
          border: 1px solid #eaf0f6;
          border-radius: 8px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }

        .hc-category-card {
          background: #ffffff;
          border: 1px solid #eaf0f6;
          border-radius: 8px;
          padding: 28px 16px;
          cursor: pointer;
          transition: border-color 0.18s ease, box-shadow 0.18s ease;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 12px;
          height: 100%;
        }
        .hc-category-card:hover {
          border-color: #4680ff;
          box-shadow: 0 2px 10px rgba(70,128,255,0.10);
          text-decoration: none;
        }

        .hc-topic-card {
          background: #f9fafc;
          border: 1px solid #eaf0f6;
          border-radius: 6px;
          padding: 21px 13px;
          cursor: pointer;
          transition: border-color 0.18s ease, background 0.18s ease;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 11px;
          height: 100%;
        }
        .hc-topic-card:hover {
          background: #f0f4ff;
          border-color: #4680ff;
          text-decoration: none;
        }

        .hc-trending-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.15s ease;
          border-bottom: 1px solid #f4f6f9;
          background: transparent;
          border-left: 0;
          border-right: 0;
          border-top: 0;
          width: 100%;
          text-align: left;
          font: inherit;
        }
        .hc-trending-item:last-child { border-bottom: none; }
        .hc-trending-item:hover { background: #f4f7ff; }

        .hc-search-wrapper {
          background: #ffffff;
          border: 1px solid #E5E9F2;
          border-radius: 8px;
          display: flex;
          align-items: center;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          transition: border-color 0.18s, box-shadow 0.18s;
        }
        .hc-search-wrapper:focus-within {
          border-color: #4680ff;
          box-shadow: 0 2px 8px rgba(70,128,255,0.14);
        }
        .hc-search-input {
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          font-size: 13px !important;
          color: #141414 !important;
          padding: 10px 10px !important;
          flex: 1;
          background: transparent !important;
          min-width: 0;
        }
        .hc-search-input::placeholder { color: #9ca3af !important; }

        .hc-suggestion-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          background: #ffffff;
          border: 1px solid #eaf0f6;
          border-radius: 8px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.10);
          z-index: 1000;
          max-height: 320px;
          overflow-y: auto;
        }
        .hc-suggestion-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 10px 14px;
          cursor: pointer;
          border-bottom: 1px solid #f4f6f9;
          transition: background 0.15s;
          background: transparent;
          border-left: 0;
          border-right: 0;
          border-top: 0;
          width: 100%;
          text-align: left;
          font: inherit;
        }
        .hc-suggestion-item:last-child { border-bottom: none; }
        .hc-suggestion-item:hover { background: #f4f7ff; }

        .hc-section-title {
          font-size: 13px;
          font-weight: 600;
          color: #141414;
          margin-bottom: 0;
        }
        .hc-label {
          font-size: 11px;
          font-weight: 500;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          padding: 8px 14px;
          border-bottom: 1px solid #eaf0f6;
        }

        svg { width: auto !important; height: auto !important; }
      `}</style>

      <div className="hc-wrap">

        {/* ── Hero: heading left, search right ── */}
        <div className="hc-card" style={{ padding: '20px 24px', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>

            {/* Left: title + subtitle */}
            <div style={{ flexShrink: 0 }}>
              <h1 style={{ fontSize: 17, fontWeight: 600, color: '#141414', margin: 0, lineHeight: 1.3 }}>
                Help Center
              </h1>
              <p style={{ fontSize: 12, color: '#9ca3af', margin: '3px 0 0', lineHeight: 1.4 }}>
                How can we assist you today?
              </p>
            </div>

            {/* Right: search bar */}
            <div ref={searchInputRef} style={{  width: '50%',
    minWidth: 260,
    position: 'relative',
    marginLeft: 'auto'}}>
              <div className="hc-search-wrapper">
                <span style={{ padding: '0 10px', display: 'flex', alignItems: 'center', color: '#9ca3af', flexShrink: 0 }}>
                  <Search size={15} />
                </span>
                <input
                  className="hc-search-input"
                  type="text"
                  placeholder="Search for help articles, questions and answers..."
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    if (e.target.value.trim().length >= 2) setShowSuggestions(true);
                  }}
                  onKeyDown={handleSearchEnter}
                  onFocus={() => { if (searchSuggestions.length > 0) setShowSuggestions(true); }}
                />
                {searchInput && (
                  <button
                    onClick={() => { setSearchInput(''); setSearchSuggestions([]); setShowSuggestions(false); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '0 8px', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                  >
                    <X size={13} />
                  </button>
                )}
                <button
                  onClick={() => {
                    if (searchInput.trim()) {
                      router.push({ pathname: '/help-center/knowledge-base', query: { search: searchInput.trim() } }).catch((error) => {
                        reportError('Failed to navigate to search results:', error);
                      });
                      setShowSuggestions(false);
                    }
                  }}
                  style={{
                    background: '#141414', border: 'none', color: '#ffffff',
                    padding: '0 16px', height: 40, cursor: 'pointer',
                    fontSize: 12, fontWeight: 300,
                    fontFamily: '"Lexend Deca", Helvetica, Arial, sans-serif',
                    flexShrink: 0, transition: 'background 0.15s', whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#333'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#141414'; }}
                >
                  Search
                </button>
              </div>

              {/* Suggestions Dropdown */}
              {suggestionsDropdown}
            </div>
          </div>
        </div>

        {/* ── Quick Access Cards — icon left, text right ── */}
        <Row className="g-3 mb-3">
          {mainCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Col xs={12} sm={6} lg={3} key={category.href}>
                <Link href={category.href} className="hc-category-card">
                  <div style={{
                    width: 38, height: 38, flexShrink: 0,
                    backgroundColor: category.bg, borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={19} color={category.color} strokeWidth={1.8} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#141414', marginBottom: 2, lineHeight: 1.3 }}>
                      {category.title}
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.3 }}>
                      {category.description}
                    </div>
                  </div>
                </Link>
              </Col>
            );
          })}
        </Row>

        {/* ── Browse Topics + Trending ── */}
        <Row className="g-3">

          {/* Browse Topics */}
          <Col xs={12} lg={8}>
            <div className="hc-card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #eaf0f6' }}>
                <Layers size={14} color="#4680ff" />
                <span className="hc-section-title">Browse Topics</span>
              </div>

              {browseTopicsBody}
            </div>
          </Col>

          {/* Trending Searches */}
          <Col xs={12} lg={4}>
            <div className="hc-card" style={{ padding: '16px 20px', height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #eaf0f6' }}>
                <TrendingUp size={14} color="#4680ff" />
                <span className="hc-section-title">Trending Searches</span>
              </div>

              {trendingBody}
            </div>
          </Col>

        </Row>
      </div>
    </React.Fragment>
  );
};

HelpCenterHome.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default HelpCenterHome;

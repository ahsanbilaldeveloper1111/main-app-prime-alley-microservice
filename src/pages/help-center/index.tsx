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

import { Row, Col, Card, Form, InputGroup, Button } from 'react-bootstrap';
import { 
  BookOpen, 
  Ticket, 
  Headphones, 
  Activity,
  Search,
  ChevronRight,
  FileQuestion
} from 'lucide-react';

const HelpCenterHome = () => {
  const router = useRouter();
  
  const [searchInput, setSearchInput] = useState<string>('');
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLDivElement>(null);
  const [faqModules, setFaqModules] = useState<any[]>([]);
  const [loadingModules, setLoadingModules] = useState<boolean>(false);
  const [trendingSearches, setTrendingSearches] = useState<any[]>([]);
  const [loadingTrendingSearches, setLoadingTrendingSearches] = useState<boolean>(false);

  // Color palette for modules
  const moduleColors = ['#4680ff', '#04a9f5', '#1de9b6', '#f4c22b', '#ff6b6b', '#4ecdc4', '#95a5a6', '#e74c3c'];

  // Fetch FAQ modules on component mount
  useEffect(() => {
    const fetchModules = async () => {
      setLoadingModules(true);
      try {
        const response = await ListFAQModules({ page: 1, perPage: 100 });
        if (response && response.data) {
          setFaqModules(response.data);
        } else if (Array.isArray(response)) {
          setFaqModules(response);
        }
      } catch (error) {
        console.error('Error fetching FAQ modules:', error);
      } finally {
        setLoadingModules(false);
      }
    };

    fetchModules();
  }, []);

  // Fetch most viewed FAQs for trending searches
  useEffect(() => {
    const fetchTrendingSearches = async () => {
      setLoadingTrendingSearches(true);
      try {
        const response = await getMostViewedFAQs();
        if (response && Array.isArray(response)) {
          setTrendingSearches(response);
        } else if (response && response.data && Array.isArray(response.data)) {
          setTrendingSearches(response.data);
        } else {
          setTrendingSearches([]);
        }
      } catch (error) {
        console.error('Error fetching trending searches:', error);
        setTrendingSearches([]);
      } finally {
        setLoadingTrendingSearches(false);
      }
    };

    fetchTrendingSearches();
  }, []);

  // Search FAQ items with debouncing
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchInput.trim().length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const response = await ListFAQItems({
          page: 1,
          perPage: 5,
          search: searchInput.trim()
        });

        let items: any[] = [];
        if (response && response.data) {
          items = Array.isArray(response.data) ? response.data : [];
        } else if (Array.isArray(response)) {
          items = response;
        }

        setSearchSuggestions(items);
        setShowSuggestions(items.length > 0);
      } catch (error) {
        console.error('Error fetching search suggestions:', error);
        setSearchSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchInput]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle suggestion click
  const handleSuggestionClick = (article: any) => {
    router.push({
      pathname: '/help-center/knowledge-base/[id]',
      query: { id: article?.id?.toString() || article?.id, search: searchInput || article?.title || article?.question || '' }
    });
    setSearchInput('');
    setShowSuggestions(false);
  };

  // Handle search input enter key
  const handleSearchEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchInput.trim()) {
      router.push({
        pathname: '/help-center/knowledge-base',
        query: { search: searchInput.trim() }
      });
      setShowSuggestions(false);
    }
  };

  const mainCategories = [
    {
      icon: BookOpen,
      title: 'Knowledge Base',
      description: 'Browse help articles',
      color: '#4680ff',
      href: '/help-center/knowledge-base'
    },
    {
      icon: Ticket,
      title: 'My Tickets',
      description: 'View your tickets',
      color: '#04a9f5',
      href: '/help-center/my-tickets'
    },
    {
      icon: Headphones,
      title: 'Contact Support',
      description: 'Get in touch',
      color: '#1de9b6',
      href: '/help-center/contact-support'
    },
    {
      icon: Activity,
      title: 'System Status',
      description: 'Check platform status',
      color: '#f4c22b',
      href: '/help-center/system-status'
    }
  ];

  // Transform FAQ modules to featured topics format
  const featuredTopics = faqModules.map((module, index) => ({
    id: module.id,
    title: module.name,
    description: module.description || `${module.faqs_count || 0} FAQs available`,
    color: moduleColors[index % moduleColors.length],
    icon: module.icon || 'help_outline'
  }));

  // Transform most viewed FAQs to trending searches format
  const transformedTrendingSearches = trendingSearches.map((faq) => ({
    id: faq.id,
    title: faq.question,
    viewCount: faq.view_count || 0
  }));

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Help Center" />

      <style>{`
        .card {
          border-radius: 14px !important;
          border: 1px solid #e9eef5 !important;
          box-shadow: 0 2px 12px 0 rgba(70,128,255,0.06);
          transition: box-shadow 0.18s, background 0.18s;
        }
        .card:hover {
          box-shadow: 0 6px 24px 0 rgba(70,128,255,0.13);
        }
        .help-main-category-card {
          background: linear-gradient(120deg, #f8f9fb 80%, #e3f0ff 100%) !important;
          border: 1px solid #e9ecef !important;
          border-radius: 8px !important;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          transition: all 0.2s ease;
        }
        .help-main-category-card:hover {
          background: #f0f4f8 !important;
          border-color: #4680ff !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transform: translateY(-3px);
        }
        .help-featured-card {
          background: linear-gradient(120deg, #f8f9fb 80%, #e3f0ff 100%) !important;
        }
        .help-trending-card {
          background: linear-gradient(120deg, #f9fafb 80%, #f4f7fa 100%) !important;
        }
        svg {
          width: auto !important;
          height: auto !important;
        }
      `}</style>

      {/* Hero Section */}
      <div style={{
        borderRadius: '10px',
        padding: '40px 20px',
        textAlign: 'center',
        marginBottom: '25px'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#2c3e50',
          marginBottom: '8px'
        }}>Help Center</h1>
        <p style={{
          fontSize: '16px',
          color: '#6c757d',
          marginBottom: 0
        }}>How can we assist you today?</p>
      </div>

      {/* Search Bar */}
      <div 
        ref={searchInputRef}
        style={{
          position: 'relative',
          maxWidth: '800px',
          margin: '0 auto 30px auto'
        }}
      >
        <InputGroup style={{
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(70, 128, 255, 0.15)',
          border: '2px solid #e9ecef',
          overflow: 'hidden'
        }}>
          <InputGroup.Text style={{
            background: '#fff',
            border: 'none',
            padding: '12px 16px'
          }}>
            <Search size={20} color="#6c757d" />
          </InputGroup.Text>
          <Form.Control
            type="text"
            placeholder="Search for help articles, questions, and answers..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              if (e.target.value.trim().length >= 2) {
                setShowSuggestions(true);
              }
            }}
            onKeyDown={handleSearchEnter}
            onFocus={() => {
              if (searchSuggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            style={{
              border: 'none',
              fontSize: '16px',
              padding: '12px 16px',
              boxShadow: 'none'
            }}
          />
          {searchInput && (
            <Button
              variant="link"
              onClick={() => {
                setSearchInput('');
                setSearchSuggestions([]);
                setShowSuggestions(false);
              }}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#6c757d',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              ×
            </Button>
          )}
        </InputGroup>

        {/* Suggestions Dropdown */}
        {showSuggestions && (searchSuggestions.length > 0 || loadingSuggestions) && (
          <Card style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '8px',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
            border: '1px solid #e9ecef',
            zIndex: 1000,
            maxHeight: '400px',
            overflowY: 'auto',
            background: '#fff'
          }}>
            <Card.Body style={{ padding: 0 }}>
              {loadingSuggestions ? (
                <div style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: '#6c757d'
                }}>
                  Searching...
                </div>
              ) : searchSuggestions.length > 0 ? (
                <>
                  <div style={{
                    padding: '12px 16px',
                    background: '#f8f9fa',
                    borderBottom: '1px solid #e9ecef',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6c757d',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Suggestions ({searchSuggestions.length})
                  </div>
                  {searchSuggestions.map((item, index) => (
                    <div
                      key={item.id || index}
                      onClick={() => handleSuggestionClick(item)}
                      style={{
                        padding: '16px 20px',
                        cursor: 'pointer',
                        borderBottom: index < searchSuggestions.length - 1 ? '1px solid #f0f0f0' : 'none',
                        transition: 'background 0.2s',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f8f9fa';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#fff';
                      }}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        background: '#e3f0ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <FileQuestion size={16} color="#4680ff" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h6 style={{
                          fontSize: '15px',
                          fontWeight: '600',
                          color: '#2c3e50',
                          marginBottom: '4px',
                          lineHeight: '1.4'
                        }}>
                          {item.title || item.question || 'Untitled'}
                        </h6>
                        {item.description && (
                          <p style={{
                            fontSize: '13px',
                            color: '#6c757d',
                            margin: 0,
                            lineHeight: '1.5',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {item.description}
                          </p>
                        )}
                      </div>
                      <ChevronRight size={16} color="#9ca3af" style={{ flexShrink: 0, marginTop: '2px' }} />
                    </div>
                  ))}
                </>
              ) : null}
            </Card.Body>
          </Card>
        )}
      </div>

      {/* Main Categories */}
      <Row className="g-3 mb-4">
        {mainCategories.map((category) => {
          const Icon = category.icon;
          return (
            <Col xs={12} sm={6} lg={3} key={category.href}>
              <Link href={category.href} style={{ textDecoration: 'none' }}>
                <div
                  className="help-main-category-card"
                  style={{
                    padding: '24px 16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    height: '100%'
                  }}
                >
                  <div style={{
                    width: '56px',
                    height: '56px',
                    margin: '0 auto 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                  }}>
                    <Icon size={28} color={category.color} strokeWidth={2} />
                  </div>
                  <h5 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#2c3e50',
                    marginBottom: '4px'
                  }}>{category.title}</h5>
                  <p style={{
                    fontSize: '13px',
                    color: '#6c757d',
                    marginBottom: 0
                  }}>{category.description}</p>
                </div>
              </Link>
            </Col>
          );
        })}
      </Row>

      {/* Featured Topics and Trending */}
      <Row className="g-3">
        <Col xs={12} lg={9}>
          <Card style={{
            background: '#fff',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}>
            <Card className="help-featured-card" style={{
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}>
              <h4 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#2c3e50',
                marginBottom: '16px'
              }}>Featured Topics</h4>
              <Row className="g-3">
                {loadingModules ? (
                  <Col xs={12}>
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <p style={{ color: '#6c757d' }}>Loading topics...</p>
                    </div>
                  </Col>
                ) : featuredTopics.length > 0 ? (
                  featuredTopics.map((topic) => {
                    return (
                      <Col xs={12} sm={6} md={4} lg={3} key={topic.id || `topic-${topic.title}`}>
                        <Link href="/help-center/knowledge-base" style={{ textDecoration: 'none' }}>
                          <div style={{
                            background: '#fafbfc',
                            border: '1px solid #e9ecef',
                            borderRadius: '6px',
                            padding: '16px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            height: '100%',
                            textAlign: 'center'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f0f4f8';
                            e.currentTarget.style.borderColor = topic.color;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#fafbfc';
                            e.currentTarget.style.borderColor = '#e9ecef';
                          }}
                          >
                            <div style={{
                              width: '44px',
                              height: '44px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: '0 auto 10px auto',
                              color: topic.color
                            }}>
                              <i className="material-icons-two-tone" style={{ fontSize: '28px' }}>
                                {topic.icon}
                              </i>
                            </div>
                            <h6 style={{
                              fontSize: '15px',
                              fontWeight: '600',
                              color: '#2c3e50',
                              marginBottom: '4px'
                            }}>{topic.title}</h6>
                          </div>
                        </Link>
                      </Col>
                    );
                  })
                ) : (
                  <Col xs={12}>
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <p style={{ color: '#6c757d' }}>No topics available</p>
                    </div>
                  </Col>
                )}
              </Row>
            </Card>
          </Card>
        </Col>

        <Col xs={12} lg={3}>
          <Card style={{
            background: '#fff',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}>
            <Card className="help-trending-card" style={{
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}>
              <h4 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#2c3e50',
                marginBottom: '16px'
              }}>Trending Searches</h4>
              <div>
                {loadingTrendingSearches ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <p style={{ color: '#6c757d', fontSize: '13px' }}>Loading...</p>
                  </div>
                ) : transformedTrendingSearches.length > 0 ? (
                  transformedTrendingSearches.map((search, index) => (
                    <div 
                      key={search.id || index} 
                      onClick={() => {
                        router.push({
                          pathname: '/help-center/knowledge-base/[id]',
                          query: { id: search.id?.toString() || search.id, search: search.title }
                        });
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 0',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.paddingLeft = '5px';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.paddingLeft = '0';
                      }}
                    >
                      <div style={{
                        width: '6px',
                        height: '6px',
                        background: '#4680ff',
                        borderRadius: '50%',
                        flexShrink: 0
                      }} />
                      <p style={{
                        fontSize: '13px',
                        color: '#495057',
                        margin: 0
                      }}>{search.title}</p>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <p style={{ color: '#6c757d', fontSize: '13px' }}>No trending searches available</p>
                  </div>
                )}
              </div>
            </Card>
          </Card>
        </Col>
      </Row>
    </React.Fragment>
  );
};

HelpCenterHome.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default HelpCenterHome;


import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Row, Col, Card, Button, Form, Badge } from 'react-bootstrap';
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  BookOpen,
  Video,
  Users,
  FileQuestion,
  Shield,
  DollarSign,
  Link2,
  Phone,
  Bot,
  BarChart3,
  Eye,
  Calendar, 
  TrendingUp,
  HelpCircle

  
} from 'lucide-react';
import { ListFAQTopics, ListFAQItems, getMostViewedFAQs } from '@utils/faqs';

interface KnowledgeBaseProps {
  onBack: () => void;
  moduleId?: string;
  searchQuery?: string;
  moduleName?: string;
  onArticleClick?: (article: any) => void;
}

const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ onBack, moduleId, moduleName, searchQuery = '2FA', onArticleClick }) => {
  const router = useRouter();
  console.log(moduleId);
  console.log(moduleName);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('most-relevant');
  const [faqTopics, setFaqTopics] = useState<any[]>([]);
  const [loadingTopics, setLoadingTopics] = useState<boolean>(false);
  const [faqItems, setFaqItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [popularArticles, setPopularArticles] = useState<any[]>([]);
  const [loadingPopularArticles, setLoadingPopularArticles] = useState<boolean>(false);
  const [recentFAQs, setRecentFAQs] = useState<any[]>([]);
  const [loadingRecentFAQs, setLoadingRecentFAQs] = useState<boolean>(false);

  // Fetch FAQ topics on component mount
  useEffect(() => {
    const fetchTopics = async () => {
      setLoadingTopics(true);
      try {
        const response = await ListFAQTopics({ page: 1, perPage: 100, filters: { faq_module_id: moduleId ? Number.parseInt(moduleId, 10) : undefined } });
        if (response && response.data) {
          setFaqTopics(response.data);
          // Check if topicId is in URL query params
          const topicIdFromUrl = router.query.topicId ? Number.parseInt(router.query.topicId as string, 10) : null;
          if (topicIdFromUrl && !isNaN(topicIdFromUrl)) {
            const topicFromUrl = response.data.find((t: any) => t.id === topicIdFromUrl);
            if (topicFromUrl) {
              setSelectedCategory(topicFromUrl.name);
              setSelectedTopicId(topicFromUrl.id);
            } else if (response.data.length > 0) {
              setSelectedCategory(response.data[0].name);
              setSelectedTopicId(response.data[0].id);
            }
          } else if (response.data.length > 0) {
            setSelectedCategory(response.data[0].name);
            setSelectedTopicId(response.data[0].id);
          }
        } else if (Array.isArray(response)) {
          setFaqTopics(response);
          // Check if topicId is in URL query params
          const topicIdFromUrl = router.query.topicId ? Number.parseInt(router.query.topicId as string, 10) : null;
          if (topicIdFromUrl && !isNaN(topicIdFromUrl)) {
            const topicFromUrl = response.find((t: any) => t.id === topicIdFromUrl);
            if (topicFromUrl) {
              setSelectedCategory(topicFromUrl.name);
              setSelectedTopicId(topicFromUrl.id);
            } else if (response.length > 0) {
              setSelectedCategory(response[0].name);
              setSelectedTopicId(response[0].id);
            }
          } else if (response.length > 0) {
            setSelectedCategory(response[0].name);
            setSelectedTopicId(response[0].id);
          }
        }
      } catch (error) {
        console.error('Error fetching FAQ topics:', error);
      } finally {
        setLoadingTopics(false);
      }
    };

    if (router.isReady) {
      fetchTopics();
    }
  }, [router.isReady, router.query.topicId]);

  // Fetch FAQ items when topic is selected
  useEffect(() => {
    const fetchFAQItems = async () => {
      if (!selectedTopicId) return;
      
      setLoadingItems(true);
      setCurrentPage(1);
      try {
        const response = await ListFAQItems({ 
          page: 1, 
          perPage: 5,
          filters: { topic_id: selectedTopicId, faq_module_id: moduleId ? Number.parseInt(moduleId, 10) : undefined }
        });
        
        let items: any[] = [];
        if (response && response.data) {
          items = Array.isArray(response.data) ? response.data : [];
        } else if (Array.isArray(response)) {
          items = response;
        }
        
        setFaqItems(items);
        
        // Check if there are more items to load
        // Assuming response has pagination info like total, last_page, etc.
        if (response && typeof response === 'object' && 'last_page' in response) {
          setHasMore(response.current_page < response.last_page);
        } else if (response && typeof response === 'object' && 'total' in response) {
          // Alternative pagination structure
          const total = response.total || 0;
          const perPage = 5;
          setHasMore(items.length < total);
        } else {
          // If no pagination info, check if we got a full page
          setHasMore(items.length === 5);
        }
      } catch (error) {
        console.error('Error fetching FAQ items:', error);
        setFaqItems([]);
        setHasMore(false);
      } finally {
        setLoadingItems(false);
      }
    };

    fetchFAQItems();
  }, [selectedTopicId]);

  // Fetch most viewed FAQs when topic is selected
  useEffect(() => {
    const fetchMostViewed = async () => {
      setLoadingPopularArticles(true);
      try {
        const response = await getMostViewedFAQs(undefined, selectedTopicId || undefined);
        if (response && Array.isArray(response)) {
          setPopularArticles(response);
        } else if (response && response.data && Array.isArray(response.data)) {
          setPopularArticles(response.data);
        } else {
          setPopularArticles([]);
        }
      } catch (error) {
        console.error('Error fetching most viewed FAQs:', error);
        setPopularArticles([]);
      } finally {
        setLoadingPopularArticles(false);
      }
    };

    fetchMostViewed();
  }, [selectedTopicId]);

  // Fetch recent FAQ items based on selected topic
  useEffect(() => {
    const fetchRecentFAQs = async () => {
      if (!selectedTopicId) {
        setRecentFAQs([]);
        return;
      }

      setLoadingRecentFAQs(true);
      try {
        const response = await ListFAQItems({ 
          page: 1, 
          perPage: 5,
          filters: { topic_id: selectedTopicId }
        });
        
        let items: any[] = [];
        if (response && response.data) {
          items = Array.isArray(response.data) ? response.data : [];
        } else if (Array.isArray(response)) {
          items = response;
        }
        
        // Sort by created_at descending (most recent first) if not already sorted
        items.sort((a, b) => {
          const dateA = new Date(a.created_at || a.updated_at || 0).getTime();
          const dateB = new Date(b.created_at || b.updated_at || 0).getTime();
          return dateB - dateA;
        });
        
        // Take only the first 5
        setRecentFAQs(items.slice(0, 5));
      } catch (error) {
        console.error('Error fetching recent FAQs:', error);
        setRecentFAQs([]);
      } finally {
        setLoadingRecentFAQs(false);
      }
    };

    fetchRecentFAQs();
  }, [selectedTopicId]);

  // Load more FAQ items
  const handleLoadMore = async () => {
    if (!selectedTopicId || loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const response = await ListFAQItems({ 
        page: nextPage, 
        perPage: 5,
        filters: { topic_id: selectedTopicId }
      });
      
      let newItems: any[] = [];
      if (response && response.data) {
        newItems = Array.isArray(response.data) ? response.data : [];
      } else if (Array.isArray(response)) {
        newItems = response;
      }
      
      // Append new items to existing ones
      setFaqItems(prev => [...prev, ...newItems]);
      setCurrentPage(nextPage);
      
      // Check if there are more items
      if (response && typeof response === 'object' && 'last_page' in response) {
        setHasMore(response.current_page < response.last_page);
      } else if (response && typeof response === 'object' && 'total' in response) {
        const total = response.total || 0;
        setHasMore(faqItems.length + newItems.length < total);
      } else {
        setHasMore(newItems.length === 5);
      }
    } catch (error) {
      console.error('Error loading more FAQ items:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Transform FAQ topics to categories format
  const categories = faqTopics.map((topic) => ({
    id: topic.id,
    name: topic.name,
    count: Number.parseInt(topic.faqs_count || '0', 10),
    icon: topic.faq_module?.icon || 'help_outline'
  }));

  // Extract unique FAQ types from fetched items
  const getUniqueTypes = () => {
    const types = new Set<string>();
    faqItems.forEach((item) => {
      if (item.type && item.type.trim()) {
        types.add(item.type.trim());
      }
    });
    return Array.from(types).sort((a, b) => a.localeCompare(b));
  };

  const uniqueTypes = getUniqueTypes();
  
  // Create dynamic tabs with "All" as first tab (only when there are multiple types)
  const tabs = uniqueTypes.length > 1
    ? [
        { id: 'all', label: 'All' },
        ...uniqueTypes.map((type) => ({ id: type.toLowerCase().replaceAll(/\s+/g, '-'), label: type }))
      ]
    : uniqueTypes.map((type) => ({ id: type.toLowerCase().replaceAll(/\s+/g, '-'), label: type }));

  // Transform FAQ items to articles format
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  // Filter FAQ items by selected tab (type)
  const filteredFAQItems = activeTab === 'all' 
    ? faqItems 
    : faqItems.filter((item) => {
        const itemType = item.type?.trim().toLowerCase().replaceAll(/\s+/g, '-');
        return itemType === activeTab;
      });
  console.log(filteredFAQItems);
  const articles = filteredFAQItems.map((item) => ({
    id: item.id,
    icon: item.topic?.faq_module?.icon,
    title: item.title || item.question || '',
    description: item.description || item.answer ? item.answer.replaceAll(/<[^>]*>/g, '').substring(0, 150) + '...' : 'No description available',
    updated: formatDate(item.updated_at || item.created_at),
    views: item.view_count || 0,
    answer: item.answer,
    topic: item.topic,
    type: item.type
  }));

  // Transform most viewed FAQs to popular articles format
  console.log(popularArticles);
  const transformedPopularArticles = popularArticles.map((article) => ({
    id: article.id,
    title: article.title || article.question || '',
    viewCount: article.view_count || 0
  }));

  const resources = [
    { icon: BookOpen, name: 'User Guides', color: '#4680ff' },
    { icon: Video, name: 'Video Tutorials', color: '#04a9f5' },
    { icon: Users, name: 'Community Forum', color: '#1de9b6' }
  ];

  // Transform recent FAQs to the format needed for rendering
  console.log(recentFAQs);
  const transformedFAQs = recentFAQs.map((faq) => ({
    id: faq.id,
    title: faq.title || faq.question || '',
    viewCount: faq.view_count || 0
  }));

  return (
    <div style={{ background: '#f4f7fa', minHeight: '100vh', paddingBottom: '40px' }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: '20px' }}>
        <Button
          variant="link"
          onClick={onBack}
          style={{
            textDecoration: 'none',
            color: '#6c757d',
            fontSize: '14px',
            padding: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <ChevronLeft size={16} /> Help Center
        </Button>
        <span style={{ color: '#6c757d', margin: '0 8px' }}>›</span>
        <span style={{ color: '#2c3e50', fontWeight: '600', fontSize: '14px' }}>
          Knowledge Base
        </span>
      </div>

      <Row className="g-3">
        {/* Left Sidebar - Categories */}
        <Col xs={12} lg={2}>
          <Card style={{
            background: '#fff',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '0' }}>
              {loadingTopics ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
                  Loading categories...
                </div>
              ) : categories.length > 0 ? (
                categories.map((category, index) => {
                  return (
                    <div
                      key={category.id || index}
                      onClick={() => {
                        setSelectedCategory(category.name);
                        setSelectedTopicId(category.id);
                        router.replace(
                          {
                            pathname: router.pathname,
                            query: {
                              ...router.query,
                              topicId: String(category.id),
                              topicName: category.name
                            }
                          },
                          undefined,
                          { shallow: true }
                        );
                      }}
                      style={{
                        padding: '10px 14px',
                        cursor: 'pointer',
                        background: selectedCategory === category.name ? '#f8f9fa' : '#fff',
                        fontSize: '13px',
                        fontWeight: selectedCategory === category.name ? '500' : '400',
                        color: selectedCategory === category.name ? '#2c3e50' : '#495057',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        borderBottom: index < categories.length - 1 ? '1px solid #f5f5f5' : 'none'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedCategory !== category.name) {
                          e.currentTarget.style.background = '#f8f9fa';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedCategory !== category.name) {
                          e.currentTarget.style.background = '#fff';
                        }
                      }}
                    >
                      <i 
                        className="material-icons-two-tone" 
                        style={{ 
                          fontSize: '18px',
                          color: selectedCategory === category.name ? '#4680ff' : '#6c757d'
                        }}
                      >
                        {category.icon}
                      </i>
                      <span style={{ flex: 1 }}>{category.name}</span>
                      <Badge
                        bg="light"
                        style={{
                          fontSize: '11px',
                          fontWeight: '500',
                          color: '#6c757d',
                          background: selectedCategory === category.name ? '#e3f2fd' : '#f0f0f0',
                          padding: '2px 6px'
                        }}
                      >
                        {category.count}
                      </Badge>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
                  No categories available
                </div>
              )}
            </div>
          </Card>
        </Col>

       {/* Main Content */}
<Col xs={12} lg={7}>
  <Card style={{
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    overflow: 'hidden'
  }}>
    {/* Header Section */}
    <div style={{
      padding: '24px 24px 20px 24px',
      background: 'linear-gradient(to right, #f9fafb, #fff)',
      borderBottom: '1px solid #f3f4f6'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h4 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#1f2937',
            margin: 0,
            marginBottom: '6px'
          }}>
            Search Results
          </h4>
          <p style={{
            fontSize: '14px',
            color: '#6b7280',
            margin: 0
          }}>
            Showing results for <span style={{ 
              color: '#667eea', 
              fontWeight: '600',
              background: '#667eea15',
              padding: '2px 8px',
              borderRadius: '4px'
            }}>"{selectedCategory || searchQuery || moduleName}"</span>
          </p>
        </div>
        {/* <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px',
          background: '#fff',
          padding: '8px 12px',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <span style={{ 
            fontSize: '13px', 
            color: '#6b7280',
            fontWeight: '500'
          }}>Sort by:</span>
          <Form.Select
            size="sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              width: 'auto',
              fontSize: '13px',
              padding: '6px 32px 6px 12px',
              border: 'none',
              background: 'transparent',
              color: '#374151',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <option value="most-relevant">Most Relevant</option>
            <option value="most-recent">Most Recent</option>
            <option value="most-viewed">Most Viewed</option>
          </Form.Select>
        </div> */}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginTop: '20px',
        flexWrap: 'wrap'
      }}>
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '600',
              color: activeTab === tab.id ? '#fff' : '#6b7280',
              background: activeTab === tab.id 
                ? 'linear-gradient(135deg, #667eea 0%, #667eea 100%)' 
                : '#fff',
              border: activeTab === tab.id ? 'none' : '1px solid #e5e7eb',
              borderRadius: '8px',
              transition: 'all 0.2s',
              boxShadow: activeTab === tab.id 
                ? '0 4px 12px rgba(102, 126, 234, 0.3)' 
                : 'none',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.background = '#f9fafb';
                e.currentTarget.style.borderColor = '#667eea';
                e.currentTarget.style.color = '#667eea';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.color = '#6b7280';
              }
            }}
          >
            {tab.label}
          </Button>
        ))}
      </div>
    </div>

    <Card.Body style={{ padding: '24px' }}>
      {/* Articles List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {loadingItems ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
            Loading articles...
          </div>
        ) : articles.length > 0 ? (
          articles.map((article, index) => {
            return (
              <div
                key={article.id || index}
                onClick={() => onArticleClick?.(article)}
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.12)';
                e.currentTarget.style.borderColor = '#667eea';
                e.currentTarget.style.transform = 'translateY(-4px)';
                const icon = e.currentTarget.querySelector('.article-icon-wrapper');
                // if (icon) {
                //   (icon as HTMLElement).style.transform = 'scale(1.1) rotate(5deg)';
                //   (icon as HTMLElement).style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                // }
                const button = e.currentTarget.querySelector('.read-more-btn');
                if (button) {
                  (button as HTMLElement).style.transform = 'translateX(4px)';
                }
              }}
            //   onMouseLeave={(e) => {
            //     e.currentTarget.style.boxShadow = 'none';
            //     e.currentTarget.style.borderColor = '#e5e7eb';
            //     e.currentTarget.style.transform = 'translateY(0)';
            //     const icon = e.currentTarget.querySelector('.article-icon-wrapper');
            //     if (icon) {
            //       (icon as HTMLElement).style.transform = 'scale(1) rotate(0deg)';
            //       (icon as HTMLElement).style.background = '#667eea15';
            //     }
            //     const button = e.currentTarget.querySelector('.read-more-btn');
            //     if (button) {
            //       (button as HTMLElement).style.transform = 'translateX(0)';
            //     }
            //   }}
            >
              {/* Accent line */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '4px',
                height: '100%',
                background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
                opacity: 0
              }} 
              className="accent-line"
              />

              <Row className="align-items-center g-3">
                <Col xs="auto">
                  <div 
                    className="article-icon-wrapper"
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '12px',
                      background: '#667eea15',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      
                    }}
                  >
                    <i 
                      className="material-icons-two-tone" 
                      style={{ 
                        fontSize: '28px',
                        color: '#667eea'
                      }}
                    >
                      {article.icon}
                    </i>
                  </div>
                </Col>
                <Col>
                  <h5 style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#1f2937',
                    marginBottom: '8px',
                    lineHeight: '1.4'
                  }}>
                    {article.title}
                  </h5>
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    marginBottom: '10px',
                    lineHeight: '1.6'
                  }}>
                    {article.description}
                  </p>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    fontSize: '13px',
                    color: '#9ca3af',
                    fontWeight: '500'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      background: '#f3f4f6',
                      padding: '4px 10px',
                      borderRadius: '6px'
                    }}>
                      <Calendar size={14} color="#6b7280" />
                      <span>{article.updated}</span>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      background: '#f3f4f6',
                      padding: '4px 10px',
                      borderRadius: '6px'
                    }}>
                      <Eye size={14} color="#6b7280" />
                      <span>{article.views}</span>
                    </div>
                  </div>
                </Col>
                <Col xs="auto">
                  <div
                    className="read-more-btn"
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #667eea 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 20px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                     
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                    }}
                  >
                    Read More
                    <ChevronRight size={16} />
                  </div>
                </Col>
              </Row>
            </div>
          );
        })
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
            No articles available for this category
          </div>
        )}
      </div>

      {/* Pagination or Load More */}
      {hasMore && (
        <div style={{
          marginTop: '28px',
          paddingTop: '24px',
          borderTop: '1px solid #f3f4f6',
          textAlign: 'center'
        }}>
          <Button
            onClick={handleLoadMore}
            disabled={loadingMore}
            style={{
              background: '#fff',
              border: '2px solid #667eea',
              borderRadius: '8px',
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#667eea',
              transition: 'all 0.2s',
              opacity: loadingMore ? 0.6 : 1,
              cursor: loadingMore ? 'not-allowed' : 'pointer'
            }}
            onMouseEnter={(e) => {
              if (!loadingMore) {
                e.currentTarget.style.background = '#667eea';
                e.currentTarget.style.color = '#fff';
              }
            }}
            onMouseLeave={(e) => {
              if (!loadingMore) {
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.color = '#667eea';
              }
            }}
          >
            {loadingMore ? 'Loading...' : 'Load More Results'}
          </Button>
        </div>
      )}
    </Card.Body>
  </Card>
</Col>

<style dangerouslySetInnerHTML={{__html: `
  .article-icon-wrapper:hover ~ .accent-line {
    opacity: 1 !important;
  }
`}} />

        {/* Right Sidebar */}
        <Col xs={12} lg={3}>
  {/* Popular Articles */}
  <Card style={{
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    marginBottom: '20px',
    overflow: 'hidden'
  }}>
    <div style={{
      padding: '18px 20px',
      background: 'linear-gradient(to right, #f9fafb, #fff)',
      borderBottom: '1px solid #f3f4f6'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <TrendingUp size={18} color="#fff" strokeWidth={2.5} />
        </div>
        <h5 style={{
          fontSize: '16px',
          fontWeight: '700',
          color: '#1f2937',
          margin: 0
        }}>
          Popular Articles
        </h5>
      </div>
    </div>
    <Card.Body style={{ padding: '0' }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0'
      }}>
        {loadingPopularArticles ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
            Loading popular articles...
          </div>
        ) : transformedPopularArticles.length > 0 ? (
          transformedPopularArticles.map((article, index) => (
            <div
              key={article.id || index}
              onClick={() => {
                // Find the full article from popularArticles
                const fullArticle = popularArticles.find(item => item.id === article.id);
                onArticleClick?.(fullArticle || article);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                cursor: 'pointer',
                borderBottom: index < transformedPopularArticles.length - 1 ? '1px solid #f3f4f6' : 'none',
                transition: 'all 0.2s',
                background: '#fff'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f9fafb';
                e.currentTarget.style.paddingLeft = '24px';
                const chevron = e.currentTarget.querySelector('.chevron-icon');
                if (chevron) (chevron as HTMLElement).style.color = '#667eea';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.paddingLeft = '20px';
                const chevron = e.currentTarget.querySelector('.chevron-icon');
                if (chevron) (chevron as HTMLElement).style.color = '#9ca3af';
              }}
            >
              <div style={{ flex: 1 }}>
                <span style={{
                  fontSize: '14px',
                  color: '#374151',
                  lineHeight: '1.5',
                  fontWeight: '500',
                  display: 'block',
                  marginBottom: '2px'
                }}>
                  {article.title}
                </span>
              </div>
              <ChevronRight 
                size={16} 
                className="chevron-icon"
                style={{ 
                  flexShrink: 0, 
                  transition: 'color 0.2s',
                  color: '#9ca3af'
                }} 
              />
            </div>
          ))
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
            No popular articles available
          </div>
        )}
      </div>
    </Card.Body>
  </Card>

  {/* Resources */}
  <Card style={{
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    marginBottom: '20px',
    overflow: 'hidden'
  }}>
    <div style={{
      padding: '18px 20px',
      background: 'linear-gradient(to right, #f9fafb, #fff)',
      borderBottom: '1px solid #f3f4f6'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <BookOpen size={18} color="#fff" strokeWidth={2.5} />
        </div>
        <h5 style={{
          fontSize: '16px',
          fontWeight: '700',
          color: '#1f2937',
          margin: 0
        }}>
          Resources
        </h5>
      </div>
    </div>
    <Card.Body style={{ padding: '0' }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0'
      }}>
        {resources.map((resource, index) => {
          const Icon = resource.icon;
          return (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                cursor: 'pointer',
                borderBottom: index < resources.length - 1 ? '1px solid #f3f4f6' : 'none',
                transition: 'all 0.2s',
                background: '#fff'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f9fafb';
                e.currentTarget.style.paddingLeft = '24px';
                const iconWrapper = e.currentTarget.querySelector('.icon-wrapper');
                if (iconWrapper) {
                  (iconWrapper as HTMLElement).style.transform = 'scale(1.1)';
                  (iconWrapper as HTMLElement).style.background = resource.color;
                }
                const chevron = e.currentTarget.querySelector('.chevron-icon');
                if (chevron) (chevron as HTMLElement).style.color = '#667eea';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.paddingLeft = '20px';
                const iconWrapper = e.currentTarget.querySelector('.icon-wrapper');
                if (iconWrapper) {
                  (iconWrapper as HTMLElement).style.transform = 'scale(1)';
                  (iconWrapper as HTMLElement).style.background = `${resource.color}15`;
                }
                const chevron = e.currentTarget.querySelector('.chevron-icon');
                if (chevron) (chevron as HTMLElement).style.color = '#9ca3af';
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flex: 1
              }}>
                <div 
                  className="icon-wrapper"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: `${resource.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  <Icon size={18} color={resource.color} strokeWidth={2.5} />
                </div>
                <span style={{
                  fontSize: '14px',
                  color: '#374151',
                  fontWeight: '500'
                }}>
                  {resource.name}
                </span>
              </div>
              <ChevronRight 
                size={16} 
                className="chevron-icon"
                style={{ 
                  flexShrink: 0,
                  transition: 'color 0.2s',
                  color: '#9ca3af'
                }} 
              />
            </div>
          );
        })}
      </div>
    </Card.Body>
  </Card>

  {/* FAQs */}
  <Card style={{
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    overflow: 'hidden'
  }}>
    <div style={{
      padding: '18px 20px',
      background: 'linear-gradient(to right, #f9fafb, #fff)',
      borderBottom: '1px solid #f3f4f6'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <HelpCircle size={18} color="#fff" strokeWidth={2.5} />
        </div>
        <h5 style={{
          fontSize: '16px',
          fontWeight: '700',
          color: '#1f2937',
          margin: 0
        }}>
          FAQs
        </h5>
      </div>
    </div>
    <Card.Body style={{ padding: '0' }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0'
      }}>
        {loadingRecentFAQs ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
            Loading FAQs...
          </div>
        ) : transformedFAQs.length > 0 ? (
          transformedFAQs.map((faq, index) => (
            <div
              key={faq.id || index}
              onClick={() => {
                // Find the full FAQ item from recentFAQs
                const fullFaq = recentFAQs.find(item => item.id === faq.id);
                onArticleClick?.(fullFaq || faq);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 20px',
                cursor: 'pointer',
                borderBottom: index < transformedFAQs.length - 1 ? '1px solid #f3f4f6' : 'none',
                transition: 'all 0.2s',
                background: '#fff'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f9fafb';
                e.currentTarget.style.paddingLeft = '24px';
                const icon = e.currentTarget.querySelector('.faq-icon');
                if (icon) (icon as HTMLElement).style.color = '#667eea';
                const chevron = e.currentTarget.querySelector('.chevron-icon');
                if (chevron) (chevron as HTMLElement).style.color = '#667eea';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.paddingLeft = '20px';
                const icon = e.currentTarget.querySelector('.faq-icon');
                if (icon) (icon as HTMLElement).style.color = '#9ca3af';
                const chevron = e.currentTarget.querySelector('.chevron-icon');
                if (chevron) (chevron as HTMLElement).style.color = '#9ca3af';
              }}
            >
              <FileQuestion 
                size={18} 
                className="faq-icon"
                style={{ 
                  flexShrink: 0, 
                  transition: 'color 0.2s',
                  color: '#9ca3af'
                }} 
                strokeWidth={2}
              />
              <span style={{
                fontSize: '14px',
                color: '#374151',
                flex: 1,
                lineHeight: '1.5',
                fontWeight: '500'
              }}>
                {faq.title}
              </span>
              <ChevronRight 
                size={16} 
                className="chevron-icon"
                style={{ 
                  flexShrink: 0,
                  transition: 'color 0.2s',
                  color: '#9ca3af'
                }} 
              />
            </div>
          ))
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
            No FAQs available
          </div>
        )}
      </div>
    </Card.Body>
  </Card>
</Col>
      </Row>
    </div>
  );
};

export default KnowledgeBase;
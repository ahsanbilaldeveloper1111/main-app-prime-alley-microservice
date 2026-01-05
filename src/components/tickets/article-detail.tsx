import React, { useState, useEffect } from 'react';
import { getFAQItem, ListFAQItems, ListFAQTopics } from '@utils/faqs';
import { Row, Col, Card, Button, Badge, Form } from 'react-bootstrap';
import {
  ChevronLeft,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Plus,
  MessageCircle,
  Eye,
  Calendar,
  List,
  HelpCircle,
  BookOpen,
  Folder,
  Zap,
  Settings,
  CreditCard,
  Lock,
  Users,
  FileText,
  BarChart3,
  Phone,
  Bot,
  Link2,
  DollarSign,
  Shield
} from 'lucide-react';

interface ArticleDetailProps {
  onBack: () => void;
  articleId?: string | null;
  articleData?: any;
  onArticleClick?: (article: any) => void;
}

const ArticleDetail: React.FC<ArticleDetailProps> = ({ onBack, articleId, articleData, onArticleClick }) => {
  const [commentText, setCommentText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [faqItem, setFaqItem] = useState<any>(articleData || null);
  const [loading, setLoading] = useState<boolean>(false);
  const [relatedArticles, setRelatedArticles] = useState<any[]>([]);
  const [loadingRelated, setLoadingRelated] = useState<boolean>(false);
  const [faqTopics, setFaqTopics] = useState<any[]>([]);
  const [loadingTopics, setLoadingTopics] = useState<boolean>(false);

  // Format date helper
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

  // Fetch FAQ item if only ID is provided
  useEffect(() => {
    const fetchFAQItem = async () => {
      if (articleData) {
        setFaqItem(articleData);
        return;
      }

      if (!articleId) return;

      setLoading(true);
      try {
        const id = Number.parseInt(articleId, 10);
        if (!isNaN(id)) {
          const item = await getFAQItem(id);
          if (item) {
            setFaqItem(item);
          }
        }
      } catch (error) {
        console.error('Error fetching FAQ item:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFAQItem();
  }, [articleId, articleData]);

  // Fetch related FAQ items based on topic and module
  useEffect(() => {
    const fetchRelatedArticles = async () => {
      if (!faqItem) {
        setRelatedArticles([]);
        return;
      }

      setLoadingRelated(true);
      try {
        const filters: any = {};
        
        // Filter by topic if available
        if (faqItem.topic_id) {
          filters.topic_id = faqItem.topic_id;
        } else if (faqItem.topic?.id) {
          filters.topic_id = faqItem.topic.id;
        }
        
        // Filter by module if available
        if (faqItem.topic?.faq_module_id) {
          filters.faq_module_id = faqItem.topic.faq_module_id;
        } else if (faqItem.topic?.faq_module?.id) {
          filters.faq_module_id = faqItem.topic.faq_module.id;
        }

        const response = await ListFAQItems({
          page: 1,
          perPage: 5,
          filters: filters
        });

        let items: any[] = [];
        if (response && response.data) {
          items = Array.isArray(response.data) ? response.data : [];
        } else if (Array.isArray(response)) {
          items = response;
        }

        // Exclude the current article and limit to 5
        const currentId = faqItem.id;
        const related = items
          .filter((item: any) => item.id !== currentId)
          .slice(0, 5);

        setRelatedArticles(related);
      } catch (error) {
        console.error('Error fetching related articles:', error);
        setRelatedArticles([]);
      } finally {
        setLoadingRelated(false);
      }
    };

    fetchRelatedArticles();
  }, [faqItem]);

  // Fetch FAQ topics on component mount
  useEffect(() => {
    const fetchTopics = async () => {
      setLoadingTopics(true);
      try {
        const response = await ListFAQTopics({ page: 1, perPage: 100 });
        if (response && response.data) {
          setFaqTopics(response.data);
        } else if (Array.isArray(response)) {
          setFaqTopics(response);
        }
      } catch (error) {
        console.error('Error fetching FAQ topics:', error);
      } finally {
        setLoadingTopics(false);
      }
    };

    fetchTopics();
  }, []);

  // Transform FAQ item to article format
  console.log("faqItem", faqItem);
  const article = faqItem ? {
    title: faqItem.title || faqItem.question || '',
    updated: formatDate(faqItem.updated_at || faqItem.created_at),
    views: faqItem.view_count || 0,
    content: {
      intro: faqItem.description || '',
      answer: faqItem.answer || '',
      type: faqItem.type || '',
      topic: faqItem.topic || null
    }
  } : {
    title: faqItem.title || faqItem.question || '',
    updated: '5 days ago',
    views: 850,
    content: {
      intro: 'Two-factor authentication (2FA) adds an extra layer of security to your account by requiring a second form of verification in addition to your password. Follow this guide to enable 2FA.',
      steps: [
        {
          number: 1,
          title: 'Go to your Account Settings',
          description: 'Log in to your Ring Edge account and navigate to Settings > Security',
          image: 'https://placehold.co/300x200/e3f2fd/4680ff?text=Settings+Screenshot'
        },
        {
          number: 2,
          title: 'Enable 2FA',
          description: 'Under the Security tab, find the Two-Factor Authentication section and click on "Enable 2FA".',
          image: null
        },
        {
          number: 3,
          title: 'Verify Your Device',
          description: 'Scan the QR code with your Authenticator app and enter the generated code to verify your device.',
          image: 'https://placehold.co/300x200/e3f2fd/4680ff?text=QR+Code'
        },
        {
          number: 4,
          title: 'Backup Your Codes',
          description: 'Save your backup codes in a secure location.',
          image: 'https://placehold.co/300x200/e3f2fd/4680ff?text=Backup+Codes'
        }
      ]
    }
  };

  // Transform FAQ topics to categories format
  const categories = faqTopics.map((topic) => ({
    id: topic.id,
    name: topic.name,
    count: Number.parseInt(topic.faqs_count || '0', 10),
    icon: topic.faq_module?.icon || 'help_outline',
    topic: topic
  }));

  const contents = [
    'Steps to Enable Two-Factor Authentication',
    'Tips for Using 2FA',
    'Frequently Asked Questions',
    'Additional Help for 2FA'
  ];

  // Transform related articles for rendering
  console.log("relatedArticles", relatedArticles);
  const transformedRelatedArticles = relatedArticles.map((item) => ({
    id: item.id,
    title: item.title || item.question ,
    viewCount: item.view_count || 0
  }));

  const comments = [
    {
      user: 'John Doe',
      avatar: 'https://i.pravatar.cc/150?img=12',
      time: '1 day ago',
      comment: 'Thanks for the guide it made setting up 2FA so much easier.'
    },
    {
      user: 'Lisa Smith',
      avatar: 'https://i.pravatar.cc/150?img=47',
      time: '5 hours ago',
      comment: "I've folowed the cops but till having trouble. How can I get futher assistnece"
    }
  ];

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
        <span 
          onClick={onBack}
          style={{ color: '#6c757d', fontSize: '14px', cursor: 'pointer' }}
        >
          Knowledge Base
        </span>
        <span style={{ color: '#6c757d', margin: '0 8px' }}>›</span>
        <span style={{ color: '#2c3e50', fontWeight: '600', fontSize: '14px' }}>
          {faqItem.title}
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
                  const isSelected = selectedCategory === category.name || 
                    (faqItem?.topic?.id === category.id || faqItem?.topic_id === category.id);
                  return (
                    <div
                      key={category.id || index}
                      onClick={() => {
                        setSelectedCategory(category.name);
                        // Navigate to knowledge base with this topic
                        if (onArticleClick && category.topic) {
                          // This will be handled by the parent component
                          // For now, just update the selected category
                        }
                      }}
                      style={{
                        padding: '10px 14px',
                        cursor: 'pointer',
                        background: isSelected ? '#f8f9fa' : '#fff',
                        fontSize: '13px',
                        fontWeight: isSelected ? '500' : '400',
                        color: isSelected ? '#2c3e50' : '#495057',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        borderBottom: index < categories.length - 1 ? '1px solid #f5f5f5' : 'none'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = '#f8f9fa';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = '#fff';
                        }
                      }}
                    >
                      <i 
                        className="material-icons-two-tone" 
                        style={{ 
                          fontSize: '18px',
                          color: isSelected ? '#4680ff' : '#6c757d'
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
                          background: isSelected ? '#e3f2fd' : '#f0f0f0',
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
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
    }}>
      <Card.Body style={{ padding: '40px' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
            Loading article...
          </div>
        )}
        {!loading && !faqItem && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
            Article not found
          </div>
        )}
        {!loading && faqItem ? (
          <React.Fragment>
            {/* Article Header */}
        <div style={{
          marginBottom: '32px',
          paddingBottom: '24px',
          borderBottom: '2px solid #f3f4f6'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#1f2937',
            marginBottom: '16px',
            lineHeight: '1.3'
          }}>
            {article.title}
          </h1>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontSize: '14px',
            color: '#6b7280',
            fontWeight: '500'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#f3f4f6',
              padding: '6px 12px',
              borderRadius: '6px'
            }}>
              <Calendar size={14} color="#4680ff" />
              <span>Updated {article.updated}</span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#f3f4f6',
              padding: '6px 12px',
              borderRadius: '6px'
            }}>
              <Eye size={14} color="#4680ff" />
              <span>{article.views} views</span>
            </div>
          </div>
        </div>

        {/* Description/Introduction */}
            {(article.content.intro || (article.content as any).description) && (
          <div style={{
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderLeft: '4px solid #4680ff',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '36px'
          }}>
            <p style={{
              fontSize: '15px',
              color: '#374151',
              lineHeight: '1.8',
              marginBottom: 0
            }}>
              {article.content.intro || (article.content as any).description}
            </p>
          </div>
        )}

        {/* Answer Section */}
        {article.content.answer && (
          <div style={{ marginBottom: '36px' }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#1f2937',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div style={{
                width: '4px',
                height: '24px',
                background: '#4680ff',
                borderRadius: '2px'
              }} />
              Answer
            </h2>
            <div 
              style={{
                fontSize: '15px',
                color: '#374151',
                lineHeight: '1.8',
                marginBottom: 0
              }}
              dangerouslySetInnerHTML={{ __html: article.content.answer }}
            />
          </div>
        )}

        {/* Steps Section - Only show if steps exist (for sample data) */}
        {article.content.steps && article.content.steps.length > 0 && (
          <>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#1f2937',
              marginBottom: '28px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div style={{
                width: '4px',
                height: '24px',
                background: '#4680ff',
                borderRadius: '2px'
              }} />
              Steps to Enable Two-Factor Authentication
            </h2>

            {/* Steps */}
            <div style={{ marginBottom: '40px' }}>
              {article.content.steps.map((step, index) => (
            <div key={index} style={{ 
              marginBottom: '28px',
              position: 'relative',
              paddingLeft: '40px'
            }}>
              <div style={{
                position: 'absolute',
                left: 0,
                top: '2px',
                fontSize: '16px',
                fontWeight: '700',
                color: '#4680ff',
                width: '28px'
              }}>
                {step.number}.
              </div>
              <div>
                <h3 style={{
                  fontSize: '17px',
                  fontWeight: '700',
                  color: '#1f2937',
                  marginBottom: '8px',
                  lineHeight: '1.4'
                }}>
                  {step.title}
                </h3>
                <p style={{
                  fontSize: '15px',
                  color: '#4b5563',
                  lineHeight: '1.7',
                  marginBottom: 0
                }}>
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
          </>
        )}

        {/* Was this helpful */}
        <div style={{
          background: 'linear-gradient(to right, #f9fafb, #fff)',
          padding: '28px',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          marginBottom: '36px'
        }}>
          <p style={{
            fontSize: '16px',
            fontWeight: '700',
            color: '#1f2937',
            marginBottom: '16px'
          }}>
            Was this article helpful?
          </p>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <Button
              style={{
                background: 'linear-gradient(135deg, #4680ff 0%, #0ea5e9 100%)',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 24px',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(70, 128, 255, 0.3)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(70, 128, 255, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(70, 128, 255, 0.3)';
              }}
            >
              <ThumbsUp size={16} />
              Yes, it helped
            </Button>
            <Button
              style={{
                background: '#fff',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                padding: '10px 24px',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#6b7280',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#9ca3af';
                e.currentTarget.style.background = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.background = '#fff';
              }}
            >
              <ThumbsDown size={16} />
              No, need more help
            </Button>
          </div>
          <p style={{
            fontSize: '14px',
            color: '#4680ff',
            marginBottom: 0,
            cursor: 'pointer',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            Still need assistance? Create a ticket 
            <ChevronRight size={16} />
          </p>
        </div>

        {/* Comments Section */}
        <div>
          {/* <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#1f2937',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <MessageCircle size={20} color="#4680ff" />
              Comments ({comments.length})
            </h3>
            <Button
              variant="link"
              style={{
                fontSize: '14px',
                color: '#4680ff',
                textDecoration: 'none',
                padding: '8px 16px',
                fontWeight: '600',
                background: '#eff6ff',
                borderRadius: '8px',
                border: 'none'
              }}
            >
              <Plus size={16} style={{ marginRight: '4px' }} />
              Add comment
            </Button>
          </div> */}

          {/* Comment List */}
          {/* <div style={{ marginBottom: '24px' }}>
            {comments.map((comment, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  gap: '14px',
                  padding: '20px',
                  borderBottom: index < comments.length - 1 ? '1px solid #f3f4f6' : 'none',
                  background: index % 2 === 0 ? '#fff' : '#f9fafb',
                  borderRadius: '8px',
                  marginBottom: '8px'
                }}
              >
                <img
                  src={comment.avatar}
                  alt={comment.user}
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    flexShrink: 0,
                    border: '2px solid #e5e7eb'
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '8px'
                  }}>
                    <span style={{
                      fontSize: '15px',
                      fontWeight: '700',
                      color: '#1f2937'
                    }}>
                      {comment.user}
                    </span>
                    <span style={{
                      fontSize: '13px',
                      color: '#9ca3af',
                      fontWeight: '500'
                    }}>
                      • {comment.time}
                    </span>
                  </div>
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    lineHeight: '1.7',
                    marginBottom: 0
                  }}>
                    {comment.comment}
                  </p>
                </div>
              </div>
            ))}
          </div> */}
        </div>
          </React.Fragment>
        ) : null}
      </Card.Body>
    </Card>
  </Col>

  {/* Right Sidebar */}
  <Col xs={12} lg={3}>
    {/* Contents */}
    {/* <Card style={{
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
        <h5 style={{
          fontSize: '16px',
          fontWeight: '700',
          color: '#1f2937',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <List size={18} color="#4680ff" />
          Contents
        </h5>
      </div>
      <Card.Body style={{ padding: '0' }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0'
        }}>
          {contents.map((item, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                cursor: 'pointer',
                borderBottom: index < contents.length - 1 ? '1px solid #f3f4f6' : 'none',
                transition: 'all 0.2s',
                background: '#fff'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f9fafb';
                e.currentTarget.style.paddingLeft = '24px';
                const chevron = e.currentTarget.querySelector('.chevron');
                if (chevron) (chevron as HTMLElement).style.color = '#4680ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.paddingLeft = '20px';
                const chevron = e.currentTarget.querySelector('.chevron');
                if (chevron) (chevron as HTMLElement).style.color = '#9ca3af';
              }}
            >
              <span style={{
                fontSize: '14px',
                color: '#374151',
                fontWeight: '500'
              }}>
                {item}
              </span>
              <ChevronRight 
                size={16} 
                className="chevron"
                style={{ 
                  color: '#9ca3af',
                  transition: 'color 0.2s'
                }} 
              />
            </div>
          ))}
        </div>
      </Card.Body>
    </Card> */}

    {/* Related Articles */}
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
        <h5 style={{
          fontSize: '16px',
          fontWeight: '700',
          color: '#1f2937',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <BookOpen size={18} color="#4680ff" />
          Most Viewed Articles
        </h5>
      </div>
      <Card.Body style={{ padding: '0' }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0'
        }}>
          {loadingRelated ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
              Loading related articles...
            </div>
          ) : transformedRelatedArticles.length > 0 ? (
            transformedRelatedArticles.map((article, index) => (
              <div
                key={article.id || index}
                onClick={() => onArticleClick?.(relatedArticles.find(item => item.id === article.id) || article)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 20px',
                  cursor: 'pointer',
                  borderBottom: index < transformedRelatedArticles.length - 1 ? '1px solid #f3f4f6' : 'none',
                  transition: 'all 0.2s',
                  background: '#fff'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f9fafb';
                  e.currentTarget.style.paddingLeft = '24px';
                  const chevron = e.currentTarget.querySelector('.chevron');
                  if (chevron) (chevron as HTMLElement).style.color = '#4680ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#fff';
                  e.currentTarget.style.paddingLeft = '20px';
                  const chevron = e.currentTarget.querySelector('.chevron');
                  if (chevron) (chevron as HTMLElement).style.color = '#9ca3af';
                }}
              >
                <span style={{
                  fontSize: '14px',
                  color: '#374151',
                  fontWeight: '500'
                }}>
                  {article.title}
                </span>
                <ChevronRight 
                  size={16} 
                  className="chevron"
                  style={{ 
                    color: '#9ca3af',
                    transition: 'color 0.2s'
                  }} 
                />
              </div>
            ))
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
              No related articles available
            </div>
          )}
        </div>
      </Card.Body>
    </Card>

    {/* Still need help */}
    <Card style={{
      background: 'linear-gradient(135deg, #4680ff 0%, #0ea5e9 100%)',
      border: 'none',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(70, 128, 255, 0.3)',
      marginBottom: '20px',
      overflow: 'hidden'
    }}>
      <Card.Body style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{
          width: '48px',
          height: '48px',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px'
        }}>
          <HelpCircle size={24} color="#fff" strokeWidth={2.5} />
        </div>
        <h5 style={{
          fontSize: '18px',
          fontWeight: '700',
          color: '#fff',
          marginBottom: '12px'
        }}>
          Still need help?
        </h5>
        <p style={{
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.9)',
          marginBottom: '20px',
          lineHeight: '1.6'
        }}>
          Can't find what you're looking for? Our support team is here to help.
        </p>
        <Button
          style={{
            background: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '600',
            width: '100%',
            color: '#4680ff',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
          }}
        >
          Create a ticket
        </Button>
      </Card.Body>
    </Card>

    {/* Comments Widget */}
    <Card style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      overflow: 'hidden',
      display: 'none'
    }}>
      {/* <div style={{
        padding: '18px 20px',
        background: 'linear-gradient(to right, #f9fafb, #fff)',
        borderBottom: '1px solid #f3f4f6'
      }}>
        <h5 style={{
          fontSize: '16px',
          fontWeight: '700',
          color: '#1f2937',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <MessageCircle size={18} color="#4680ff" />
          Recent Comments
        </h5>
      </div> */}
      <Card.Body style={{ padding: '16px' }}>
        {/* Recent Comments */}
        {/* <div style={{ marginBottom: '16px' }}>
          {comments.slice(0, 3).map((comment, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                gap: '12px',
                padding: '12px',
                borderBottom: index < 2 ? '1px solid #f3f4f6' : 'none',
                borderRadius: '8px',
                transition: 'background 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <img
                src={comment.avatar}
                alt={comment.user}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  flexShrink: 0,
                  border: '2px solid #e5e7eb'
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '4px'
                }}>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    color: '#1f2937'
                  }}>
                    {comment.user}
                  </span>
                  <span style={{
                    fontSize: '12px',
                    color: '#9ca3af'
                  }}>
                    • {comment.time}
                  </span>
                </div>
                <p style={{
                  fontSize: '13px',
                  color: '#6b7280',
                  lineHeight: '1.5',
                  marginBottom: 0,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {comment.comment}
                </p>
              </div>
            </div>
          ))}
        </div> */}

        {/* <Button
          variant="link"
          style={{
            fontSize: '13px',
            color: '#4680ff',
            textDecoration: 'none',
            padding: '8px 12px',
            fontWeight: '600',
            background: '#eff6ff',
            borderRadius: '8px',
            border: 'none',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <Plus size={14} />
          Add your comment
        </Button> */}
      </Card.Body>
    </Card>
  </Col>
</Row>
    </div>
  );
};

export default ArticleDetail;
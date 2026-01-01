import React, { useState } from 'react';
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

interface KnowledgeBaseProps {
  onBack: () => void;
  searchQuery?: string;
  onArticleClick?: (articleId: string) => void;
}

const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ onBack, searchQuery = '2FA', onArticleClick }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Getting Started');
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('most-relevant');

  const categories = [
    { name: 'Getting Started', count: 8, icon: BookOpen },
    { name: 'Admin & Security', count: 12, icon: Shield },
    { name: 'Billing', count: 6, icon: DollarSign },
    { name: 'Integrations', count: 9, icon: Link2 },
    { name: 'Calling & Web Dialer', count: 7, icon: Phone },
    { name: 'AI & Automation', count: 5, icon: Bot },
    { name: 'Reports & Analytics', count: 4, icon: BarChart3 }
  ];

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'setup', label: 'Setup Guides' },
    { id: 'security', label: 'Security' }
  ];

  const articles = [
    {
      icon: Shield,
      title: 'Setting Up Two-Factor Authentication',
      description: 'Learn how to enable 2FA for your account',
      updated: '5 days ago',
      views: 850
    },
    {
      icon: Shield,
      title: 'Resetting Your 2FA Device',
      description: 'Steps to reset your 2FA device',
      updated: '2 weeks ago',
      views: 620
    },
    {
      icon: Shield,
      title: 'Troubleshooting 2FA Issues',
      description: 'Common problems and solutions for 2FA',
      updated: '1 week ago',
      views: 540
    }
  ];

  const popularArticles = [
    'Managing User Permissions',
    'Setting Up Voicemail',
    'Understanding API Keys'
  ];

  const resources = [
    { icon: BookOpen, name: 'User Guides', color: '#4680ff' },
    { icon: Video, name: 'Video Tutorials', color: '#04a9f5' },
    { icon: Users, name: 'Community Forum', color: '#1de9b6' }
  ];

  const faqs = [
    'How do I change my password?',
    'What should I do if my account?'
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
              {categories.map((category, index) => {
                const Icon = category.icon;
                return (
                  <div
                    key={index}
                    onClick={() => setSelectedCategory(category.name)}
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
                    <Icon size={16} color={selectedCategory === category.name ? '#4680ff' : '#6c757d'} />
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
              })}
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
            }}>"{searchQuery}"</span>
          </p>
        </div>
        <div style={{ 
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
        </div>
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
        {articles.map((article, index) => {
          const Icon = article.icon;
          return (
            <div
              key={index}
              onClick={() => onArticleClick?.(article.title)}
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
                    <Icon size={28} color="#667eea" strokeWidth={2} />
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
        })}
      </div>

      {/* Pagination or Load More */}
      <div style={{
        marginTop: '28px',
        paddingTop: '24px',
        borderTop: '1px solid #f3f4f6',
        textAlign: 'center'
      }}>
        <Button
          style={{
            background: '#fff',
            border: '2px solid #667eea',
            borderRadius: '8px',
            padding: '10px 24px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#667eea',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#667eea';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#fff';
            e.currentTarget.style.color = '#667eea';
          }}
        >
          Load More Results
        </Button>
      </div>
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
        {popularArticles.map((article, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 20px',
              cursor: 'pointer',
              borderBottom: index < popularArticles.length - 1 ? '1px solid #f3f4f6' : 'none',
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
                {article}
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
        ))}
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
        {faqs.map((faq, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 20px',
              cursor: 'pointer',
              borderBottom: index < faqs.length - 1 ? '1px solid #f3f4f6' : 'none',
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
              {faq}
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
        ))}
      </div>
    </Card.Body>
  </Card>
</Col>
      </Row>
    </div>
  );
};

export default KnowledgeBase;
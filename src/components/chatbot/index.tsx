import React, { useState, useRef, useEffect } from 'react';
import { Form, Button, Spinner } from 'react-bootstrap';
import { Send, Paperclip, Mic, Smile, X, MessageCircle, Minimize2, Maximize2, Star, Image as ImageIcon, Play, Pause, Bot } from 'lucide-react';
import {
  isChatUserBudgetExhaustedError,
  sendChatMessage,
  submitChatSurvey,
} from '@utils/chat';
import { ChatAssistantBudgetBar } from '@components/chat-assistant/ChatAssistantBudgetBar';
import { useChatAssistantUserBudget } from '@hooks/useChatAssistantUserBudget';
import { toast } from 'react-toastify';
import { useSession } from 'next-auth/react';
import '@assets/scss/chat.scss';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type: 'text' | 'voice' | 'file' | 'image';
  fileName?: string;
  fileSize?: string;
  duration?: string;
  imageUrl?: string;
  audioUrl?: string;
}

const EMOJI_LIST = ['😊', '😂', '❤️', '👍', '🎉', '🤔', '😢', '😮', '🔥', '✨'];

// Voice Message Player Component
const VoiceMessagePlayer: React.FC<{ message: Message }> = ({ message }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!message.audioUrl) {
    return (
      <div className="d-flex align-items-center gap-2">
        <Mic size={14} />
        <span style={{ fontSize: '0.875rem' }}>Voice message ({message.duration})</span>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-2">
      <audio ref={audioRef} src={message.audioUrl} preload="metadata" />
      <div className="d-flex align-items-center gap-2">
        <button
          onClick={togglePlay}
          className="d-flex align-items-center justify-content-center border-0 rounded-circle p-0"
          style={{
            width: '2.5rem',
            height: '2.5rem',
            backgroundColor: isPlaying ? '#334155' : '#e2e8f0',
            color: isPlaying ? '#ffffff' : '#334155',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            flexShrink: 0,
            border: '1px solid #cbd5e1'
          }}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          onMouseEnter={(e) => {
            if (!isPlaying) {
              e.currentTarget.style.backgroundColor = '#cbd5e1';
            }
          }}
          onMouseLeave={(e) => {
            if (!isPlaying) {
              e.currentTarget.style.backgroundColor = '#e2e8f0';
            }
          }}
        >
          {isPlaying ? (
            <Pause size={18} fill="currentColor" stroke="currentColor" />
          ) : (
            <Play size={18} fill="currentColor" stroke="currentColor" style={{ marginLeft: '2px' }} />
          )}
        </button>
        <div className="flex-fill">
          <div className="d-flex align-items-center gap-2 mb-1">
            <Mic size={14} />
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Voice message</span>
          </div>
          <div className="d-flex align-items-center gap-2" style={{ fontSize: '0.75rem', color: '#64748b' }}>
            <span style={{ minWidth: '35px' }}>{formatTime(currentTime)}</span>
            <div 
              className="flex-fill rounded"
              style={{ 
                height: '4px',
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: '#e2e8f0'
              }}
            >
              <div
                className="rounded"
                style={{
                  height: '100%',
                  width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%',
                  transition: 'width 0.1s linear',
                  backgroundColor: '#334155'
                }}
              />
            </div>
            <span style={{ minWidth: '35px' }}>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ChatbotWidget() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  // Listen for custom event to open chatbot
  useEffect(() => {
    const handleOpenChatbot = () => {
      setIsOpen(true);
    };

    window.addEventListener('open-chatbot', handleOpenChatbot);
    return () => {
      window.removeEventListener('open-chatbot', handleOpenChatbot);
    };
  }, []);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [threadId, setThreadId] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmittingSurvey, setIsSubmittingSurvey] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    budget: chatBudget,
    isLoading: chatBudgetLoading,
    hasIdentity: chatBudgetHasIdentity,
    refetch: refetchChatBudget,
  } = useChatAssistantUserBudget(isOpen);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  // Handle fullscreen mode
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
      toast.error('Failed to toggle fullscreen mode');
    }
  };

  // Get tenant_id from session or use fallback
  const getTenantId = (): string => {
    // Try to get tenant_id from session
    if (session?.user) {
      // You may need to adjust this based on your session structure
      return (session.user as any).tenant_id || 'tenant_123';
    }
    return 'tenant_123'; // Fallback
  };

  // Send message to API
  const handleSendMessage = async () => {
    const messageText = inputValue.trim();
    if (!messageText || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const response = await sendChatMessage({
        message: messageText,
        ...(threadId ? { thread_id: threadId } : {}),
      });

      const aiResponseText = response.response || 'No response received';
      const newThreadId = response?.thread_id || threadId;

      // Update thread_id if we got a new one
      if (newThreadId && newThreadId !== threadId) {
        setThreadId(newThreadId);
      }

      // Add AI response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      };

      setMessages(prev => [...prev, aiMessage]);
      refetchChatBudget();
    } catch (error: unknown) {
      console.error('Chat API error:', error);

      const errorText = isChatUserBudgetExhaustedError(error)
        ? error.message
        : error instanceof Error && error.message.trim()
          ? error.message.trim()
          : 'Sorry, I encountered an error. Please try again.';

      // Error toast is already shown in sendChatMessage for API failures
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: errorText,
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      // Focus input after sending
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  // Show survey modal before clearing chat
  const handleClearChatClick = () => {
    if (messages.length > 0) {
      setShowSurveyModal(true);
    } else {
      clearChat();
    }
  };

  // Submit survey and clear chat
  const handleSurveySubmit = async () => {
    if (rating === 0) {
      toast.error('Please provide a rating');
      return;
    }

    setIsSubmittingSurvey(true);
    try {
      // Submit survey to API
      await submitChatSurvey({
        rating,
        feedback: feedback.trim() || null,
        thread_id: threadId || '',
        tenant_id: getTenantId(),
      });
      
      toast.success('Thank you for your feedback!');
      setShowSurveyModal(false);
      clearChat();
    } catch (error: any) {
      console.error('Survey submission error:', error);
      // Still clear chat even if survey fails
      setShowSurveyModal(false);
      clearChat();
    } finally {
      setIsSubmittingSurvey(false);
      setRating(0);
      setFeedback('');
    }
  };

  // Skip survey and clear chat
  const handleSurveySkip = () => {
    setShowSurveyModal(false);
    clearChat();
    setRating(0);
    setFeedback('');
  };

  // Clear chat
  const clearChat = () => {
    setMessages([]);
    setThreadId('');
    setInputValue('');
    setLoading(false);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is an image
    const isImage = file.type.startsWith('image/');
    
    if (isImage) {
      // Create image preview URL
      const imageUrl = URL.createObjectURL(file);
      
      const imageMessage: Message = {
        id: Date.now().toString(),
        text: file.name,
        sender: 'user',
        timestamp: new Date(),
        type: 'image',
        fileName: file.name,
        fileSize: (file.size / 1024).toFixed(2) + ' KB',
        imageUrl: imageUrl
      };

      setMessages(prev => [...prev, imageMessage]);

      // Note: Image upload would need API integration
      // For now, we'll just show a placeholder message
      setTimeout(() => {
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: "I've received your image. Thank you for sharing!",
          sender: 'ai',
          timestamp: new Date(),
          type: 'text'
        };
        setMessages(prev => [...prev, botResponse]);
      }, 1000);
    } else {
      // Handle non-image files
      const fileMessage: Message = {
        id: Date.now().toString(),
        text: `Attached file: ${file.name}`,
        sender: 'user',
        timestamp: new Date(),
        type: 'file',
        fileName: file.name,
        fileSize: (file.size / 1024).toFixed(2) + ' KB'
      };

      setMessages(prev => [...prev, fileMessage]);

      // Note: File attachments would need API integration
      // For now, we'll just show a placeholder message
      setTimeout(() => {
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: "I've received your file. Thank you for sharing!",
          sender: 'ai',
          timestamp: new Date(),
          type: 'text'
        };
        setMessages(prev => [...prev, botResponse]);
      }, 1000);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const audioChunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        
        // Create audio blob from recorded chunks
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const voiceMessage: Message = {
          id: Date.now().toString(),
          text: 'Voice message',
          sender: 'user',
          timestamp: new Date(),
          type: 'voice',
          duration: `${recordingTime}s`,
          audioUrl: audioUrl
        };

        setMessages(prev => [...prev, voiceMessage]);

        // Note: Voice messages would need API integration for transcription
        // For now, we'll just show a placeholder message
        setTimeout(() => {
          const botResponse: Message = {
            id: (Date.now() + 1).toString(),
            text: "I've received your voice message. Thank you!",
            sender: 'ai',
            timestamp: new Date(),
            type: 'text'
          };
          setMessages(prev => [...prev, botResponse]);
        }, 1000);

        setRecordingTime(0);
      };

      mediaRecorder.start();
      setIsRecording(true);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setInputValue(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) {
    return (
      <></>
      // <button
      //   style={{ 
      //     borderRadius: '50%',
      //     bottom: '1.5rem',
      //     right: '1.5rem',
      //     width: '3.5rem',
      //     height: '3.5rem',
      //     zIndex: 999,
      //     background: '#1788d4',
      //     display: 'none',
      //   }}
      //   onClick={() => setIsOpen(true)}
      //   className="position-fixed text-white shadow-lg d-flex align-items-center justify-content-center border-0"
      //   aria-label="Open chat"
      //   onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1788d4'}
      //   onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1788d4'}
       
      // >
      //   <Bot size={24} />
      // </button>
    );
  }

  return (
    <>
    <div 
      className="position-fixed bg-white rounded shadow d-flex flex-column"
      style={{
        bottom: '0.4rem',
        right: '1.5rem',
        width: '24rem',
        height: '600px',
        zIndex: 999,
        maxWidth: 'calc(100vw - 3rem)'
      }}
    >
      {/* Header */}
      <div 
        className="text-white px-4 py-3 d-flex align-items-center justify-content-between"
        style={{ 
          backgroundColor: '#0973ba',
          borderTopLeftRadius: '0.5rem',
          borderTopRightRadius: '0.5rem'
        }}
      >
        <div className="d-flex align-items-center gap-3">
          <div 
            className="rounded-circle d-flex align-items-center justify-content-center"
            style={{
              width: '2.5rem',
              height: '2.5rem',
              backgroundColor: '#1788d4'
            }}
          >
            <MessageCircle size={20} />
          </div>
          <div>
            <h3 className="fw-semibold mb-0" style={{ fontSize: '0.875rem', color: '#fff' }}>
              {showSurveyModal ? 'Rate Your Experience' : 'AI Assistant'}
            </h3>
            <p className="mb-0" style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
              {showSurveyModal ? 'We value your feedback' : 'Online'}
            </p>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          {/* <button
            onClick={toggleFullscreen}
            className="p-1 rounded border-0 bg-transparent text-white"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#475569'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button> */}
          {messages.length > 0 && !showSurveyModal && (
            <button
              onClick={handleClearChatClick}
              className="p-1 rounded border-0 bg-transparent text-white"
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#475569'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <X size={18} />
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded border-0 bg-transparent text-white"
            aria-label="Close chat"
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#475569'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Minimize2 size={18} />
          </button>
        </div>
      </div>

      <ChatAssistantBudgetBar
        budget={chatBudget}
        isLoading={chatBudgetLoading && chatBudgetHasIdentity}
        compact
      />

      {/* Messages or Survey */}
      <div 
        className="flex-fill overflow-auto p-4"
        style={{ backgroundColor: '#f8fafc' }}
      >
        {showSurveyModal ? (
          // Survey Content
          <div className="d-flex flex-column" style={{ minHeight: '400px' }}>
            <div className="text-center mb-4">
              <p className="mb-3" style={{ fontSize: '0.95rem', color: '#64748b' }}>
                How would you rate your chat experience?
              </p>
              <div className="d-flex justify-content-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="border-0 bg-transparent p-0"
                    style={{ cursor: 'pointer' }}
                    aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                  >
                    <Star
                      size={40}
                      fill={star <= rating ? '#fbbf24' : 'none'}
                      stroke={star <= rating ? '#fbbf24' : '#cbd5e1'}
                      style={{
                        transition: 'all 0.2s ease',
                        transform: star <= rating ? 'scale(1.1)' : 'scale(1)'
                      }}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="mb-3" style={{ fontSize: '0.875rem', color: '#475569', fontWeight: 500 }}>
                  {rating === 1 && 'Poor'}
                  {rating === 2 && 'Fair'}
                  {rating === 3 && 'Good'}
                  {rating === 4 && 'Very Good'}
                  {rating === 5 && 'Excellent'}
                </p>
              )}
            </div>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                Additional Feedback (Optional)
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tell us more about your experience..."
                style={{ fontSize: '0.875rem' }}
              />
            </Form.Group>
            <div className="d-flex gap-2 mt-auto">
              <Button
                variant="outline-secondary"
                onClick={handleSurveySkip}
                disabled={isSubmittingSurvey}
                className="flex-fill"
              >
                Skip
              </Button>
              <Button
                variant="primary"
                onClick={handleSurveySubmit}
                disabled={isSubmittingSurvey || rating === 0}
                className="flex-fill"
              >
                {isSubmittingSurvey ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Submitting...
                  </>
                ) : (
                  'Submit'
                )}
              </Button>
            </div>
          </div>
        ) : (
          // Chat Messages
          <>
            {messages.length === 0 ? (
              <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '300px' }}>
                <div className="text-center">
                  <MessageCircle size={40} className="text-muted mb-3" style={{ opacity: 0.5 }} />
                  <h5 className="text-muted mb-2" style={{ fontSize: '1rem', fontWeight: 600 }}>Start a Conversation</h5>
                  <p className="text-muted mb-0" style={{ fontSize: '0.875rem' }}>Type a message below to begin chatting with AI</p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`mb-4 d-flex ${message.sender === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
                >
                  <div style={{ maxWidth: '80%' }}>
                    <div
                      className={`rounded px-4 py-2 ${
                        message.sender === 'user'
                          ? 'text-white'
                          : 'border'
                      }`}
                      style={{
                        backgroundColor: message.sender === 'user' ? '#334155' : '#ffffff',
                        color: message.sender === 'user' ? '#ffffff' : '#1e293b',
                        borderColor: message.sender === 'ai' ? '#e2e8f0' : 'transparent'
                      }}
                    >
                      {message.type === 'image' && (
                        <div className="d-flex flex-column gap-2">
                          {message.imageUrl && (
                            <div 
                              className="rounded overflow-hidden"
                              style={{ 
                                maxWidth: '100%',
                                maxHeight: '300px',
                                cursor: 'pointer'
                              }}
                              onClick={() => window.open(message.imageUrl, '_blank')}
                            >
                              <img
                                src={message.imageUrl}
                                alt={message.fileName || 'Image'}
                                style={{
                                  width: '100%',
                                  height: 'auto',
                                  maxHeight: '300px',
                                  objectFit: 'contain',
                                  display: 'block'
                                }}
                              />
                            </div>
                          )}
                          <div className="d-flex align-items-center gap-2" style={{ fontSize: '0.75rem' }}>
                            <ImageIcon size={14} />
                            <div>
                              <div className="fw-medium">{message.fileName}</div>
                              {message.fileSize && (
                                <div style={{ opacity: 0.75 }}>{message.fileSize}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      {message.type === 'file' && (
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <Paperclip size={14} />
                          <div style={{ fontSize: '0.75rem' }}>
                            <div className="fw-medium">{message.fileName}</div>
                            <div style={{ opacity: 0.75 }}>{message.fileSize}</div>
                          </div>
                        </div>
                      )}
                      {message.type === 'voice' && (
                        <VoiceMessagePlayer message={message} />
                      )}
                      {message.type === 'text' && (
                        <p className="mb-0" style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{message.text}</p>
                      )}
                    </div>
                    <p 
                      className={`mb-0 mt-1 ${message.sender === 'user' ? 'text-end' : 'text-start'}`}
                      style={{ fontSize: '0.75rem', color: '#64748b' }}
                    >
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="mb-4 d-flex justify-content-start">
                <div style={{ maxWidth: '80%' }}>
                  <div className="rounded px-4 py-3 border bg-white" style={{ borderColor: '#e2e8f0' }}>
                    <div className="d-flex align-items-center gap-2">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div 
          className="position-absolute bg-white border rounded shadow p-2"
          style={{
            bottom: '5rem',
            right: '1rem',
            borderColor: '#e2e8f0'
          }}
        >
          <div className="d-flex gap-1 flex-wrap" style={{ width: '12rem' }}>
            {EMOJI_LIST.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleEmojiSelect(emoji)}
                className="rounded p-1 border-0 bg-transparent"
                style={{ fontSize: '1.5rem' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area - Hidden during survey */}
      {!showSurveyModal && (
      <div 
        className="border-top bg-white"
        style={{
          borderTopColor: '#e2e8f0',
          borderBottomLeftRadius: '0.5rem',
          borderBottomRightRadius: '0.5rem'
        }}
      >
        {isRecording && (
          <div 
            className="mx-3 mt-3 mb-2 d-flex align-items-center justify-content-between border rounded px-3 py-2"
            style={{
              backgroundColor: '#fef2f2',
              borderColor: '#fecaca'
            }}
          >
            <div className="d-flex align-items-center gap-2" style={{ color: '#dc2626' }}>
              <div 
                className="rounded-circle"
                style={{
                  width: '0.5rem',
                  height: '0.5rem',
                  backgroundColor: '#dc2626',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                }}
              />
              <span className="fw-medium" style={{ fontSize: '0.875rem' }}>Recording: {recordingTime}s</span>
            </div>
            <button
              onClick={stopRecording}
              className="fw-medium border-0 bg-transparent"
              style={{ 
                color: '#dc2626',
                fontSize: '0.875rem'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#b91c1c'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#dc2626'}
            >
              Stop
            </button>
          </div>
        )}
        
        <div className="d-flex align-items-center gap-2 p-3 bg-white">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileAttachment}
            className="d-none"
            aria-label="Attach file"
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          
          <Form.Control
            ref={inputRef}
            as="textarea"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            className="flex-fill"
            rows={1}
            disabled={loading || isRecording}
            style={{
              resize: 'none',
              overflow: 'hidden',
              maxHeight: '120px',
              minHeight: '38px'
            }}
          />
          
          <div className="d-flex gap-1 align-items-center flex-shrink-0">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-circle border-0 bg-transparent"
              aria-label="Attach file"
              disabled={true}
              style={{ color: '#cbd5e1'}}
              
            >
              <Paperclip size={20} />
            </button>
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 rounded-circle border-0 bg-transparent"
              aria-label="Add emoji"
              disabled={loading || isRecording}
              style={{ color: loading || isRecording ? '#cbd5e1' : '#475569', cursor: loading || isRecording ? 'not-allowed' : 'pointer' }}
              onMouseEnter={(e) => {
                if (!loading && !isRecording) {
                  e.currentTarget.style.backgroundColor = '#f1f5f9';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Smile size={20} />
            </button>
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className="p-2 rounded-circle border-0 bg-transparent"
              aria-label={isRecording ? 'Stop recording' : 'Record voice message'}
              disabled={true}
              style={{ color: '#cbd5e1' }}
              
            >
              <Mic size={20} />
            </button>
            <Button
              onClick={handleSendMessage}
              disabled={loading || inputValue.trim() === '' || isRecording}
              className="p-2 rounded-circle"
              aria-label="Send message"
            >
             
                <Send size={20} />
              
            </Button>
          </div>
        </div>
      </div>
      )}
    </div>
    <style dangerouslySetInnerHTML={{
      __html: `
        .typing-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 0;
        }
        
        .typing-indicator span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #64748b;
          display: inline-block;
          animation: typing 1.4s infinite ease-in-out;
        }
        
        .typing-indicator span:nth-child(1) {
          animation-delay: -0.32s;
        }
        
        .typing-indicator span:nth-child(2) {
          animation-delay: -0.16s;
        }
        
        .typing-indicator span:nth-child(3) {
          animation-delay: 0s;
        }
        
        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.7;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }
      `
    }} />
    </>
  );
}
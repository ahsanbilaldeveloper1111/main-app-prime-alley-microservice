import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useState,
  useRef,
  useEffect,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { Card, Form, Button, InputGroup, Spinner } from "react-bootstrap";
import { Send, X, Bot, User, Maximize2, Minimize2 } from "lucide-react";
import axiosInstance from "@utils/axios";
import { toast } from "react-toastify";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import "@assets/scss/chat.scss";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [threadId, setThreadId] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
        // Enter fullscreen
        await document.documentElement.requestFullscreen();
      } else {
        // Exit fullscreen
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
      toast.error('Failed to toggle fullscreen mode');
    }
  };

  // Get tenant_id from session or use fallback
  const getTenantId = (): string => {
    return "tenant_123"; // Fallback
  };

  // Send message to API
  const sendMessage = async () => {
    const messageText = inputMessage.trim();
    if (!messageText || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: "user",
      timestamp: new Date(),
    };

    // Add user message immediately
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setLoading(true);

    try {
      const payload = {
        message: messageText,
        tenant_id: getTenantId(),
        thread_id: threadId || "",
      };

      const response = await axiosInstance.post("/chat", payload);

      // Check if response contains an error
      if (response.data?.error) {
        throw new Error(response.data.error || "An error occurred");
      }

      // Extract AI response and thread_id from response
      const aiResponseText = response.data?.response || response.data?.message || "No response received";
      const newThreadId = response.data?.thread_id || threadId;

      // Update thread_id if we got a new one
      if (newThreadId && newThreadId !== threadId) {
        setThreadId(newThreadId);
      }

      // Add AI response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        sender: "ai",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      console.error("Chat API error:", error);
      
      // Extract error message from various possible locations
      const errorMsg = 
        error.response?.data?.error || 
        error.response?.data?.message || 
        error.message || 
        "An error occurred while processing your request. Please try again.";
      
      toast.error(errorMsg);
      
      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I encountered an error. Please try again.",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      // Focus input after sending
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Clear chat
  const clearChat = () => {
    setMessages([]);
    setThreadId("");
    setInputMessage("");
    inputRef.current?.focus();
  };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Chat" />

      <div
        style={{
          height: "calc(100vh - 120px)",
          display: "flex",
          flexDirection: "column",
          margin: "0 -15px",
        }}
      >
        <Card
          className="mb-0 h-100 d-flex flex-column"
          style={{
            borderRadius: "16px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
            border: "none",
            overflow: "hidden",
          }}
        >
          <Card.Header
            className="d-flex justify-content-between align-items-center"
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "#fff",
              padding: "20px 24px",
              border: "none",
            }}
          >
            <div className="d-flex align-items-center gap-3">
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Bot size={20} />
              </div>
              <div>
                <h5 className="mb-0" style={{ fontWeight: 600 }}>
                  Live Conversation
                </h5>
                <small style={{ opacity: 0.9, fontSize: "0.85rem" }}>
                  AI Assistant
                </small>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              <Button
                variant="light"
                size="sm"
                onClick={toggleFullscreen}
                className="d-flex align-items-center gap-2"
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  color: "#fff",
                  fontWeight: 500,
                }}
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                {isFullscreen ? "Exit" : "Fullscreen"}
              </Button>
              {messages.length > 0 && (
                <Button
                  variant="light"
                  size="sm"
                  onClick={clearChat}
                  className="d-flex align-items-center gap-2"
                  style={{
                    background: "rgba(255, 255, 255, 0.2)",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    color: "#fff",
                    fontWeight: 500,
                  }}
                >
                  <X size={16} />
                  Clear
                </Button>
              )}
            </div>
          </Card.Header>
          <Card.Body
            className="p-0 d-flex flex-column"
            style={{ flex: 1, overflow: "hidden" }}
          >
            {/* Messages Display Area */}
            <div
              className="chat-message scroll-block"
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "24px",
                background: "linear-gradient(to bottom, #f8f9fa 0%, #ffffff 100%)",
                minHeight: 0,
              }}
            >
              {messages.length === 0 ? (
                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    height: "100%",
                    minHeight: "400px",
                    color: "#6c757d",
                  }}
                >
                  <div className="text-center">
                    <div
                      style={{
                        width: "80px",
                        height: "80px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 20px",
                        boxShadow: "0 8px 24px rgba(102, 126, 234, 0.3)",
                      }}
                    >
                      <Bot size={40} color="#fff" />
                    </div>
                    <h5 style={{ color: "#495057", marginBottom: "8px", fontWeight: 600 }}>
                      Start a Conversation
                    </h5>
                    <p className="mb-0" style={{ color: "#6c757d", fontSize: "0.95rem" }}>
                      Type a message below to begin chatting with AI
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`d-flex mb-4 ${
                      message.sender === "user" ? "message-out" : "message-in"
                    }`}
                    style={{
                      animation: "fadeIn 0.3s ease-in",
                    }}
                  >
                    <div
                      className={`d-flex align-items-start gap-3 ${
                        message.sender === "user" ? "flex-row-reverse" : ""
                      }`}
                      style={{ maxWidth: "75%" }}
                    >
                      <div
                        className="d-flex align-items-center justify-content-center"
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          background:
                            message.sender === "user"
                              ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                              : "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                          color: "#fff",
                          flexShrink: 0,
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                        }}
                      >
                        {message.sender === "user" ? (
                          <User size={20} />
                        ) : (
                          <Bot size={20} />
                        )}
                      </div>
                      <div
                        className={`msg-content ${
                          message.sender === "user"
                            ? "text-white"
                            : "bg-white"
                        }`}
                        style={{
                          padding: "14px 18px",
                          borderRadius: message.sender === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                          background:
                            message.sender === "user"
                              ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                              : "#ffffff",
                          boxShadow:
                            message.sender === "user"
                              ? "0 4px 12px rgba(102, 126, 234, 0.3)"
                              : "0 2px 8px rgba(0, 0, 0, 0.08)",
                          border: message.sender === "user" ? "none" : "1px solid #e9ecef",
                        }}
                      >
                        <p
                          className="mb-0"
                          style={{
                            whiteSpace: "pre-wrap",
                            lineHeight: "1.5",
                            fontSize: "0.95rem",
                          }}
                        >
                          {message.text}
                        </p>
                        <span
                          className="time-stamp"
                          style={{
                            fontSize: "0.7rem",
                            opacity: message.sender === "user" ? 0.8 : 0.6,
                            marginTop: "6px",
                            display: "block",
                            textAlign: message.sender === "user" ? "right" : "left",
                          }}
                        >
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="d-flex message-in mb-4">
                  <div className="d-flex align-items-start gap-3">
                    <div
                      className="d-flex align-items-center justify-content-center"
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                        color: "#fff",
                        flexShrink: 0,
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                      }}
                    >
                      <Bot size={20} />
                    </div>
                    <div
                      className="msg-content bg-white"
                      style={{
                        padding: "14px 18px",
                        borderRadius: "18px 18px 18px 4px",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                        border: "1px solid #e9ecef",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <Spinner
                        animation="border"
                        size="sm"
                        style={{ color: "#667eea" }}
                      />
                      <span style={{ fontSize: "0.9rem", color: "#6c757d" }}>
                        AI is thinking...
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div
              style={{
                padding: "20px 24px",
                backgroundColor: "#ffffff",
                borderTop: "1px solid #e9ecef",
                boxShadow: "0 -2px 10px rgba(0, 0, 0, 0.05)",
              }}
            >
              <InputGroup>
                <Form.Control
                  ref={inputRef}
                  type="text"
                  placeholder="Type your message and press Enter..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  style={{
                    border: "2px solid #e9ecef",
                    borderRadius: "12px 0 0 12px",
                    padding: "12px 16px",
                    fontSize: "0.95rem",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#667eea";
                    e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e9ecef";
                    e.target.style.boxShadow = "none";
                  }}
                />
                <Button
                  onClick={sendMessage}
                  disabled={loading || !inputMessage.trim()}
                  className="d-flex align-items-center gap-2"
                  style={{
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    border: "none",
                    borderRadius: "0 12px 12px 0",
                    padding: "12px 24px",
                    fontWeight: 500,
                    boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!loading && inputMessage.trim()) {
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 6px 16px rgba(102, 126, 234, 0.4)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.3)";
                  }}
                >
                  {loading ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <>
                      <Send size={18} />
                      Send
                    </>
                  )}
                </Button>
              </InputGroup>
            </div>
          </Card.Body>
        </Card>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .chat-message::-webkit-scrollbar {
            width: 8px;
          }

          .chat-message::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }

          .chat-message::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 10px;
          }

          .chat-message::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%);
          }
        `
      }} />
    </React.Fragment>
  );
};

Chat.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default Chat;

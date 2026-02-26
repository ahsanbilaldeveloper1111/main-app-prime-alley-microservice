import "@assets/scss/datatable-style.scss";
import React, { ReactElement } from "react";
import ChatbotWidget from '@components/chatbot';
import { MessageCircle, Zap, Shield, Clock } from 'lucide-react';
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";

const Chat = () => {

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Chat" />


      <div 
      className="min-vh-100"
      style={{
        background: 'linear-gradient(to bottom right, #f8fafc, #f1f5f9)'
      }}
    >
      {/* Hero Section */}
      <div className="container px-4 py-5">
        <div className="text-center mx-auto" style={{ maxWidth: '56rem' }}>
          <div className="d-flex justify-content-center mb-4">
            <div 
              className="rounded-circle d-flex align-items-center justify-content-center"
              style={{
                width: '5rem',
                height: '5rem',
                backgroundColor: '#334155'
              }}
            >
              <MessageCircle size={40} className="text-white" />
            </div>
          </div>
          
          <h1 
            className="fw-bold mb-4"
            style={{
              fontSize: '3rem',
              color: '#0f172a'
            }}
          >
            24/7 AI-Powered Support Assistant
          </h1>
          
          <p 
            className="mb-4"
            style={{
              fontSize: '1.25rem',
              color: '#475569'
            }}
          >
            Get instant answers to your questions with our intelligent chatbot. 
            Available around the clock to help you with anything you need.
          </p>
          
          <div className="d-flex gap-3 justify-content-center">
            <button 
              className="px-4 py-2 text-white border-0 rounded fw-semibold"
              style={{ backgroundColor: '#334155' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e293b'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#334155'}
            >
              Get Started
            </button>
            <button 
              className="px-4 py-2 rounded fw-semibold"
              style={{ 
                border: '2px solid #334155',
                backgroundColor: 'transparent',
                color: '#334155'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#334155';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#334155';
              }}
            >
              Learn More
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container px-4 py-5">
        <div className="row g-4 mx-auto" style={{ maxWidth: '80rem' }}>
          <div className="col-md-4">
            <div className="bg-white p-4 rounded shadow text-center" style={{ borderRadius: '0.75rem' }}>
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                style={{
                  width: '4rem',
                  height: '4rem',
                  backgroundColor: '#f1f5f9'
                }}
              >
                <Zap size={32} style={{ color: '#334155' }} />
              </div>
              <h3 className="fw-bold mb-3" style={{ fontSize: '1.25rem', color: '#0f172a' }}>Instant Responses</h3>
              <p style={{ color: '#475569' }}>
                Get immediate answers to your questions without waiting in queue
              </p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="bg-white p-4 rounded shadow text-center" style={{ borderRadius: '0.75rem' }}>
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                style={{
                  width: '4rem',
                  height: '4rem',
                  backgroundColor: '#f1f5f9'
                }}
              >
                <Clock size={32} style={{ color: '#334155' }} />
              </div>
              <h3 className="fw-bold mb-3" style={{ fontSize: '1.25rem', color: '#0f172a' }}>24/7 Availability</h3>
              <p style={{ color: '#475569' }}>
                Our chatbot is always online, ready to assist you any time of day
              </p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="bg-white p-4 rounded shadow text-center" style={{ borderRadius: '0.75rem' }}>
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                style={{
                  width: '4rem',
                  height: '4rem',
                  backgroundColor: '#f1f5f9'
                }}
              >
                <Shield size={32} style={{ color: '#334155' }} />
              </div>
              <h3 className="fw-bold mb-3" style={{ fontSize: '1.25rem', color: '#0f172a' }}>Secure & Private</h3>
              <p style={{ color: '#475569' }}>
                Your conversations are encrypted and your data is protected
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="container px-4 py-5">
        <div className="mx-auto" style={{ maxWidth: '56rem' }}>
          <h2 
            className="fw-bold text-center mb-5"
            style={{
              fontSize: '1.875rem',
              color: '#0f172a'
            }}
          >
            How It Works
          </h2>
          
          <div className="d-flex flex-column gap-4">
            <div className="d-flex gap-3 align-items-start bg-white p-4 rounded shadow">
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                style={{
                  width: '3rem',
                  height: '3rem',
                  backgroundColor: '#334155'
                }}
              >
                1
              </div>
              <div>
                <h4 className="fw-semibold mb-2" style={{ fontSize: '1.125rem', color: '#0f172a' }}>
                  Click the Chat Icon
                </h4>
                <p className="mb-0" style={{ color: '#475569' }}>
                  Start a conversation by clicking the chat icon in the bottom right corner
                </p>
              </div>
            </div>

            <div className="d-flex gap-3 align-items-start bg-white p-4 rounded shadow">
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                style={{
                  width: '3rem',
                  height: '3rem',
                  backgroundColor: '#334155'
                }}
              >
                2
              </div>
              <div>
                <h4 className="fw-semibold mb-2" style={{ fontSize: '1.125rem', color: '#0f172a' }}>
                  Ask Your Question
                </h4>
                <p className="mb-0" style={{ color: '#475569' }}>
                  Type your question, send a voice message, or attach relevant files
                </p>
              </div>
            </div>

            <div className="d-flex gap-3 align-items-start bg-white p-4 rounded shadow">
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                style={{
                  width: '3rem',
                  height: '3rem',
                  backgroundColor: '#334155'
                }}
              >
                3
              </div>
              <div>
                <h4 className="fw-semibold mb-2" style={{ fontSize: '1.125rem', color: '#0f172a' }}>
                  Get Instant Help
                </h4>
                <p className="mb-0" style={{ color: '#475569' }}>
                  Receive immediate assistance and personalized solutions to your queries
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container px-4 py-5">
        <div 
          className="mx-auto text-white rounded text-center p-5"
          style={{
            maxWidth: '48rem',
            backgroundColor: '#334155',
            borderRadius: '1rem'
          }}
        >
          <h2 className="fw-bold mb-3" style={{ fontSize: '1.875rem' }}>
            Ready to Get Started?
          </h2>
          <p className="mb-4" style={{ fontSize: '1.125rem', color: '#cbd5e1' }}>
            Try our chatbot now by clicking the icon in the bottom right corner!
          </p>
          <div className="d-flex gap-2 align-items-center justify-content-center" style={{ color: '#cbd5e1' }}>
            <MessageCircle size={20} />
            <span>Look for the chat icon →</span>
          </div>
        </div>
      </div>

      {/* Chatbot Widget */}
      <ChatbotWidget />
    </div>
    </React.Fragment>
  );
};

Chat.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default Chat;

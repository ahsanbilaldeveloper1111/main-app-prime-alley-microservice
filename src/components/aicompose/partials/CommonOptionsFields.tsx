import React from 'react';
import { Col, Form } from 'react-bootstrap';
import type { CommonChannelOptions } from '../types';

interface CommonOptionsFieldsProps {
  commonOptions: CommonChannelOptions;
  setCommonOptions: React.Dispatch<React.SetStateAction<CommonChannelOptions>>;
}

const CommonOptionsFields: React.FC<CommonOptionsFieldsProps> = ({ commonOptions, setCommonOptions }) => (
  
    <>
    <Col md={6}>
        <Form.Group className="mb-3">
          <Form.Label className=" fw-semibold">Industry</Form.Label>
          <Form.Select  value={commonOptions.industry} onChange={(e) => setCommonOptions((p) => ({ ...p, industry: e.target.value }))}>
            <option value="">Select</option>
            <option value="real_estate">Real Estate</option>
            <option value="sass">Banking</option>
            <option value="health_care">Education</option>
            <option value="ecommerce">Ecommerce</option>
            <option value="healthcare">Healthcare</option>
            <option value="retail">Retail</option>
            <option value="technology">Technology</option>
            <option value="custom">Custom</option>
          </Form.Select>
        </Form.Group>
      </Col>
      {commonOptions.industry === 'custom' && (
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label className=" fw-semibold">Custom Industry</Form.Label>
            <Form.Control  value={commonOptions.customIndustry} onChange={(e) => setCommonOptions((p) => ({ ...p, customIndustry: e.target.value }))} placeholder="Enter industry" />
          </Form.Group>
        </Col>
      )}
      <Col md={6}>
        <Form.Group className="mb-3">
          <Form.Label className=" fw-semibold">Tone</Form.Label>
          <Form.Select  value={commonOptions.tone} onChange={(e) => setCommonOptions((p) => ({ ...p, tone: e.target.value }))}>
            <option value="professional">Professional</option>
            <option value="casual">Casual</option>
            <option value="friendly">Friendly</option>
            <option value="empathetic">Empathetic</option>
            <option value="urgent">Urgent</option>
            <option value="persuasive">Persuasive</option>
          </Form.Select>
        </Form.Group>
      </Col>
      <Col md={6}>
        <Form.Group className="mb-3">
          <Form.Label className=" fw-semibold">Language</Form.Label>
          <Form.Select  value={commonOptions.language} onChange={(e) => setCommonOptions((p) => ({ ...p, language: e.target.value }))}>
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="hi">Hindi</option>
            <option value="ur">Urdu</option>
            <option value="it">Italian</option>
            <option value="pt">Japanese</option>
            <option value="ru">Russian</option>
            <option value="zh">Chinese</option>
            <option value="custom">Custom</option>
          </Form.Select>
        </Form.Group>
      </Col>
      {commonOptions.language === 'custom' && (
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label className=" fw-semibold">Custom Language</Form.Label>
            <Form.Control  value={commonOptions.customLanguage} onChange={(e) => setCommonOptions((p) => ({ ...p, customLanguage: e.target.value }))} placeholder="e.g. en, ar" />
          </Form.Group>
        </Col>
      )}
      <Col md={6}>
        <Form.Group className="mb-3">
          <Form.Label className=" fw-semibold">Urgency</Form.Label>
          <Form.Select  value={commonOptions.urgency} onChange={(e) => setCommonOptions((p) => ({ ...p, urgency: e.target.value }))}>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </Form.Select>
        </Form.Group>
      </Col>
      <Col md={6}>
        <Form.Group className="mb-3">
          <Form.Label className=" fw-semibold">CTA Type</Form.Label>
          <Form.Select  value={commonOptions.ctaType} onChange={(e) => setCommonOptions((p) => ({ ...p, ctaType: e.target.value }))}>
            <option value="">Select</option>
            <option value="schedule_call">Schedule call</option>
            <option value="visit_website">Visit website</option>
            <option value="book_demo">Book demo</option>
            <option value="start_trial">Start trial</option>
            <option value="make_payment">Make payment</option>
            <option value="custom">Custom</option>
          </Form.Select>
        </Form.Group>
      </Col>
      {commonOptions.ctaType === 'custom' && (
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label className=" fw-semibold">Custom CTA</Form.Label>
            <Form.Control  value={commonOptions.customCtaType} onChange={(e) => setCommonOptions((p) => ({ ...p, customCtaType: e.target.value }))} placeholder="Enter CTA type" />
          </Form.Group>
        </Col>
      )}
    </>
);

export default CommonOptionsFields;

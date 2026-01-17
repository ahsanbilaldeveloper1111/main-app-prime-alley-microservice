import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericListPage from "@components/GenericListPage";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import PageHeader from "@components/PageHeader";

import  { useState, useMemo } from 'react';
import { 
  Search, 
  ChevronDown, 
  FileText, 
  Calendar,
  UserPlus,
  User,
  File,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Briefcase,
  ClipboardList
} from 'lucide-react';
import ApprovalDetailSidebar from './sidebar';

interface Request {
  id: string;
  title: string;
  subtitle?: string;
  type: string;
  typeIcon: string;
  requestedBy: string;
  requestedBySubtitle?: string;
  submittedOn: string;
  aging: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  days?: string;
}



const ApprovalRequest = () => {
    const [activeTab, setActiveTab] = useState<'Pending' | 'Approved' | 'Rejected'>('Pending');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [selectedRequestedBy, setSelectedRequestedBy] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedAging, setSelectedAging] = useState('');
    const [showTypeDropdown, setShowTypeDropdown] = useState(false);
    const [showRequestedByDropdown, setShowRequestedByDropdown] = useState(false);
    const [showDateDropdown, setShowDateDropdown] = useState(false);
    const [showAgingDropdown, setShowAgingDropdown] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  
    const requests: Request[] = [
      {
        id: '1',
        title: 'Sick Leave',
        subtitle: 'Apr 22, 2024 (1 day)',
        type: 'Leave',
        typeIcon: 'leave',
        requestedBy: 'Adeel Raza',
        requestedBySubtitle: 'Xaqeol Raza',
        submittedOn: 'Apr 22, 2024',
        aging: 'Pending',
        status: 'Pending',
        days: '1 day'
      },
      {
        id: '2',
        title: 'Employment Contract Template',
        subtitle: '',
        type: 'Document',
        typeIcon: 'document',
        requestedBy: 'Farah Ahmed',
        requestedBySubtitle: 'Farah Ahmed',
        submittedOn: 'Apr 18, 2024',
        aging: 'Pending',
        status: 'Pending'
      },
      {
        id: '3',
        title: 'Onboarding Checklist for Arslan Malik',
        subtitle: '',
        type: 'Onboarding',
        typeIcon: 'onboarding',
        requestedBy: 'Zohaib Rehman',
        requestedBySubtitle: 'Onboarding',
        submittedOn: 'Apr 18, 2024',
        aging: 'Pending',
        status: 'Pending'
      },
      {
        id: '4',
        title: 'Employment Contract Template',
        subtitle: '',
        type: 'Profile',
        typeIcon: 'profile',
        requestedBy: 'Hassan Mir',
        requestedBySubtitle: 'Hassan Mir',
        submittedOn: 'Apr 17, 2024',
        aging: 'Pending',
        status: 'Pending'
      },
      {
        id: '5',
        title: 'Zohaib Rehman',
        subtitle: 'Profile',
        type: 'Profile',
        typeIcon: 'profile',
        requestedBy: 'Zohaib Rehman',
        requestedBySubtitle: 'Profile',
        submittedOn: 'Apr 15, 2024',
        aging: 'Pending',
        status: 'Pending'
      },
      {
        id: '6',
        title: 'Profile Update',
        subtitle: 'Doc Leeave',
        type: 'Profile',
        typeIcon: 'profile',
        requestedBy: 'Zohaib Rehman',
        requestedBySubtitle: 'Profile',
        submittedOn: 'Apr 15, 2024',
        aging: 'Pending',
        status: 'Pending'
      }
    ];
  
    const types = ['Leave', 'Document', 'Onboarding', 'Profile'];
    const requestedByOptions = ['Adeel Raza', 'Farah Ahmed', 'Zohaib Rehman', 'Hassan Mir'];
    const dateOptions = ['Last 7 days', 'Last 30 days', 'Last 3 months', 'All time'];
    const agingOptions = ['Less than 1 day', '1-3 days', '3-7 days', 'More than 7 days'];
  
    const itemsPerPage = 10;
  
    const filteredRequests = useMemo(() => {
      return requests.filter(req => {
        const matchesTab = req.status === activeTab;
        const matchesSearch = req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             req.requestedBy.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = !selectedType || req.type === selectedType;
        const matchesRequestedBy = !selectedRequestedBy || req.requestedBy === selectedRequestedBy;
        
        return matchesTab && matchesSearch && matchesType && matchesRequestedBy;
      });
    }, [activeTab, searchTerm, selectedType, selectedRequestedBy, requests]);
  
    const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
    const paginatedRequests = filteredRequests.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  
    const getTypeIcon = (iconType: string) => {
      switch (iconType) {
        case 'leave':
          return <Calendar size={16} color="#6366f1" />;
        case 'document':
          return <FileText size={16} color="#8b5cf6" />;
        case 'onboarding':
          return <UserPlus size={16} color="#10b981" />;
        case 'profile':
          return <User size={16} color="#6366f1" />;
        default:
          return <File size={16} color="#6b7280" />;
      }
    };
  
    const getTypeColor = (type: string) => {
      switch (type) {
        case 'Leave':
          return '#dbeafe';
        case 'Document':
          return '#f3e8ff';
        case 'Onboarding':
          return '#d1fae5';
        case 'Profile':
          return '#dbeafe';
        default:
          return '#f3f4f6';
      }
    };
  

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Customer Dashboard" />
      <div >
      <div >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '600',
            color: '#111827',
            margin: 0
          }}>Approval Requests</h1>
        
        </div>
        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '24px',
          borderBottom: '2px solid #e5e7eb'
        }}>
          {(['Pending', 'Approved', 'Rejected'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setCurrentPage(1);
              }}
              style={{
                padding: '12px 24px',
                background: activeTab === tab ? '#6366f1' : '#e5e7eb',
                color: activeTab === tab ? 'white' : '#6b7280',
                border: 'none',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '12px', 
          marginBottom: '24px',
          alignItems: 'center'
        }}>
          {/* Search Bar */}
          <div style={{ position: 'relative', flex: '1 1 300px', minWidth: '250px' }}>
            <Search 
              size={20} 
              style={{ 
                position: 'absolute', 
                left: '16px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: '#9ca3af'
              }} 
            />
            <input
              type="text"
              placeholder="Search name, ID, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 16px 10px 48px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: 'white',
              }}
            />
          </div>

          {/* Type Filter */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowTypeDropdown(!showTypeDropdown)}
              style={{
                padding: '10px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                minWidth: '140px',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={16} />
                <span>{selectedType || 'Type'}</span>
              </div>
              <ChevronDown size={16} />
            </button>
            {showTypeDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                zIndex: 10,
                minWidth: '200px'
              }}>
                <div
                  onClick={() => {
                    setSelectedType('');
                    setShowTypeDropdown(false);
                  }}
                  style={{
                    padding: '10px 16px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#6366f1'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  All Types
                </div>
                {types.map(type => (
                  <div
                    key={type}
                    onClick={() => {
                      setSelectedType(type);
                      setShowTypeDropdown(false);
                    }}
                    style={{
                      padding: '10px 16px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      backgroundColor: selectedType === type ? '#f3f4f6' : 'white'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedType === type ? '#f3f4f6' : 'white'}
                  >
                    {type}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Requested By Filter */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowRequestedByDropdown(!showRequestedByDropdown)}
              style={{
                padding: '10px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                minWidth: '160px',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={16} />
                <span>{selectedRequestedBy || 'Requested by'}</span>
              </div>
              <ChevronDown size={16} />
            </button>
            {showRequestedByDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                zIndex: 10,
                minWidth: '200px'
              }}>
                <div
                  onClick={() => {
                    setSelectedRequestedBy('');
                    setShowRequestedByDropdown(false);
                  }}
                  style={{
                    padding: '10px 16px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#6366f1'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  All Users
                </div>
                {requestedByOptions.map(person => (
                  <div
                    key={person}
                    onClick={() => {
                      setSelectedRequestedBy(person);
                      setShowRequestedByDropdown(false);
                    }}
                    style={{
                      padding: '10px 16px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      backgroundColor: selectedRequestedBy === person ? '#f3f4f6' : 'white'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedRequestedBy === person ? '#f3f4f6' : 'white'}
                  >
                    {person}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All Dates Filter */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowDateDropdown(!showDateDropdown)}
              style={{
                padding: '10px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                minWidth: '140px',
                justifyContent: 'space-between'
              }}
            >
              <span>{selectedDate || 'All Dates'}</span>
              <ChevronDown size={16} />
            </button>
            {showDateDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                zIndex: 10,
                minWidth: '180px'
              }}>
                <div
                  onClick={() => {
                    setSelectedDate('');
                    setShowDateDropdown(false);
                  }}
                  style={{
                    padding: '10px 16px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#6366f1'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  All Dates
                </div>
                {dateOptions.map(option => (
                  <div
                    key={option}
                    onClick={() => {
                      setSelectedDate(option);
                      setShowDateDropdown(false);
                    }}
                    style={{
                      padding: '10px 16px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      backgroundColor: selectedDate === option ? '#f3f4f6' : 'white'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedDate === option ? '#f3f4f6' : 'white'}
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All Aging Filter */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowAgingDropdown(!showAgingDropdown)}
              style={{
                padding: '10px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                minWidth: '140px',
                justifyContent: 'space-between'
              }}
            >
              <span>{selectedAging || 'All Aging'}</span>
              <ChevronDown size={16} />
            </button>
            {showAgingDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                zIndex: 10,
                minWidth: '180px'
              }}>
                <div
                  onClick={() => {
                    setSelectedAging('');
                    setShowAgingDropdown(false);
                  }}
                  style={{
                    padding: '10px 16px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#6366f1'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  All Aging
                </div>
                {agingOptions.map(option => (
                  <div
                    key={option}
                    onClick={() => {
                      setSelectedAging(option);
                      setShowAgingDropdown(false);
                    }}
                    style={{
                      padding: '10px 16px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      backgroundColor: selectedAging === option ? '#f3f4f6' : 'white'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedAging === option ? '#f3f4f6' : 'white'}
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => console.log('Search clicked')}
            style={{
              padding: '10px 24px',
              backgroundColor: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              marginLeft: 'auto'
            }}
          >
            Search
          </button>
        </div>

        {/* Inbox Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
              Inbox
            </h2>
            <div style={{
              padding: '4px 12px',
              backgroundColor: '#e5e7eb',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                {filteredRequests.length}
              </span>
              {/* <ChevronDown size={14} color="#6b7280" />
              <span style={{ fontSize: '14px', color: '#6b7280' }}>
                {activeTab}
              </span> */}
            </div>
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            {filteredRequests.length} {activeTab}
          </div>
        </div>

        {/* Requests Table */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '12px', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>Request</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Type
                      <ChevronDown size={14} />
                    </div>
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>Requested By</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>Submitted On</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Aging
                      <ChevronDown size={14} />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedRequests.map((request, index) => (
                  <tr 
                    key={request.id}
                    onClick={() => setSelectedRequest(request)}
                    style={{ 
                      borderBottom: index < paginatedRequests.length - 1 ? '1px solid #f3f4f6' : 'none',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                  >
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937', marginBottom: '4px' }}>
                        {request.title}
                      </div>
                      {/* {request.subtitle && (
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          {request.subtitle}
                        </div>
                      )} */}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        backgroundColor: getTypeColor(request.type),
                        borderRadius: '6px'
                      }}>
                        {getTypeIcon(request.typeIcon)}
                        <span style={{ fontSize: '13px', fontWeight: '500', color: '#1f2937' }}>
                          {request.type}
                        </span>
                      </div>
                      {/* {request.requestedBySubtitle && request.requestedBySubtitle !== request.type && (
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <File size={12} />
                          {request.type}
                        </div>
                      )} */}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontSize: '14px', color: '#1f2937', marginBottom: '4px' }}>
                        {request.requestedBy}
                      </div>
                      {/* {request.requestedBySubtitle && (
                        <div style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <User size={12} />
                          {request.requestedBySubtitle}
                        </div>
                      )} */}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#1f2937' }}>
                      {request.submittedOn}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        padding: '4px 12px',
                        backgroundColor: '#fef3c7',
                        color: '#92400e',
                        borderRadius: '16px',
                        fontSize: '13px',
                        fontWeight: '500'
                      }}>
                        {request.aging}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredRequests.length)} of {filteredRequests.length} requests
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  backgroundColor: currentPage === 1 ? '#f9fafb' : 'white',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.5 : 1
                }}
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  backgroundColor: currentPage === 1 ? '#f9fafb' : 'white',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.5 : 1
                }}
              >
                <ChevronLeft size={16} />
              </button>
              
              {[...Array(totalPages)].map((_, idx) => {
                const pageNum = idx + 1;
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      style={{
                        padding: '8px 14px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        backgroundColor: currentPage === pageNum ? '#6366f1' : 'white',
                        color: currentPage === pageNum ? 'white' : '#1f2937',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: currentPage === pageNum ? '600' : '400'
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                  return <span key={pageNum} style={{ padding: '8px 4px', color: '#6b7280' }}>...</span>;
                }
                return null;
              })}

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  backgroundColor: currentPage === totalPages ? '#f9fafb' : 'white',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.5 : 1
                }}
              >
                <ChevronRight size={16} />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  backgroundColor: currentPage === totalPages ? '#f9fafb' : 'white',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.5 : 1
                }}
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Approval Detail Sidebar */}
      {selectedRequest && (
        <div
          onClick={() => setSelectedRequest(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <ApprovalDetailSidebar 
              request={selectedRequest} 
              onClose={() => setSelectedRequest(null)}
            />
          </div>
        </div>
      )}
    </div>

    </React.Fragment>
  );
};

ApprovalRequest.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default ApprovalRequest;

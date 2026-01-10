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

import  { useState } from 'react';
import { 
  Calendar, 
  Tag, 
  Phone, 
  FileText, 
  CreditCard, 
  Users, 
  Briefcase, 
  Mail,
  ChevronDown,
  MoreVertical,
  Plus,
  X,
  Bell,
  Grid3x3,
  User,
  Link as LinkIcon,
  Copy,
  Trash2,
  Pencil,
  Clock,
  Pin,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import ConvertToTaskModal from '@components/converttotask';

// Types
interface Task {
  id: string;
  time?: string;
  title: string;
  label: string;
  labelColor: string;
  icon: React.ReactNode;
  completed: boolean;
  category: 'scheduled' | 'anytime' | 'overdue';
}

interface LinkedRecord {
  id: string;
  type: 'call' | 'contact' | 'ticket';
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}


const DialTodo = () => {
    const [activeTab, setActiveTab] = useState<'today' | 'completed' | 'overdue' | 'upcoming'>('today');
    const [filterDate, setFilterDate] = useState('today');
    const [filterLabel, setFilterLabel] = useState('labels');
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [showAddTask, setShowAddTask] = useState(false);
    const [showConvertModal, setShowConvertModal] = useState(false);
  
    // Dummy tasks data
    const [tasks, setTasks] = useState<Task[]>([
      {
        id: '1',
        time: '9:00',
        title: 'Call with Ahmad',
        label: 'Sales',
        labelColor: '#28a745',
        icon: <Phone size={16} />,
        completed: false,
        category: 'scheduled'
      },
      {
        id: '2',
        time: '11:00',
        title: 'Review Support Ticket',
        label: 'Support',
        labelColor: '#007bff',
        icon: <FileText size={16} />,
        completed: false,
        category: 'scheduled'
      },
      {
        id: '3',
        time: '2:00',
        title: 'Follow up on Invoice #1023',
        label: 'Finance',
        labelColor: '#fd7e14',
        icon: <CreditCard size={16} />,
        completed: false,
        category: 'scheduled'
      },
      {
        id: '4',
        title: 'Prepare Meeting Agenda',
        label: 'General',
        labelColor: '#6c757d',
        icon: <FileText size={16} />,
        completed: false,
        category: 'anytime'
      },
      {
        id: '5',
        title: 'Pick up dry cleaning',
        label: 'Meeting',
        labelColor: '#17a2b8',
        icon: <Calendar size={16} />,
        completed: false,
        category: 'anytime'
      },
      {
        id: '6',
        title: 'Research new software tools',
        label: 'Work',
        labelColor: '#28a745',
        icon: <Briefcase size={16} />,
        completed: false,
        category: 'anytime'
      },
      {
        id: '7',
        title: 'Send report to client',
        label: 'Report',
        labelColor: '#dc3545',
        icon: <Mail size={16} />,
        completed: false,
        category: 'overdue'
      },
      {
        id: '8',
        title: 'Buy office supplies',
        label: 'Errands',
        labelColor: '#dc3545',
        icon: <CreditCard size={16} />,
        completed: false,
        category: 'overdue'
      }
    ]);
  
    const linkedRecords: LinkedRecord[] = [
      {
        id: '1',
        type: 'call',
        title: 'Call with Ahmad',
        subtitle: 'Today, 9:00 AM',
        icon: <Phone size={18} />
      },
      {
        id: '2',
        type: 'contact',
        title: 'Ahmad Hasan',
        subtitle: 'Lead',
        icon: <User size={18} />
      },
      {
        id: '3',
        type: 'ticket',
        title: 'Support Ticket #2145',
        subtitle: 'Website Redesign',
        icon: <Pencil size={18} />
      }
    ];
  
    const handleTaskToggle = (taskId: string) => {
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, completed: !task.completed } : task
      ));
    };
  
    const handleTaskClick = (task: Task) => {
      setSelectedTask(task);
    };
  
    const getTaskCounts = () => {
      const today = tasks.filter(t => t.category === 'scheduled' || t.category === 'anytime').length;
      const completed = tasks.filter(t => t.completed).length;
      const overdue = tasks.filter(t => t.category === 'overdue').length;
      const upcoming = 7;
      return { today, completed, overdue, upcoming };
    };
  
    const counts = getTaskCounts();
  
    const filteredTasks = tasks.filter(task => {
      if (activeTab === 'completed') return task.completed;
      if (activeTab === 'overdue') return task.category === 'overdue' && !task.completed;
      if (activeTab === 'today') return task.category === 'scheduled' || task.category === 'anytime' || task.category === 'overdue';
      return true;
    });
  
    const scheduledTasks = filteredTasks.filter(t => t.category === 'scheduled');
    const anytimeTasks = filteredTasks.filter(t => t.category === 'anytime');
    const overdueTasks = filteredTasks.filter(t => t.category === 'overdue');
  

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Customer Dashboard" />


      {/* Main Container */}
      <div style={{ 
        
      }}>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {/* Left Panel */}
          <div style={{ flex: '1', minWidth: '320px' }}>
            {/* Action Buttons */}
            <div style={{ 
              display: 'flex', 
              gap: '10px', 
              marginBottom: '16px',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => setShowAddTask(true)}
                style={{
                  backgroundColor: '#5b8fd8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '9px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  boxShadow: '0 2px 4px rgba(91,143,216,0.3)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#4a7dc0';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(91,143,216,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#5b8fd8';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(91,143,216,0.3)';
                }}
              >
                <Plus size={16} /> Add To-Do
              </button>
              <button
                onClick={() => setActiveTab('today')}
                style={{
                  backgroundColor: activeTab === 'today' ? '#5b8fd8' : 'white',
                  color: activeTab === 'today' ? 'white' : '#4a5568',
                  border: activeTab === 'today' ? 'none' : '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '8px 14px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{
                  display: 'inline-block',
                  backgroundColor: activeTab === 'today' ? 'rgba(255,255,255,0.9)' : '#5b8fd8',
                  color: activeTab === 'today' ? '#5b8fd8' : 'white',
                  borderRadius: '50%',
                  width: '22px',
                  height: '22px',
                  lineHeight: '22px',
                  textAlign: 'center',
                  fontSize: '11px',
                  fontWeight: '700'
                }}>
                  {counts.today}
                </span>
                Today
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                style={{
                  backgroundColor: activeTab === 'completed' ? '#5b8fd8' : 'white',
                  color: activeTab === 'completed' ? 'white' : '#4a5568',
                  border: activeTab === 'completed' ? 'none' : '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '8px 14px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{
                  display: 'inline-block',
                  backgroundColor: activeTab === 'completed' ? 'rgba(255,255,255,0.9)' : '#28a745',
                  color: activeTab === 'completed' ? '#28a745' : 'white',
                  borderRadius: '50%',
                  width: '22px',
                  height: '22px',
                  lineHeight: '22px',
                  textAlign: 'center',
                  fontSize: '11px',
                  fontWeight: '700'
                }}>
                  {counts.completed}
                </span>
                Completed
              </button>
              <button
                onClick={() => setActiveTab('overdue')}
                style={{
                  backgroundColor: activeTab === 'overdue' ? '#5b8fd8' : 'white',
                  color: activeTab === 'overdue' ? 'white' : '#4a5568',
                  border: activeTab === 'overdue' ? 'none' : '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '8px 14px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{
                  display: 'inline-block',
                  backgroundColor: activeTab === 'overdue' ? 'rgba(255,255,255,0.9)' : '#dc3545',
                  color: activeTab === 'overdue' ? '#dc3545' : 'white',
                  borderRadius: '50%',
                  width: '22px',
                  height: '22px',
                  lineHeight: '22px',
                  textAlign: 'center',
                  fontSize: '11px',
                  fontWeight: '700'
                }}>
                  {counts.overdue}
                </span>
                Overdue
              </button>
              <button
                onClick={() => setActiveTab('upcoming')}
                style={{
                  backgroundColor: activeTab === 'upcoming' ? '#5b8fd8' : 'white',
                  color: activeTab === 'upcoming' ? 'white' : '#4a5568',
                  border: activeTab === 'upcoming' ? 'none' : '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '8px 14px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{
                  display: 'inline-block',
                  backgroundColor: activeTab === 'upcoming' ? 'rgba(255,255,255,0.9)' : '#6c757d',
                  color: activeTab === 'upcoming' ? '#6c757d' : 'white',
                  borderRadius: '50%',
                  width: '22px',
                  height: '22px',
                  lineHeight: '22px',
                  textAlign: 'center',
                  fontSize: '11px',
                  fontWeight: '700'
                }}>
                  {counts.upcoming}
                </span>
                Upcoming
                <ChevronDown size={14} />
              </button>
            </div>

            {/* Task Container */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              border: '1px solid #e8eef5'
            }}>
              {/* Filters */}
              <div style={{ 
                display: 'flex', 
                gap: '10px', 
                marginBottom: '16px',
                flexWrap: 'wrap',
                alignItems: 'center',
                paddingBottom: '14px',
                borderBottom: '1px solid #f0f4f8'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={16} color="#6c757d" />
                  <select
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    style={{
                      padding: '7px 28px 7px 10px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      backgroundColor: 'white',
                      color: '#4a5568'
                    }}
                  >
                    <option value="today">Today</option>
                    <option value="tomorrow">Tomorrow</option>
                    <option value="this-week">This Week</option>
                    <option value="next-week">Next Week</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Tag size={16} color="#6c757d" />
                  <select
                    value={filterLabel}
                    onChange={(e) => setFilterLabel(e.target.value)}
                    style={{
                      padding: '7px 28px 7px 10px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      backgroundColor: 'white',
                      color: '#4a5568'
                    }}
                  >
                    <option value="all">All Labels</option>
                    <option value="sales">Sales</option>
                    <option value="support">Support</option>
                    <option value="work">Work</option>
                    <option value="meeting">Meeting</option>
                  </select>
                </div>

                <button style={{
                  padding: '7px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <X size={16} color="#6c757d" />
                </button>
              </div>

              {/* Quick Add */}
              <div style={{ marginBottom: '18px', position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <Sparkles size={16} color="#a0aec0" />
                </div>
                <input
                  type="text"
                  placeholder="Add a new task and press Enter..."
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 38px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '13px',
                    backgroundColor: '#f8fafc',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.borderColor = '#5b8fd8';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                />
              </div>

              {/* Scheduled Tasks */}
              {scheduledTasks.length > 0 && (
                <div style={{ marginBottom: '18px' }}>
                  <h4 style={{ 
                    fontSize: '12px', 
                    fontWeight: '700',
                    color: '#3182ce',
                    marginBottom: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Clock size={14} color="#3182ce" /> Scheduled
                  </h4>
                  {scheduledTasks.map(task => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={handleTaskToggle}
                      onClick={handleTaskClick}
                      isSelected={selectedTask?.id === task.id}
                    />
                  ))}
                </div>
              )}

              {/* Anytime Tasks */}
              {anytimeTasks.length > 0 && (
                <div style={{ marginBottom: '18px' }}>
                  <h4 style={{ 
                    fontSize: '12px', 
                    fontWeight: '700',
                    color: '#805ad5',
                    marginBottom: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Pin size={14} color="#805ad5" /> Anytime
                  </h4>
                  {anytimeTasks.map(task => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={handleTaskToggle}
                      onClick={handleTaskClick}
                      isSelected={selectedTask?.id === task.id}
                    />
                  ))}
                </div>
              )}

              {/* Overdue Tasks */}
              {overdueTasks.length > 0 && (
                <div>
                  <h4 style={{ 
                    fontSize: '12px', 
                    fontWeight: '700',
                    color: '#e53e3e',
                    marginBottom: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <AlertCircle size={14} color="#e53e3e" /> Overdue
                  </h4>
                  {overdueTasks.map(task => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={handleTaskToggle}
                      onClick={handleTaskClick}
                      isSelected={selectedTask?.id === task.id}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Task Details or Stats */}
          <div style={{ 
            width: '360px',
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #e8eef5',
            alignSelf: 'flex-start',
            position: 'sticky',
            top: '20px'
          }}>
            {!selectedTask ? (
              /* Default Stats View */
              <>
                <div style={{ marginBottom: '20px' }}>
                  <h2 style={{ 
                    fontSize: '18px', 
                    fontWeight: '700',
                    margin: '0 0 6px 0',
                    color: '#2d3748',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <FileText size={20} color="#4e6fa5" />
                    Task Overview
                  </h2>
                  <p style={{ 
                    color: '#718096', 
                    fontSize: '13px',
                    margin: 0
                  }}>
                    Track your daily progress
                  </p>
                </div>

                {/* Stats Cards */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{
                    padding: '16px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    marginBottom: '10px',
                    border: '1px solid #e8eef5'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#718096', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Total Tasks
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: '700', color: '#2d3748', marginTop: '4px' }}>
                          {tasks.length}
                        </div>
                      </div>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: '#4e6fa5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                      }}>
                        <FileText size={24} />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div style={{
                      padding: '14px',
                      backgroundColor: '#f0fdf4',
                      borderRadius: '8px',
                      border: '1px solid #d1fae5'
                    }}>
                      <div style={{ fontSize: '10px', color: '#166534', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                        Completed
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#15803d' }}>
                        {tasks.filter(t => t.completed).length}
                      </div>
                    </div>

                    <div style={{
                      padding: '14px',
                      backgroundColor: '#fef2f2',
                      borderRadius: '8px',
                      border: '1px solid #fecaca'
                    }}>
                      <div style={{ fontSize: '10px', color: '#991b1b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                        Overdue
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#dc2626' }}>
                        {tasks.filter(t => t.category === 'overdue' && !t.completed).length}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    padding: '14px',
                    backgroundColor: '#eff6ff',
                    borderRadius: '8px',
                    border: '1px solid #bfdbfe'
                  }}>
                    <div style={{ fontSize: '10px', color: '#1e40af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                      Pending Today
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#2563eb' }}>
                      {tasks.filter(t => !t.completed && (t.category === 'scheduled' || t.category === 'anytime')).length}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#2d3748' }}>Progress</span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#4e6fa5' }}>
                      {tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0}%
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#e8eef5',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${tasks.length > 0 ? (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0}%`,
                      height: '100%',
                      backgroundColor: '#28a745',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>

                {/* Category Breakdown */}
                <div>
                  <h3 style={{ 
                    fontSize: '13px', 
                    fontWeight: '700',
                    marginBottom: '12px',
                    color: '#2d3748',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    By Category
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e8eef5' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={16} color="#3182ce" />
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#2d3748' }}>Scheduled</span>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#3182ce' }}>
                        {tasks.filter(t => t.category === 'scheduled').length}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e8eef5' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Pin size={16} color="#805ad5" />
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#2d3748' }}>Anytime</span>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#805ad5' }}>
                        {tasks.filter(t => t.category === 'anytime').length}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e8eef5' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertCircle size={16} color="#e53e3e" />
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#2d3748' }}>Overdue</span>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#e53e3e' }}>
                        {tasks.filter(t => t.category === 'overdue').length}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Task Details View */
              <>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '16px'
                }}>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ 
                      fontSize: '18px', 
                      fontWeight: '700',
                      margin: '0 0 10px 0',
                      color: '#2d3748',
                      lineHeight: '1.3'
                    }}>
                      {selectedTask.title}
                    </h2>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      backgroundColor: selectedTask.completed ? '#e2e8f0' : '#d4edda',
                      color: selectedTask.completed ? '#4a5568' : '#155724',
                      borderRadius: '5px',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}>
                      {selectedTask.completed ? 'COMPLETED' : 'OPEN'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button 
                      onClick={() => setSelectedTask(null)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        color: '#718096',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <X size={18} />
                    </button>
                    <button style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px'
                    }}>
                      <MoreVertical size={18} color="#718096" />
                    </button>
                  </div>
                </div>

              <p style={{ 
                color: '#718096', 
                fontSize: '13px',
                marginBottom: '18px',
                lineHeight: '1.5'
              }}>
                Discuss new leads and targets.
              </p>

              <div style={{ 
                marginBottom: '18px',
                padding: '14px',
                backgroundColor: '#f8fafc',
                borderRadius: '6px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  fontSize: '13px'
                }}>
                  <span style={{ color: '#718096', fontWeight: '500' }}>Due Time:</span>
                  <span style={{ fontWeight: '600', color: '#2d3748' }}>9:00 AM</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  fontSize: '13px'
                }}>
                  <span style={{ color: '#718096', fontWeight: '500' }}>Reminder:</span>
                  <span style={{ color: '#2d3748' }}>15 min before</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '13px'
                }}>
                  <span style={{ color: '#718096', fontWeight: '500' }}>Label:</span>
                  <span style={{
                    padding: '3px 10px',
                    backgroundColor: '#d4edda',
                    color: '#155724',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
                    SALES
                  </span>
                </div>
              </div>

              <div style={{ 
                marginTop: '20px',
                marginBottom: '20px'
              }}>
                <h3 style={{ 
                  fontSize: '13px', 
                  fontWeight: '700',
                  marginBottom: '12px',
                  color: '#2d3748',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <LinkIcon size={14} /> Linked Records
                </h3>
                {linkedRecords.map(record => (
                  <div
                    key={record.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '6px',
                      marginBottom: '6px',
                      cursor: 'pointer',
                      border: '1px solid #e8eef5',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#edf2f7';
                      e.currentTarget.style.borderColor = '#cbd5e0';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                      e.currentTarget.style.borderColor = '#e8eef5';
                    }}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: '#4e6fa5',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}>
                      {record.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontWeight: '600', 
                        fontSize: '13px',
                        color: '#2d3748'
                      }}>
                        {record.title}
                      </div>
                      <div style={{ 
                        fontSize: '11px', 
                        color: '#718096'
                      }}>
                        {record.subtitle}
                      </div>
                    </div>
                    <button style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px'
                    }}>
                      <MoreVertical size={16} color="#718096" />
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ 
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                marginBottom: '8px'
              }}>
                <button 
                  onClick={() => setShowConvertModal(true)}
                  style={{
                    padding: '10px',
                    backgroundColor: '#4e6fa5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3d5a87'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4e6fa5'}
                >
                  Convert to Task
                </button>
                <button style={{
                  padding: '10px',
                  backgroundColor: 'white',
                  color: '#4a5568',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  <LinkIcon size={14} />
                  Link Record
                </button>
              </div>

              <div style={{ 
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px'
              }}>
                <button style={{
                  padding: '10px',
                  backgroundColor: 'white',
                  color: '#4a5568',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  <Copy size={14} />
                  Duplicate
                </button>
                <button style={{
                  padding: '10px',
                  backgroundColor: 'white',
                  color: '#e53e3e',
                  border: '1px solid #feb2b2',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#fff5f5';
                  e.currentTarget.style.borderColor = '#fc8181';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.borderColor = '#feb2b2';
                }}
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </>
            )}
          </div>
        </div>
      </div>

      {/* Convert to Task Modal */}
      <ConvertToTaskModal
        show={showConvertModal}
        onHide={() => setShowConvertModal(false)}
        onConvert={(data) => {
          console.log('Task converted:', data);
          // Handle task conversion logic here
        }}
        onConvertAndOpen={(data) => {
          console.log('Task converted and opening:', data);
          // Handle task conversion and open logic here
        }}
      />

    </React.Fragment>
  );
};

DialTodo.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

// Task Item Component
interface TaskItemProps {
    task: Task;
    onToggle: (id: string) => void;
    onClick: (task: Task) => void;
    isSelected: boolean;
  }
  
  const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onClick, isSelected }) => {
    return (
      <div
        onClick={() => onClick(task)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px',
          backgroundColor: isSelected ? '#edf6ff' : (task.completed ? '#f8fafb' : 'transparent'),
          borderRadius: '6px',
          marginBottom: '6px',
          cursor: 'pointer',
          border: isSelected ? '1px solid #5b8fd8' : '1px solid #f0f4f8',
          transition: 'all 0.15s',
          opacity: task.completed ? 0.6 : 1
        }}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = task.completed ? '#f0f4f8' : '#f8fafc';
            e.currentTarget.style.borderColor = '#e2e8f0';
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = task.completed ? '#f8fafb' : 'transparent';
            e.currentTarget.style.borderColor = '#f0f4f8';
          }
        }}
      >
        <input
          type="checkbox"
          checked={task.completed}
          onChange={(e) => {
            e.stopPropagation();
            onToggle(task.id);
          }}
          style={{
            width: '16px',
            height: '16px',
            cursor: 'pointer',
            accentColor: '#5b8fd8'
          }}
        />
        {task.time && (
          <span style={{ 
            fontWeight: '700',
            fontSize: '13px',
            minWidth: '45px',
            color: task.completed ? '#a0aec0' : '#2d3748',
            textDecoration: task.completed ? 'line-through' : 'none'
          }}>
            {task.time}
          </span>
        )}
        <span style={{ 
          flex: 1,
          fontSize: '13px',
          textDecoration: task.completed ? 'line-through' : 'none',
          color: task.completed ? '#a0aec0' : '#2d3748',
          fontWeight: '500'
        }}>
          {task.title}
        </span>
        <span style={{
          padding: '3px 8px',
          backgroundColor: task.completed ? '#e2e8f0' : task.labelColor,
          color: task.completed ? '#718096' : 'white',
          borderRadius: '4px',
          fontSize: '10px',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          textTransform: 'uppercase',
          letterSpacing: '0.3px'
        }}>
          {task.icon}
          {task.label}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
          }}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            opacity: 0.6,
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
        >
          <MoreVertical size={16} color="#718096" />
        </button>
      </div>
    );
  };
  
export default DialTodo;

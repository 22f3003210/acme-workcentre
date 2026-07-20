import React, { useState } from "react";
import { useApp } from "../context/AppContext";

export default function ClientView({ activeTab }) {
  const { 
    projects, 
    phases, 
    tasks, 
    clientVisits, 
    designs, 
    chats, 
    currentUser, 
    updateTaskStatus,
    updateDesignStatus,
    addDesignComment,
    sendChatMessage,
    settings
  } = useApp();

  const [selectedDesign, setSelectedDesign] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [chatInput, setChatInput] = useState("");

  // Get active project for logged-in client
  const project = projects.find(p => p.clientUserId === currentUser.id);

  if (!project) {
    return (
      <div className="empty-state-card glass-card">
        <h3>Welcome, {currentUser.name}</h3>
        <p>No active business development project was found for your account. Please contact ACME Admin.</p>
      </div>
    );
  }

  // Filter items for this project
  const projectTasks = tasks.filter(t => t.projectId === project.id);
  const projectVisits = clientVisits.filter(v => v.projectId === project.id);
  const projectDesigns = designs.filter(d => d.projectId === project.id);
  const projectChats = chats.filter(c => c.projectId === project.id);

  // Active Phase calculation
  const activePhaseObj = phases.find(p => p.id === project.currentPhase);

  // Send feedback on design
  const handleAddComment = (designId) => {
    if (!commentText.trim()) return;
    addDesignComment(designId, commentText, currentUser.name);
    setCommentText("");
  };

  // Send message to consultant
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage(project.id, chatInput, currentUser.name, "Client");
    setChatInput("");
  };

  return (
    <div className="client-view-container">
      {/* Top Welcome Bar */}
      <div className="dashboard-header glass-card">
        <div>
          <span className="gold-text uppercase-tracking">Jewelry Business Development Portal</span>
          <h1>{project.name}</h1>
          <p className="subtitle">Client: <strong>{currentUser.company}</strong> ({currentUser.businessType})</p>
        </div>
        <div className="status-kpis">
          <div className="kpi-box">
            <span className="kpi-label">Progress</span>
            <span className="kpi-value gold-text">{project.completionPercentage}%</span>
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${project.completionPercentage}%` }}></div>
            </div>
          </div>
          <div className="kpi-box">
            <span className="kpi-label">Active Phase</span>
            <span className="kpi-value">Phase {project.currentPhase}</span>
            <span className="kpi-subtext">{activePhaseObj?.name}</span>
          </div>
        </div>
      </div>

      {activeTab === "dashboard" && (
        <div className="client-grid">
          {/* 9-Phase Timeline Widget */}
          <div className="client-card glass-card span-2">
            <h3>Methodology Roadmap</h3>
            <p className="subtitle">Your 9-phase path to luxury brand operations</p>
            <div className="timeline-horizontal">
              {phases.map((ph) => {
                const isActive = ph.id === project.currentPhase;
                const isCompleted = ph.id < project.currentPhase;
                return (
                  <div 
                    key={ph.id} 
                    className={`timeline-step ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}
                  >
                    <div className="step-circle">{isCompleted ? "✓" : ph.id}</div>
                    <span className="step-name">{ph.name}</span>
                  </div>
                );
              })}
            </div>
            <div className="active-phase-detail-box">
              <div className="phase-badge">Active: Phase {activePhaseObj?.id}</div>
              <h4>{activePhaseObj?.name}</h4>
              <p>{activePhaseObj?.desc}</p>
            </div>
          </div>

          {/* Sourcing Rates widget */}
          <div className="client-card glass-card">
            <h3>Metal Market Indices</h3>
            <p className="subtitle">Active reference rates per gram</p>
            <div className="metal-rates-list">
              <div className="metal-rate-item">
                <span className="metal-name">✨ Fine Gold (24K)</span>
                <span className="metal-price">${settings.goldPricePerGram.toFixed(2)} /g</span>
              </div>
              <div className="metal-rate-item">
                <span className="metal-name">💿 Pure Platinum</span>
                <span className="metal-price">${settings.platinumPricePerGram.toFixed(2)} /g</span>
              </div>
            </div>
            <div className="rate-info-footer">
              <p>Used to estimate alloy casting formulations & material scrap balance ratios during Phase 3 & 4 audits.</p>
            </div>
          </div>

          {/* Quick Tasks Summary */}
          <div className="client-card glass-card">
            <h3>Your Pending Actions</h3>
            <div className="mini-task-list">
              {projectTasks.filter(t => t.category === "Client" && t.status !== "Completed").slice(0, 3).map(t => (
                <div key={t.id} className="mini-task-item">
                  <span className="mini-task-bullet">✦</span>
                  <div className="mini-task-content">
                    <p className="mini-task-title">{t.title}</p>
                    <span className="mini-task-phase">Phase {t.phaseId}</span>
                  </div>
                </div>
              ))}
              {projectTasks.filter(t => t.category === "Client" && t.status !== "Completed").length === 0 && (
                <p className="empty-message">No pending actions. You're all caught up!</p>
              )}
            </div>
          </div>

          {/* Next Visit widget */}
          <div className="client-card glass-card">
            <h3>Next Audit Site Visit</h3>
            {projectVisits.length > 0 ? (
              <div className="visit-alert-box">
                <div className="visit-date-badge">
                  <span className="visit-month">JUL</span>
                  <span className="visit-day">{projectVisits[0].date.split("-")[2]}</span>
                </div>
                <div className="visit-alert-details">
                  <h4>{projectVisits[0].title}</h4>
                  <p>📍 {projectVisits[0].location}</p>
                  <p>⏰ {projectVisits[0].time}</p>
                </div>
              </div>
            ) : (
              <p className="empty-message">No visits scheduled.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "tasks" && (
        <div className="client-grid">
          {/* Client-Side Tasks */}
          <div className="client-card glass-card">
            <h3 className="section-title">My Action Checklist</h3>
            <p className="subtitle">Complete these tasks to advance the project</p>
            <div className="checklist-container">
              {projectTasks.filter(t => t.category === "Client").map((t) => (
                <div key={t.id} className={`checklist-item ${t.status === "Completed" ? "checked" : ""}`}>
                  <label className="checkbox-wrapper">
                    <input 
                      type="checkbox" 
                      checked={t.status === "Completed"} 
                      onChange={(e) => updateTaskStatus(t.id, e.target.checked ? "Completed" : "Todo")}
                    />
                    <span className="checkbox-custom"></span>
                  </label>
                  <div className="checklist-content">
                    <div className="checklist-header">
                      <span className="checklist-title">{t.title}</span>
                      <span className="phase-tag">Phase {t.phaseId}</span>
                    </div>
                    <p className="checklist-desc">{t.desc}</p>
                  </div>
                </div>
              ))}
              {projectTasks.filter(t => t.category === "Client").length === 0 && (
                <p className="empty-message">No client-side tasks assigned.</p>
              )}
            </div>
          </div>

          {/* Consultant Audit Tracker (Read-only) */}
          <div className="client-card glass-card">
            <h3 className="section-title">ACME Consulting Activities</h3>
            <p className="subtitle">Real-time status of internal audit and strategy deliverables</p>
            <div className="consultant-tracker-list">
              {projectTasks.filter(t => t.category === "Internal").map((t) => (
                <div key={t.id} className="tracker-item">
                  <div className="tracker-header">
                    <span className={`status-dot ${t.status.toLowerCase().replace(" ", "-")}`}></span>
                    <span className="tracker-title">{t.title}</span>
                    <span className="phase-tag">Phase {t.phaseId}</span>
                  </div>
                  <p className="tracker-desc">{t.desc}</p>
                  <div className="tracker-meta">
                    <span className="tracker-status-label">{t.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "gallery" && (
        <div className="gallery-section">
          <div className="section-header-box">
            <h2>Jewelry CAD & Design Board</h2>
            <p>Review active drafts, dimensions, metals configurations, and sign-off on production prototypes.</p>
          </div>
          
          <div className="design-grid">
            {projectDesigns.map((design) => (
              <div 
                key={design.id} 
                className="design-card glass-card cursor-pointer"
                onClick={() => setSelectedDesign(design)}
              >
                <div className="design-img-container">
                  <img src={design.image} alt={design.title} />
                  <span className={`design-badge ${design.status.toLowerCase().replace(" ", "-")}`}>
                    {design.status}
                  </span>
                </div>
                <div className="design-card-content">
                  <div className="design-card-header">
                    <h4>{design.title}</h4>
                    <span className="version-label">{design.version}</span>
                  </div>
                  <p className="metal-desc">💍 {design.specs.metal}</p>
                  <p className="gem-desc">💎 {design.specs.gem}</p>
                  <div className="comment-count">
                    💬 {design.comments.length} feedback threads
                  </div>
                </div>
              </div>
            ))}
            {projectDesigns.length === 0 && (
              <div className="empty-state-card glass-card span-3">
                <p>No CAD sketches uploaded for review yet. Your consultant will post designs soon.</p>
              </div>
            )}
          </div>

          {/* Design Detail Modal */}
          {selectedDesign && (
            <div className="modal-backdrop" onClick={() => setSelectedDesign(null)}>
              <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={() => setSelectedDesign(null)}>×</button>
                
                <div className="modal-grid">
                  <div className="modal-img-pane">
                    <img src={selectedDesign.image} alt={selectedDesign.title} />
                  </div>
                  
                  <div className="modal-info-pane">
                    <div className="modal-pane-header">
                      <span className="version-label">{selectedDesign.version}</span>
                      <h2>{selectedDesign.title}</h2>
                      <span className={`design-badge ${selectedDesign.status.toLowerCase().replace(" ", "-")}`}>
                        {selectedDesign.status}
                      </span>
                    </div>

                    <div className="specs-box">
                      <h4>Technical Specifications</h4>
                      <ul>
                        <li><strong>Metal:</strong> {selectedDesign.specs.metal}</li>
                        <li><strong>Gem:</strong> {selectedDesign.specs.gem}</li>
                        <li><strong>Width:</strong> {selectedDesign.specs.width}</li>
                        <li><strong>Est. Weight:</strong> {selectedDesign.specs.weight}</li>
                      </ul>
                    </div>

                    <div className="approval-actions-box">
                      <h4>Approval Actions</h4>
                      <div className="action-button-group">
                        <button 
                          className="luxury-button approve"
                          onClick={() => {
                            updateDesignStatus(selectedDesign.id, "Approved");
                            setSelectedDesign(prev => ({ ...prev, status: "Approved" }));
                          }}
                        >
                          ✓ Approve Design
                        </button>
                        <button 
                          className="luxury-button revise"
                          onClick={() => {
                            updateDesignStatus(selectedDesign.id, "Changes Requested");
                            setSelectedDesign(prev => ({ ...prev, status: "Changes Requested" }));
                          }}
                        >
                          ⚠ Request Revisions
                        </button>
                      </div>
                    </div>

                    <div className="comments-pane">
                      <h4>Feedback History ({selectedDesign.comments.length})</h4>
                      <div className="comments-list">
                        {selectedDesign.comments.map((c, i) => (
                          <div key={i} className="comment-item">
                            <div className="comment-meta">
                              <span className="comment-sender">{c.sender}</span>
                              <span className="comment-date">
                                {new Date(c.date).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="comment-text">{c.text}</p>
                          </div>
                        ))}
                        {selectedDesign.comments.length === 0 && (
                          <p className="empty-message">No feedback posted yet.</p>
                        )}
                      </div>

                      <div className="comment-input-box">
                        <textarea
                          placeholder="Type design corrections, stone change requests..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                        />
                        <button 
                          className="luxury-button small"
                          onClick={() => handleAddComment(selectedDesign.id)}
                        >
                          Submit Comment
                        </button>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "calendar" && (
        <div className="calendar-section glass-card">
          <h3>Upcoming On-Site Audits & Reviews</h3>
          <p className="subtitle">Scheduled visits for ACME consultants at your workshops or stores</p>
          
          <div className="visits-list">
            {projectVisits.map((v) => (
              <div key={v.id} className="visit-card">
                <div className="visit-main-details">
                  <div className="visit-calendar-badge">
                    <span className="v-month">JUL</span>
                    <span className="v-day">{v.date.split("-")[2]}</span>
                  </div>
                  <div className="visit-text-details">
                    <h4>{v.title}</h4>
                    <p className="visit-time">⏰ {v.time} • 📍 {v.location}</p>
                    <p className="visit-purpose"><strong>Purpose:</strong> {v.purpose}</p>
                  </div>
                </div>
                {v.notes && (
                  <div className="visit-notes">
                    <strong>Pre-visit notes:</strong> {v.notes}
                  </div>
                )}
              </div>
            ))}
            {projectVisits.length === 0 && (
              <div className="empty-state-card">
                <p>No site audits or check-ins are scheduled at this time.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "chat" && (
        <div className="chat-section glass-card">
          <div className="chat-pane-header">
            <h3>Direct Sourcing & Settle Chat</h3>
            <p>Communicate directly with your lead consultant regarding daily task execution.</p>
          </div>
          
          <div className="chat-messages-container">
            {projectChats.map((c) => (
              <div 
                key={c.id} 
                className={`chat-message-bubble ${c.senderRole === "Client" ? "outgoing" : "incoming"}`}
              >
                <div className="message-meta">
                  <strong>{c.sender}</strong> ({c.senderRole}) • {new Date(c.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
                <div className="message-body">{c.text}</div>
              </div>
            ))}
            {projectChats.length === 0 && (
              <p className="empty-message text-center">No chat messages yet. Introduce yourself to start!</p>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="chat-input-form">
            <input 
              type="text" 
              placeholder="Send message to your consulting team..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="chat-input"
            />
            <button type="submit" className="chat-send-btn">Send Message</button>
          </form>
        </div>
      )}
    </div>
  );
}

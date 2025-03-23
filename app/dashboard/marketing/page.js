"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./marketing.module.css";

export default function MarketingDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [attribution, setAttribution] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [timeframe, setTimeframe] = useState(30);
  const [error, setError] = useState(null);

  // Fetch data on component mount
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // In a real implementation, these would be API calls
        // For now, we'll use mock data
        const mockAttribution = getMockAttributionData();
        const mockSuggestions = getMockSuggestions();
        const mockCampaigns = getMockCampaigns();
        
        setAttribution(mockAttribution);
        setSuggestions(mockSuggestions);
        setCampaigns(mockCampaigns);
        setError(null);
      } catch (err) {
        console.error("Error fetching marketing data:", err);
        setError("Failed to load marketing data. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [timeframe]);

  // Handle timeframe change
  const handleTimeframeChange = (days) => {
    setTimeframe(days);
  };

  // Handle campaign creation
  const handleCreateCampaign = (suggestion) => {
    // In a real implementation, this would call an API
    alert(`Campaign created for ${suggestion.source} with message: ${suggestion.message}`);
  };

  return (
    <div className={styles.marketingPage}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Marketing Dashboard</h1>
        <p className={styles.slogan}>Texting that works as hard as you do.</p>
        
        <div className={styles.timeframeSelector}>
          <button 
            className={`${styles.timeframeButton} ${timeframe === 7 ? styles.active : ''}`}
            onClick={() => handleTimeframeChange(7)}
          >
            7 Days
          </button>
          <button 
            className={`${styles.timeframeButton} ${timeframe === 30 ? styles.active : ''}`}
            onClick={() => handleTimeframeChange(30)}
          >
            30 Days
          </button>
          <button 
            className={`${styles.timeframeButton} ${timeframe === 90 ? styles.active : ''}`}
            onClick={() => handleTimeframeChange(90)}
          >
            90 Days
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className={styles.loadingContainer}>
          <p>Loading marketing data...</p>
        </div>
      ) : error ? (
        <div className={styles.errorContainer}>
          <p>{error}</p>
          <button 
            className={styles.retryButton}
            onClick={() => handleTimeframeChange(timeframe)}
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Source Attribution Section */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Lead Source Attribution</h2>
              <p>See which channels are driving your missed calls and leads</p>
            </div>
            
            <div className={styles.attributionGrid}>
              {attribution && Object.entries(attribution.bySource).map(([source, data]) => (
                <div key={source} className={styles.attributionCard}>
                  <div className={styles.sourceIcon}>
                    {getSourceIcon(source)}
                  </div>
                  <div className={styles.sourceInfo}>
                    <h3>{formatSourceName(source)}</h3>
                    <div className={styles.sourceStats}>
                      <div className={styles.statItem}>
                        <p className={styles.statValue}>{data.count}</p>
                        <p className={styles.statLabel}>Leads</p>
                      </div>
                      <div className={styles.statItem}>
                        <p className={styles.statValue}>{data.converted}</p>
                        <p className={styles.statLabel}>Converted</p>
                      </div>
                      <div className={styles.statItem}>
                        <p className={styles.statValue}>{data.conversionRate.toFixed(1)}%</p>
                        <p className={styles.statLabel}>Rate</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
          
          {/* Campaign Suggestions Section */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Campaign Suggestions</h2>
              <p>Smart recommendations based on your lead patterns</p>
            </div>
            
            {suggestions.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No campaign suggestions available at this time.</p>
                <p>Check back later as more lead data is collected.</p>
              </div>
            ) : (
              <div className={styles.suggestionsGrid}>
                {suggestions.map((suggestion, index) => (
                  <div key={index} className={styles.suggestionCard}>
                    <div className={styles.suggestionHeader}>
                      <h3>{formatSourceName(suggestion.source)} Follow-up</h3>
                      <span className={styles.leadCount}>{suggestion.leadCount} leads</span>
                    </div>
                    <p className={styles.suggestionReason}>{suggestion.reason}</p>
                    <div className={styles.messagePreview}>
                      <p className={styles.previewLabel}>Suggested Message:</p>
                      <p className={styles.previewText}>{suggestion.message}</p>
                    </div>
                    <button 
                      className={styles.createButton}
                      onClick={() => handleCreateCampaign(suggestion)}
                    >
                      Create Campaign
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
          
          {/* Recent Campaigns Section */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Recent Campaigns</h2>
              <p>Your recent SMS marketing campaigns</p>
            </div>
            
            {campaigns.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No campaigns have been created yet.</p>
                <p>Use the suggestions above to create your first campaign.</p>
              </div>
            ) : (
              <div className={styles.campaignsTable}>
                <div className={styles.tableHeader}>
                  <div className={styles.tableCell}>Campaign</div>
                  <div className={styles.tableCell}>Source</div>
                  <div className={styles.tableCell}>Leads</div>
                  <div className={styles.tableCell}>Sent</div>
                  <div className={styles.tableCell}>Responses</div>
                  <div className={styles.tableCell}>Status</div>
                </div>
                
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className={styles.tableRow}>
                    <div className={styles.tableCell}>{campaign.name}</div>
                    <div className={styles.tableCell}>{formatSourceName(campaign.source)}</div>
                    <div className={styles.tableCell}>{campaign.leadCount}</div>
                    <div className={styles.tableCell}>{campaign.sentCount}</div>
                    <div className={styles.tableCell}>{campaign.responseCount}</div>
                    <div className={styles.tableCell}>
                      <span className={`${styles.statusBadge} ${styles[campaign.status]}`}>
                        {formatStatus(campaign.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

// Helper functions for mock data
function getMockAttributionData() {
  return {
    totalLeads: 87,
    bySource: {
      google: {
        count: 42,
        converted: 12,
        conversionRate: 28.6,
      },
      yelp: {
        count: 23,
        converted: 8,
        conversionRate: 34.8,
      },
      facebook: {
        count: 15,
        converted: 3,
        conversionRate: 20.0,
      },
      direct: {
        count: 7,
        converted: 2,
        conversionRate: 28.6,
      },
    },
    conversionRate: 28.7,
  };
}

function getMockSuggestions() {
  return [
    {
      type: 'follow-up',
      source: 'google',
      leadCount: 30,
      conversionRate: 28.6,
      message: "Thanks for calling our business. Would you like to schedule an appointment or have any questions I can answer?",
      reason: "You have 30 leads from Google with only a 28.6% conversion rate.",
    },
    {
      type: 'follow-up',
      source: 'facebook',
      leadCount: 12,
      conversionRate: 20.0,
      message: "We noticed you recently called us from our Facebook page. Would you like more information about our services?",
      reason: "You have 12 leads from Facebook with only a 20.0% conversion rate.",
    },
  ];
}

function getMockCampaigns() {
  return [
    {
      id: 1,
      name: "Google Ads Follow-up",
      source: "google",
      leadCount: 35,
      sentCount: 35,
      responseCount: 12,
      status: "completed",
      createdAt: "2025-03-15T14:30:00Z",
    },
    {
      id: 2,
      name: "Yelp Promotion",
      source: "yelp",
      leadCount: 20,
      sentCount: 20,
      responseCount: 8,
      status: "completed",
      createdAt: "2025-03-10T09:15:00Z",
    },
    {
      id: 3,
      name: "Facebook Leads",
      source: "facebook",
      leadCount: 15,
      sentCount: 0,
      responseCount: 0,
      status: "scheduled",
      createdAt: "2025-03-20T16:45:00Z",
    },
  ];
}

// Helper functions for UI
function formatSourceName(source) {
  const sourceMap = {
    google: "Google",
    yelp: "Yelp",
    facebook: "Facebook",
    instagram: "Instagram",
    website: "Website",
    direct: "Direct",
    referral: "Referral",
    other: "Other",
  };
  
  return sourceMap[source] || source.charAt(0).toUpperCase() + source.slice(1);
}

function formatStatus(status) {
  const statusMap = {
    scheduled: "Scheduled",
    sending: "Sending",
    completed: "Completed",
    failed: "Failed",
  };
  
  return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1);
}

function getSourceIcon(source) {
  switch (source) {
    case 'google':
      return 'G';
    case 'yelp':
      return 'Y';
    case 'facebook':
      return 'F';
    case 'instagram':
      return 'I';
    case 'website':
      return 'W';
    case 'direct':
      return 'D';
    case 'referral':
      return 'R';
    default:
      return '?';
  }
}

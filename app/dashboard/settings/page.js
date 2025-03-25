"use client";

import { useState } from "react";
import styles from "./settings.module.css";
import { useToast } from "@/app/components/Toast";
import AirtableConnectionStatus from "../../components/AirtableConnectionStatus";
import TwilioConnectionStatus from "../../components/TwilioConnectionStatus";
import TwilioNumberSelector from "../../components/TwilioNumberSelector";

export default function SettingsPage() {
  const toast = useToast();
  
  // Sample initial data - in a real app, this would come from the database
  const [businessInfo, setBusinessInfo] = useState({
    name: "Your Business Name",
    phoneNumber: "(555) 123-4567",
    address: "123 Main St, Anytown, CA 12345",
    hours: {
      Monday: "9:00 AM - 5:00 PM",
      Tuesday: "9:00 AM - 5:00 PM",
      Wednesday: "9:00 AM - 5:00 PM",
      Thursday: "9:00 AM - 5:00 PM",
      Friday: "9:00 AM - 5:00 PM",
      Saturday: "10:00 AM - 3:00 PM",
      Sunday: "Closed"
    },
    faqs: [
      {
        question: "What are your hours?",
        answer: "We're open Monday through Friday from 9 AM to 5 PM, Saturday from 10 AM to 3 PM, and closed on Sunday."
      },
      {
        question: "Do you offer delivery?",
        answer: "Yes, we offer delivery within a 5-mile radius. There's a $5 delivery fee for orders under $50."
      }
    ]
  });

  const [newFaq, setNewFaq] = useState({ question: "", answer: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  // Handle input changes for basic info
  const handleInfoChange = (e) => {
    const { name, value } = e.target;
    setBusinessInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle changes to business hours
  const handleHoursChange = (day, value) => {
    setBusinessInfo(prev => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: value
      }
    }));
  };

  // Handle changes to FAQs
  const handleFaqChange = (index, field, value) => {
    const updatedFaqs = [...businessInfo.faqs];
    updatedFaqs[index] = {
      ...updatedFaqs[index],
      [field]: value
    };
    
    setBusinessInfo(prev => ({
      ...prev,
      faqs: updatedFaqs
    }));
  };

  // Add a new FAQ
  const handleAddFaq = () => {
    if (newFaq.question.trim() === "" || newFaq.answer.trim() === "") {
      return;
    }
    
    setBusinessInfo(prev => ({
      ...prev,
      faqs: [...prev.faqs, newFaq]
    }));
    
    setNewFaq({ question: "", answer: "" });
  };

  // Remove an FAQ
  const handleRemoveFaq = (index) => {
    const updatedFaqs = businessInfo.faqs.filter((_, i) => i !== index);
    
    setBusinessInfo(prev => ({
      ...prev,
      faqs: updatedFaqs
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // In a real app, this would save to the database
    setSaveStatus("saving");
    
    // Simulate API call
    setTimeout(() => {
      setSaveStatus("saved");
      
      // Reset status after a delay
      setTimeout(() => {
        setSaveStatus(null);
      }, 3000);
    }, 1000);
  };

  return (
    <div className={styles.settingsPage}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Business Settings</h1>
        <div className={styles.actions}>
          <button 
            className={styles.editButton} 
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? "Cancel" : "Edit"}
          </button>
          
          {isEditing && (
            <button 
              className={styles.saveButton} 
              onClick={handleSubmit}
              disabled={saveStatus === "saving"}
            >
              {saveStatus === "saving" ? "Saving..." : "Save Changes"}
            </button>
          )}
          
          {saveStatus === "saved" && (
            <span className={styles.savedIndicator}>✓ Saved</span>
          )}
        </div>
      </div>
      
      <form className={styles.settingsForm}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Basic Information</h2>
          
          <div className={styles.formGroup}>
            <label htmlFor="name">Business Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={businessInfo.name}
              onChange={handleInfoChange}
              disabled={!isEditing}
              className={styles.input}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="phoneNumber">Phone Number</label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={businessInfo.phoneNumber}
              onChange={handleInfoChange}
              disabled={!isEditing}
              className={styles.input}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="address">Address</label>
            <input
              type="text"
              id="address"
              name="address"
              value={businessInfo.address}
              onChange={handleInfoChange}
              disabled={!isEditing}
              className={styles.input}
            />
          </div>
        </section>
        
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Business Hours</h2>
          
          <div className={styles.hoursGrid}>
            {Object.entries(businessInfo.hours).map(([day, hours]) => (
              <div key={day} className={styles.hourRow}>
                <label htmlFor={`hours-${day}`}>{day}</label>
                <input
                  type="text"
                  id={`hours-${day}`}
                  value={hours}
                  onChange={(e) => handleHoursChange(day, e.target.value)}
                  disabled={!isEditing}
                  className={styles.input}
                />
              </div>
            ))}
          </div>
        </section>
        
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
          
          <div className={styles.faqList}>
            {businessInfo.faqs.map((faq, index) => (
              <div key={index} className={styles.faqItem}>
                <div className={styles.faqHeader}>
                  <h3>FAQ #{index + 1}</h3>
                  {isEditing && (
                    <button
                      type="button"
                      className={styles.removeButton}
                      onClick={() => handleRemoveFaq(index)}
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor={`question-${index}`}>Question</label>
                  <input
                    type="text"
                    id={`question-${index}`}
                    value={faq.question}
                    onChange={(e) => handleFaqChange(index, "question", e.target.value)}
                    disabled={!isEditing}
                    className={styles.input}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor={`answer-${index}`}>Answer</label>
                  <textarea
                    id={`answer-${index}`}
                    value={faq.answer}
                    onChange={(e) => handleFaqChange(index, "answer", e.target.value)}
                    disabled={!isEditing}
                    className={styles.textarea}
                    rows={3}
                  />
                </div>
              </div>
            ))}
          </div>
          
          {isEditing && (
            <div className={styles.addFaqSection}>
              <h3>Add New FAQ</h3>
              
              <div className={styles.formGroup}>
                <label htmlFor="new-question">Question</label>
                <input
                  type="text"
                  id="new-question"
                  value={newFaq.question}
                  onChange={(e) => setNewFaq({...newFaq, question: e.target.value})}
                  className={styles.input}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="new-answer">Answer</label>
                <textarea
                  id="new-answer"
                  value={newFaq.answer}
                  onChange={(e) => setNewFaq({...newFaq, answer: e.target.value})}
                  className={styles.textarea}
                  rows={3}
                />
              </div>
              
              <button
                type="button"
                className={styles.addButton}
                onClick={handleAddFaq}
                disabled={!newFaq.question || !newFaq.answer}
              >
                Add FAQ
              </button>
            </div>
          )}
        </section>
        
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Data Connections</h2>
          <p className={styles.sectionDescription}>
            Connect your business to external data sources.
          </p>
          
          <div className={styles.connectionCard}>
            <h3 className={styles.connectionTitle}>Airtable</h3>
            <p className={styles.connectionDescription}>
              Airtable is used to store and manage your business data, including business information, 
              hours, and FAQs.
            </p>
            <AirtableConnectionStatus />
          </div>
        </section>
        
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Twilio Configuration</h2>
          <p className={styles.sectionDescription}>
            Configure your Twilio phone number for missed call auto-texting.
          </p>
          
          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>Select Twilio Number</h3>
            <p className={styles.subsectionDescription}>
              Choose a phone number from your Twilio account to use for SmartText AI.
            </p>
            
            <TwilioNumberSelector 
              currentNumber={businessInfo.phoneNumber}
              onNumberSelected={(number) => {
                setBusinessInfo(prev => ({
                  ...prev,
                  phoneNumber: number
                }));
                toast.success("Phone number updated successfully");
              }}
              disabled={!isEditing}
            />
          </div>
          
          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>Twilio Status</h3>
            <TwilioConnectionStatus phoneNumber={businessInfo.phoneNumber} />
          </div>
        </section>
      </form>
    </div>
  );
}

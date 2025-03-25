"use client";

import { useState, useEffect } from "react";
import { useConversations, useMessages, sendMessage } from "@/lib/hooks/use-data";
import { useAuth } from "@/lib/auth/context";
import { useToast } from "@/app/components/Toast";
import styles from "./conversations.module.css";

// Helper function to format date
function formatDate(dateString) {
  if (!dateString) return "Unknown";
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  // Format time
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  const timeString = `${formattedHours}:${formattedMinutes} ${ampm}`;
  
  // Format date based on how recent it is
  if (diffDays === 0) {
    return `Today, ${timeString}`;
  } else if (diffDays === 1) {
    return `Yesterday, ${timeString}`;
  } else if (diffDays < 7) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return `${days[date.getDay()]}, ${timeString}`;
  } else {
    return `${date.toLocaleDateString()}, ${timeString}`;
  }
}

// Helper function to format phone number
function formatPhoneNumber(phoneNumber) {
  if (!phoneNumber) return "Unknown";
  
  // Remove any non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  // Return original if not a standard format
  return phoneNumber;
}

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <div className={styles.loadingSkeleton}>
      <div className={styles.skeletonPulse}></div>
    </div>
  );
}

export default function ConversationsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  
  // Fetch conversations
  const { 
    conversations, 
    isLoading: isLoadingConversations, 
    isError: conversationsError,
    mutate: mutateConversations
  } = useConversations();
  
  // Fetch messages for selected conversation
  const { 
    messages, 
    isLoading: isLoadingMessages, 
    isError: messagesError,
    mutate: mutateMessages
  } = useMessages(selectedConversation?.id);
  
  // Auto-select first conversation if none selected
  useEffect(() => {
    if (!selectedConversation && conversations.length > 0 && !isLoadingConversations) {
      setSelectedConversation(conversations[0]);
    }
  }, [conversations, selectedConversation, isLoadingConversations]);
  
  // Scroll to bottom of messages when messages change
  useEffect(() => {
    if (messages.length > 0) {
      const messagesContainer = document.getElementById('messages-container');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }
  }, [messages]);
  
  // Handle sending a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    if (!selectedConversation) return;
    
    try {
      setSending(true);
      
      // Send the message
      await sendMessage({
        conversationId: selectedConversation.id,
        message: newMessage,
      });
      
      // Show success toast
      toast.success("Message sent successfully");
      
      // Clear the input
      setNewMessage("");
      
      // Refresh the messages and conversations
      mutateMessages();
      mutateConversations();
    } catch (err) {
      console.error("Error sending message:", err);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };
  
  return (
    <div className={styles.conversationsPage}>
      <h1 className={styles.pageTitle}>Conversations</h1>
      
      <div className={styles.conversationsContainer}>
        <div className={styles.conversationsList}>
          <div className={styles.conversationsHeader}>
            <h2>Recent Conversations</h2>
          </div>
          
          {isLoadingConversations ? (
            <div className={styles.loadingContainer}>
              <LoadingSkeleton />
              <LoadingSkeleton />
              <LoadingSkeleton />
            </div>
          ) : conversationsError ? (
            <div className={styles.errorContainer}>
              <p>Error loading conversations</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className={styles.emptyContainer}>
              <p>No conversations yet</p>
            </div>
          ) : (
            <div className={styles.conversationsItems}>
              {conversations.map(conversation => (
                <div 
                  key={conversation.id} 
                  className={`${styles.conversationItem} ${selectedConversation?.id === conversation.id ? styles.selected : ''}`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className={styles.conversationInfo}>
                    <div className={styles.conversationHeader}>
                      <h3 className={styles.contactName}>
                        {conversation.contactName || formatPhoneNumber(conversation.contactPhone)}
                      </h3>
                      <span className={styles.lastMessageTime}>
                        {formatDate(conversation.lastMessageDate)}
                      </span>
                    </div>
                    <p className={styles.lastMessage}>
                      {conversation.lastMessageDirection === 'outbound' && 'You: '}
                      {conversation.lastMessageText}
                    </p>
                  </div>
                  {conversation.unreadCount > 0 && (
                    <div className={styles.unreadBadge}>
                      {conversation.unreadCount}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className={styles.messagesContainer}>
          {selectedConversation ? (
            <>
              <div className={styles.messagesHeader}>
                <h2>
                  {selectedConversation.contactName || formatPhoneNumber(selectedConversation.contactPhone)}
                </h2>
              </div>
              
              <div id="messages-container" className={styles.messages}>
                {isLoadingMessages ? (
                  <div className={styles.loadingContainer}>
                    <LoadingSkeleton />
                    <LoadingSkeleton />
                    <LoadingSkeleton />
                  </div>
                ) : messagesError ? (
                  <div className={styles.errorContainer}>
                    <p>Error loading messages</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className={styles.emptyContainer}>
                    <p>No messages in this conversation yet</p>
                  </div>
                ) : (
                  messages.map(message => (
                    <div 
                      key={message.id} 
                      className={`${styles.message} ${message.direction === 'outbound' ? styles.sent : styles.received}`}
                    >
                      <div className={styles.messageContent}>
                        <p className={styles.messageText}>{message.text}</p>
                        <span className={styles.messageTime}>
                          {formatDate(message.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <form className={styles.messageForm} onSubmit={handleSendMessage}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  disabled={sending}
                  className={styles.messageInput}
                />
                <button 
                  type="submit" 
                  disabled={sending || !newMessage.trim()} 
                  className={styles.sendButton}
                >
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </form>
            </>
          ) : (
            <div className={styles.noConversationSelected}>
              <p>Select a conversation to view messages</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

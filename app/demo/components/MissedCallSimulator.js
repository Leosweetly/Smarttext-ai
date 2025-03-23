/**
 * MissedCallSimulator component
 * This is the main interface for the missed call simulation demo
 */

"use client";

import { useState, useEffect } from "react";
import { useDemo } from "../context/demo-context";
import { formatPhoneNumber } from "../lib/mock-twilio";
import styles from "./MissedCallSimulator.module.css";

export default function MissedCallSimulator() {
  const {
    currentStep,
    isRunning,
    isComplete,
    selectedBusinessType,
    selectedTier,
    selectedScenario,
    customMessage,
    customPhoneNumber,
    demoResults,
    error,
    setSelectedBusinessType,
    setSelectedTier,
    setSelectedScenario,
    setCustomMessage,
    setCustomPhoneNumber,
    resetDemo,
    startDemo,
    goToStep,
    nextStep,
    prevStep,
    autoRunDemo,
  } = useDemo();

  const [showCustomMessage, setShowCustomMessage] = useState(false);

  // Update custom message visibility when scenario changes
  useEffect(() => {
    setShowCustomMessage(selectedScenario === "custom");
  }, [selectedScenario]);

  // Business type options
  const businessTypes = [
    { id: "restaurant", label: "Restaurant" },
    { id: "autoShop", label: "Auto Shop" },
    { id: "salon", label: "Salon" },
  ];

  // Subscription tier options
  const tiers = [
    { id: "basic", label: "Basic ($249/mo)" },
    { id: "pro", label: "Pro ($399/mo)" },
    { id: "enterprise", label: "Growth ($599+/mo)" },
  ];

  // Scenario options from demo-businesses.js
  const scenarios = [
    { id: "availability", label: "Availability Inquiry" },
    { id: "services", label: "Services Question" },
    { id: "hours", label: "Hours Question" },
    { id: "custom", label: "Custom Inquiry" },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Missed Call Simulator</h2>
        <p>Demonstrate how SmartText AI responds to missed calls</p>
      </div>

      {/* Configuration Panel */}
      <div className={styles.configPanel}>
        <div className={styles.configSection}>
          <h3>Business Type</h3>
          <div className={styles.optionButtons}>
            {businessTypes.map((type) => (
              <button
                key={type.id}
                className={`${styles.optionButton} ${
                  selectedBusinessType === type.id ? styles.selected : ""
                }`}
                onClick={() => setSelectedBusinessType(type.id)}
                disabled={isRunning}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.configSection}>
          <h3>Subscription Tier</h3>
          <div className={styles.optionButtons}>
            {tiers.map((tier) => (
              <button
                key={tier.id}
                className={`${styles.optionButton} ${
                  selectedTier === tier.id ? styles.selected : ""
                }`}
                onClick={() => setSelectedTier(tier.id)}
                disabled={isRunning}
              >
                {tier.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.configSection}>
          <h3>Customer Scenario</h3>
          <div className={styles.optionButtons}>
            {scenarios.map((scenario) => (
              <button
                key={scenario.id}
                className={`${styles.optionButton} ${
                  selectedScenario === scenario.id ? styles.selected : ""
                }`}
                onClick={() => setSelectedScenario(scenario.id)}
                disabled={isRunning}
              >
                {scenario.label}
              </button>
            ))}
          </div>
        </div>

        {showCustomMessage && (
          <div className={styles.configSection}>
            <h3>Custom Message</h3>
            <textarea
              className={styles.customMessageInput}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Enter a custom message from the customer..."
              disabled={isRunning}
              rows={3}
            />
          </div>
        )}

        <div className={styles.configSection}>
          <h3>Your Phone Number (Optional)</h3>
          <p className={styles.phoneNumberDescription}>
            Enter your phone number to receive the actual text message
          </p>
          <input
            type="tel"
            className={styles.phoneNumberInput}
            value={customPhoneNumber}
            onChange={(e) => setCustomPhoneNumber(e.target.value)}
            placeholder="(555) 123-4567"
            disabled={isRunning}
          />
        </div>

        <div className={styles.actionButtons}>
          <button
            className={`${styles.button} ${styles.primaryButton}`}
            onClick={startDemo}
            disabled={isRunning || (showCustomMessage && !customMessage)}
          >
            {isRunning ? "Running..." : "Run Simulation"}
          </button>
          <button
            className={`${styles.button} ${styles.secondaryButton}`}
            onClick={resetDemo}
            disabled={isRunning || (!demoResults && !error)}
          >
            Reset
          </button>
          <button
            className={`${styles.button} ${styles.secondaryButton}`}
            onClick={autoRunDemo}
            disabled={isRunning || (showCustomMessage && !customMessage)}
          >
            Auto-Play Demo
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className={styles.errorContainer}>
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      )}

      {/* Results Display */}
      {demoResults && (
        <div className={styles.resultsContainer}>
          <div className={styles.stepNavigation}>
            <h3>Demo Steps</h3>
            <div className={styles.stepButtons}>
              {demoResults.steps.map((step, index) => (
                <button
                  key={step.id}
                  className={`${styles.stepButton} ${
                    currentStep === index ? styles.currentStep : ""
                  } ${step.status === "error" ? styles.errorStep : ""}`}
                  onClick={() => goToStep(index)}
                  disabled={isRunning}
                >
                  {index + 1}. {step.name}
                </button>
              ))}
            </div>
            <div className={styles.stepControls}>
              <button
                className={styles.navButton}
                onClick={prevStep}
                disabled={currentStep === 0 || isRunning}
              >
                Previous
              </button>
              <button
                className={styles.navButton}
                onClick={nextStep}
                disabled={
                  currentStep >= demoResults.steps.length - 1 || isRunning
                }
              >
                Next
              </button>
            </div>
          </div>

          <div className={styles.simulationDisplay}>
            <div className={styles.businessCard}>
              <h3>{demoResults.business.name}</h3>
              <p className={styles.businessType}>
                {demoResults.business.businessType}
              </p>
              <p className={styles.businessPhone}>
                {formatPhoneNumber(demoResults.business.phoneNumber)}
              </p>
              <div className={styles.tierBadge}>{selectedTier}</div>
            </div>

            <div className={styles.phoneSimulator}>
              <div className={styles.phoneHeader}>
                <span>Missed Call</span>
              </div>
              <div className={styles.phoneContent}>
                {currentStep === 0 && (
                  <div className={styles.missedCallDisplay}>
                    <div className={styles.callIcon}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                      </svg>
                    </div>
                    <p className={styles.callInfo}>
                      Missed call from{" "}
                      {formatPhoneNumber(demoResults.scenario.callerPhone)}
                    </p>
                    <p className={styles.callTime}>
                      {new Date().toLocaleTimeString()}
                    </p>
                    {demoResults.scenario.message && (
                      <div className={styles.customerMessage}>
                        <p className={styles.messageLabel}>
                          Customer would have asked:
                        </p>
                        <p className={styles.messageContent}>
                          "{demoResults.scenario.message}"
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {currentStep === 1 && (
                  <div className={styles.businessLookup}>
                    <div className={styles.lookupIcon}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                    </div>
                    <p className={styles.lookupInfo}>
                      Looking up business information...
                    </p>
                    <div className={styles.businessInfo}>
                      <p>
                        <strong>Name:</strong> {demoResults.business.name}
                      </p>
                      <p>
                        <strong>Type:</strong>{" "}
                        {demoResults.business.businessType}
                      </p>
                      <p>
                        <strong>Subscription:</strong> {selectedTier}
                      </p>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className={styles.aiResponse}>
                    <div className={styles.aiIcon}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M12 2a10 10 0 1 0 10 10H12V2z"></path>
                        <path d="M20 2a10 10 0 0 1 0 20 10 10 0 0 1-20 0"></path>
                        <circle cx="12" cy="12" r="6"></circle>
                      </svg>
                    </div>
                    <p className={styles.aiInfo}>
                      Generating AI response based on business information...
                    </p>
                    <div className={styles.responsePreview}>
                      <p className={styles.responseLabel}>Generated Response:</p>
                      <p className={styles.responseContent}>
                        {demoResults.steps[2].data.generatedResponse}
                      </p>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className={styles.smsResponse}>
                    <div className={styles.smsIcon}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      </svg>
                    </div>
                    <p className={styles.smsInfo}>
                      Sending SMS response to customer...
                    </p>
                    <div className={styles.messageThread}>
                      <div className={styles.incomingMessage}>
                        <p className={styles.messageContent}>
                          {demoResults.scenario.message || "(Missed Call)"}
                        </p>
                        <p className={styles.messageTime}>
                          {new Date().toLocaleTimeString()}
                        </p>
                      </div>
                      <div className={styles.outgoingMessage}>
                        <p className={styles.messageContent}>
                          {demoResults.steps[2].data.generatedResponse}
                        </p>
                        <p className={styles.messageTime}>
                          {new Date().toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

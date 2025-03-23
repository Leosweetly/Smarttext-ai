/**
 * TierComparisonView component
 * Shows side-by-side comparisons of responses across different subscription tiers
 */

"use client";

import { useState } from "react";
import { useDemo } from "../context/demo-context";
import styles from "./TierComparisonView.module.css";

export default function TierComparisonView() {
  const demo = useDemo();
  const {
    selectedBusinessType,
    selectedScenario,
    customMessage,
    tierComparison,
    isLoadingComparison,
    error,
    loadTierComparison,
    setSelectedBusinessType,
    setSelectedScenario,
    setCustomMessage
  } = demo;

  // Business type options
  const businessTypes = [
    { id: "restaurant", label: "Restaurant" },
    { id: "autoShop", label: "Auto Shop" },
    { id: "salon", label: "Salon" },
  ];

  // Scenario options
  const scenarios = [
    { id: "availability", label: "Availability Inquiry" },
    { id: "services", label: "Services Question" },
    { id: "hours", label: "Hours Question" },
    { id: "custom", label: "Custom Inquiry" },
  ];

  // State for custom message input
  const [localCustomMessage, setLocalCustomMessage] = useState(customMessage);
  const [showCustomMessage, setShowCustomMessage] = useState(selectedScenario === "custom");

  // Handle scenario change
  const handleScenarioChange = (e) => {
    const newScenario = e.target.value;
    setShowCustomMessage(newScenario === "custom");
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    loadTierComparison();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Subscription Tier Comparison</h2>
        <p>Compare AI responses across different subscription tiers</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="businessType">Business Type</label>
          <select
            id="businessType"
            className={styles.select}
            value={selectedBusinessType}
            onChange={(e) => setSelectedBusinessType(e.target.value)}
            disabled={isLoadingComparison}
          >
            {businessTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="scenario">Customer Scenario</label>
          <select
            id="scenario"
            className={styles.select}
            value={selectedScenario}
            onChange={(e) => {
              setSelectedScenario(e.target.value);
              handleScenarioChange(e);
            }}
            disabled={isLoadingComparison}
          >
            {scenarios.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.label}
              </option>
            ))}
          </select>
        </div>

        {showCustomMessage && (
          <div className={styles.formGroup}>
            <label htmlFor="customMessage">Custom Message</label>
            <textarea
              id="customMessage"
              className={styles.textarea}
              value={localCustomMessage}
              onChange={(e) => {
                setLocalCustomMessage(e.target.value);
                setCustomMessage(e.target.value);
              }}
              placeholder="Enter a custom message from the customer..."
              disabled={isLoadingComparison}
              rows={3}
            />
          </div>
        )}

        <button
          type="submit"
          className={styles.button}
          disabled={isLoadingComparison || (showCustomMessage && !localCustomMessage)}
        >
          {isLoadingComparison ? "Loading..." : "Compare Tiers"}
        </button>
      </form>

      {error && (
        <div className={styles.error}>
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      )}

      {tierComparison && (
        <div className={styles.comparisonResults}>
          <div className={styles.scenarioInfo}>
            <h3>Scenario</h3>
            <p className={styles.scenarioType}>
              <strong>Business Type:</strong> {tierComparison.businessType}
            </p>
            <p className={styles.scenarioMessage}>
              <strong>Customer Message:</strong> "{tierComparison.scenario.message}"
            </p>
          </div>

          <div className={styles.tierCards}>
            {Object.entries(tierComparison.responses).map(([tier, response]) => (
              <div key={tier} className={`${styles.tierCard} ${styles[tier]}`}>
                <div className={styles.tierHeader}>
                  <h3>{tier.charAt(0).toUpperCase() + tier.slice(1)}</h3>
                  <div className={styles.priceBadge}>
                    {tier === "basic"
                      ? "$199/mo"
                      : tier === "pro"
                      ? "$349/mo"
                      : "$499+/mo"}
                  </div>
                </div>
                <div className={styles.responseContent}>
                  {response.error ? (
                    <p className={styles.errorText}>{response.text}</p>
                  ) : (
                    <p>{response.text}</p>
                  )}
                </div>
                <div className={styles.responseStats}>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Characters:</span>
                    <span className={styles.statValue}>{response.text.length}</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Words:</span>
                    <span className={styles.statValue}>
                      {response.text.split(/\s+/).filter(Boolean).length}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.comparisonInsights}>
            <h3>Response Insights</h3>
            <ul className={styles.insightsList}>
              <li>
                <strong>Basic Tier:</strong> Provides essential information in a straightforward manner.
              </li>
              <li>
                <strong>Pro Tier:</strong> Offers more personalized responses with additional context.
              </li>
              <li>
                <strong>Enterprise Tier:</strong> Delivers highly customized messages with business-specific details and suggestions.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { FAQ_ITEMS } from '../types'

interface DocsFaqSectionProps {
  searchQuery: string
}

export const DocsFaqSection: React.FC<DocsFaqSectionProps> = ({ searchQuery }) => {
  const [expandedFaq, setExpandedFaq] = useState<Record<string, boolean>>({
    'faq-1': true,
    'faq-2': true,
  })

  const toggleFaq = (id: string) => {
    setExpandedFaq((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const filteredFaqs = FAQ_ITEMS.filter(
    (item) =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <section id="faq" className="docs-section">
      <span className="section-chapter">CHAPTER 09</span>
      <h2 className="docs-section-title">Frequently Asked Questions (FAQ)</h2>
      <p className="docs-lead">
        Answers to common operational, architectural, compliance, and integration questions.
      </p>

      <div className="faq-list-container">
        {filteredFaqs.length === 0 ? (
          <div className="faq-empty">No matching FAQ entries found for "{searchQuery}".</div>
        ) : (
          filteredFaqs.map((faq) => {
            const isExpanded = expandedFaq[faq.id] ?? false
            return (
              <div key={faq.id} className={`faq-card ${isExpanded ? 'expanded' : ''}`}>
                <button
                  type="button"
                  className="faq-question-btn"
                  onClick={() => toggleFaq(faq.id)}
                  aria-expanded={isExpanded}
                >
                  <span className="faq-question-text">{faq.question}</span>
                  <span className="faq-toggle-icon">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </span>
                </button>
                {isExpanded && (
                  <div className="faq-answer-content animate-fade-in">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}

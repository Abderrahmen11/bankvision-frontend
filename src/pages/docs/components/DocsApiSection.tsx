import React from 'react'
import { Lock } from 'lucide-react'

export const DocsApiSection: React.FC = () => {
  return (
    <section id="api" className="docs-section">
      <span className="section-chapter">CHAPTER 08</span>
      <h2 className="docs-section-title">API Reference & Authentication</h2>
      <p>
        All endpoints reside under the <code>/api</code> prefix and communicate using standard JSON payloads over TLS 1.3.
      </p>

      <div className="code-block-container">
        <div className="code-block-header">
          <Lock size={14} />
          <span>Authentication Header</span>
        </div>
        <pre className="code-pre">
{`Authorization: Bearer 1|bv_token_948a92e10c4f82049182374921b`}
        </pre>
      </div>
    </section>
  )
}

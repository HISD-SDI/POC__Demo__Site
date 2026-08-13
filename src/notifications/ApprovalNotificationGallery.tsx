import { useMemo, useState } from 'react'
import yellowCitySubmarkUrl from '../assets/hisd-logo-submark-white-yellow.svg'
import {
  approvalNotificationFixtures,
  buildApprovalRequestMessage,
  buildApprovalRequestPreviewHtml,
  OUTLOOK_ADAPTIVE_CARD_VERSION,
} from './approvalRequestNotification'
import './approvalNotificationGallery.css'

const previewBranding = { yellowCitySubmarkUrl } as const

export function ApprovalNotificationGallery() {
  const [selectedId, setSelectedId] = useState(approvalNotificationFixtures[0].id)
  const [copyStatus, setCopyStatus] = useState('')
  const selected = approvalNotificationFixtures.find(({ id }) => id === selectedId) ?? approvalNotificationFixtures[0]
  const message = useMemo(
    () => buildApprovalRequestMessage(selected.model, selected.state, previewBranding),
    [selected],
  )
  const cardJson = useMemo(() => JSON.stringify(message.adaptiveCard, null, 2), [message.adaptiveCard])
  const previewHtml = useMemo(
    () => buildApprovalRequestPreviewHtml(selected.model, selected.state, previewBranding),
    [selected],
  )

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(cardJson)
      setCopyStatus('Adaptive Card JSON copied.')
    } catch {
      setCopyStatus('Copy was blocked by the browser. Select the JSON and copy it manually.')
    }
  }

  const downloadJson = () => {
    const url = URL.createObjectURL(new Blob([cardJson], { type: 'application/json;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.download = `approval-request-${selected.id}.adaptive-card.json`
    anchor.href = url
    anchor.click()
    URL.revokeObjectURL(url)
    setCopyStatus(`Downloaded ${anchor.download}.`)
  }

  return (
    <div className="notification-gallery-shell">
      <a className="notification-skip-link" href="#notification-preview">Skip to preview</a>
      <header className="notification-gallery-header">
        <div className="notification-gallery-brand" aria-label="Approval notification preview">
          <span className="notification-brand-mark" aria-hidden="true">EP</span>
          <span>Email Preview</span>
        </div>
        <div>
          <span className="notification-gallery-kicker">Static stakeholder preview</span>
          <h1>Approval Request notification</h1>
          <p>Review proposed email states and export Outlook-ready Adaptive Card JSON without connecting to an application.</p>
        </div>
        <span className="notification-local-badge">Presentation only</span>
      </header>

      <main id="notification-preview" className="notification-gallery-main">
        <aside className="notification-state-panel" aria-labelledby="notification-states-heading">
          <div className="notification-panel-heading">
            <span className="notification-gallery-kicker">Fixtures</span>
            <h2 id="notification-states-heading">Notification states</h2>
          </div>
          <div className="notification-state-list">
            {approvalNotificationFixtures.map((fixture, index) => (
              <button
                aria-pressed={selected.id === fixture.id}
                className="notification-state-button"
                key={fixture.id}
                onClick={() => { setSelectedId(fixture.id); setCopyStatus('') }}
                type="button"
              >
                <span className="notification-state-index">{String(index + 1).padStart(2, '0')}</span>
                <span><strong>{fixture.label}</strong><small>{fixture.description}</small></span>
              </button>
            ))}
          </div>
          <div className="notification-safety-note">
            <strong>No email or decision is sent from this gallery.</strong>
            <span>No Experience Pass site, authentication, backend, recipient resolution, or delivery service is connected.</span>
          </div>
        </aside>

        <section className="notification-preview-workspace" aria-labelledby="selected-notification-heading">
          <div className="notification-preview-toolbar">
            <div>
              <span className="notification-gallery-kicker">Selected fixture</span>
              <h2 id="selected-notification-heading">{selected.label}</h2>
              <p>{selected.description}</p>
            </div>
            <dl className="notification-contract-facts">
              <div><dt>Subject</dt><dd>{message.subject}</dd></div>
              <div><dt>Card schema</dt><dd>Adaptive Card {OUTLOOK_ADAPTIVE_CARD_VERSION}</dd></div>
              <div><dt>Action behavior</dt><dd>Visual placeholders</dd></div>
            </dl>
          </div>

          <div className="notification-email-previews">
            <figure className="notification-preview-frame notification-preview-desktop">
              <figcaption>Desktop email preview <span>600 px message</span></figcaption>
              <iframe srcDoc={previewHtml} title={`${selected.label} desktop email preview`} />
            </figure>
            <figure className="notification-preview-frame notification-preview-narrow">
              <figcaption>Narrow email preview <span>375 px viewport</span></figcaption>
              <iframe srcDoc={previewHtml} title={`${selected.label} narrow email preview`} />
            </figure>
          </div>

          <section className="notification-json-panel" aria-labelledby="adaptive-card-json-heading">
            <div className="notification-json-header">
              <div>
                <span className="notification-gallery-kicker">Outlook tooling</span>
                <h2 id="adaptive-card-json-heading">Adaptive Card JSON</h2>
                <p>Copy into Microsoft’s Actionable Message Designer or download a fixture file.</p>
              </div>
              <div className="notification-json-actions">
                <button className="notification-button notification-button-secondary" onClick={copyJson} type="button">Copy Adaptive Card JSON</button>
                <button className="notification-button notification-button-primary" onClick={downloadJson} type="button">Download JSON</button>
              </div>
            </div>
            <p className="notification-copy-status" aria-live="polite">{copyStatus}</p>
            <textarea aria-label="Generated Adaptive Card JSON" readOnly spellCheck={false} value={cardJson} />
          </section>
        </section>
      </main>
    </div>
  )
}

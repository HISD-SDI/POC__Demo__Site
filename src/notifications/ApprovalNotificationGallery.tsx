import { useMemo, useState } from 'react'
import { hisdBlueCityLogoDataUrl } from '../branding/experiencePassBrand'
import {
  buildExperiencePassEmail,
  emailTemplateFixtures,
  type EmailAudience,
} from './approvalRequestNotification'
import './approvalNotificationGallery.css'

const audienceGroups: readonly { audience: EmailAudience; heading: string; description: string }[] = [
  { audience: 'requester', heading: 'Requester Notifications', description: 'Receipts, final outcomes, and requests for clarification.' },
  { audience: 'approver', heading: 'Approver Notifications', description: 'Approval requests that continue in Experience Pass.' },
  { audience: 'department', heading: 'Department Notifications', description: 'Direct CTE, Title I, and Transportation Services coordination.' },
]

export function ApprovalNotificationGallery() {
  const [selectedId, setSelectedId] = useState(emailTemplateFixtures[0].id)
  const selected = emailTemplateFixtures.find(({ id }) => id === selectedId) ?? emailTemplateFixtures[0]
  const message = useMemo(
    () => buildExperiencePassEmail(selected.id, selected.context),
    [selected],
  )

  return (
    <div className="notification-gallery-shell">
      <a className="notification-skip-link" href="#notification-preview">Skip to preview</a>
      <header className="notification-gallery-header">
        <div className="notification-brand-bar">
          <img src={hisdBlueCityLogoDataUrl} alt="Houston Independent School District" />
          <span aria-hidden="true" />
          <strong>Experience Pass</strong>
        </div>
        <div className="notification-title-band">
          <div>
            <span className="notification-gallery-kicker">Stakeholder Preview</span>
            <h1>Approval Notification Gallery</h1>
            <p>Finalized Experience Pass email templates for requester, approver, and department communications.</p>
          </div>
          <span className="notification-preview-badge">Presentation only</span>
        </div>
      </header>

      <main id="notification-preview" className="notification-gallery-main">
        <aside className="notification-state-panel" aria-label="Email templates">
          {audienceGroups.map((group) => {
            const templates = emailTemplateFixtures.filter(({ audience }) => audience === group.audience)
            return (
              <section className="notification-template-group" key={group.audience}>
                <div className="notification-group-heading">
                  <h2>{group.heading}</h2>
                  <p>{group.description}</p>
                </div>
                <div className="notification-state-list">
                  {templates.map((template) => (
                    <button
                      aria-pressed={selected.id === template.id}
                      className="notification-state-button"
                      key={template.id}
                      onClick={() => setSelectedId(template.id)}
                      type="button"
                    >
                      <strong>{template.label}</strong>
                      <small>{template.description}</small>
                    </button>
                  ))}
                </div>
              </section>
            )
          })}
          <div className="notification-safety-note">
            <strong>No email is sent from this gallery.</strong>
            <span>All names, request details, and links are demo-safe preview fixtures.</span>
          </div>
        </aside>

        <section className="notification-preview-workspace" aria-labelledby="selected-notification-heading">
          <div className="notification-preview-toolbar">
            <div>
              <span className="notification-gallery-kicker">Selected Template</span>
              <h2 id="selected-notification-heading">{selected.label}</h2>
              <p>{selected.description}</p>
            </div>
            <dl className="notification-subject">
              <dt>Email Subject</dt>
              <dd>{message.subject}</dd>
            </dl>
          </div>

          <div className="notification-email-previews">
            <figure className="notification-preview-frame notification-preview-desktop">
              <figcaption>Desktop email preview <span>600 px message</span></figcaption>
              <iframe srcDoc={message.html} title={`${selected.label} desktop email preview`} />
            </figure>
            <figure className="notification-preview-frame notification-preview-narrow">
              <figcaption>Narrow email preview <span>375 px viewport</span></figcaption>
              <iframe srcDoc={message.html} title={`${selected.label} narrow email preview`} />
            </figure>
          </div>
        </section>
      </main>
    </div>
  )
}

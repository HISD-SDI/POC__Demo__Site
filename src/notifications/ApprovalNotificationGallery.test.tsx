import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ApprovalNotificationGallery } from './ApprovalNotificationGallery'

describe('Approval Request notification preview gallery', () => {
  it('presents every requested state and the JSON copy/export controls', () => {
    const markup = renderToStaticMarkup(<ApprovalNotificationGallery />)

    for (const label of [
      'Pending Approval',
      'Pending · Additional Review',
      'Pending · Title I',
      'Pending · Title I + HISD Bus',
      'Reject Confirmation',
      'Submitted Receipt',
      'Approved',
      'Rejected',
      'Already Actioned / Stale',
    ]) expect(markup).toContain(label)

    expect(markup).not.toContain('>Error<')

    expect(markup).toContain('Copy Adaptive Card JSON')
    expect(markup).toContain('Download JSON')
    expect(markup).toContain('Desktop email preview')
    expect(markup).toContain('Narrow email preview')
    expect(markup).not.toContain('Approved blue-city logo asset needed')
    expect(markup).toContain('data:image/svg+xml')
    expect(markup).toContain('No email or decision is sent from this gallery.')
    expect(markup).toContain('Static stakeholder preview')
    expect(markup).toContain('example.invalid/approval-request/FTR-1042')
  })
})

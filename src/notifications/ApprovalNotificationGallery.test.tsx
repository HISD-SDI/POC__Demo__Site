import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ApprovalNotificationGallery } from './ApprovalNotificationGallery'

describe('ExperiencePass email template gallery', () => {
  it('presents the finalized templates by audience without comparison or developer tooling', () => {
    const markup = renderToStaticMarkup(<ApprovalNotificationGallery />)

    for (const heading of ['Requester Notifications', 'Approver Notifications', 'Department Notifications']) {
      expect(markup).toContain(heading)
    }
    for (const label of [
      'Submitted Receipt',
      'Submitted Receipt · Title I',
      'Submitted Receipt · HISD Bus',
      'Submitted Receipt · Title I + HISD Bus',
      'Approved',
      'Rejected',
      'Request for Details',
      'Pending Approval',
      'Pending Approval · Additional Review',
      'Already Actioned',
      'CTE Notification',
      'Title I Notification',
      'Transportation Services Notification',
    ]) expect(markup).toContain(label)

    expect(markup).not.toContain('Approval Confirmation')
    expect(markup).not.toContain('Reject Confirmation')

    expect(markup).toContain('Approval Notification Gallery')
    expect(markup).toContain('data:image/svg+xml')
    expect(markup).toContain('%234975bd')
    expect(markup).toContain('Desktop email preview')
    expect(markup).toContain('Narrow email preview')
    expect(markup).toContain('No email is sent from this gallery.')
    expect(markup).not.toContain('Compare proposed alternatives')
    expect(markup).not.toContain('Current version')
    expect(markup).not.toContain('Proposed alternative')
    expect(markup).not.toContain('Dynamic email')
    expect(markup).not.toContain('Adaptive Card')
    expect(markup).not.toContain('Outlook tooling')
    expect(markup).not.toContain('Action behavior')
  })
})

import { describe, expect, it } from 'vitest'
import {
  approvalNotificationFixtures,
  buildApprovalRequestMessage,
  buildApprovalRequestPreviewHtml,
  validateOutlookAdaptiveCard,
} from './approvalRequestNotification'

const pending = approvalNotificationFixtures.find(({ id }) => id === 'pending')!
const pendingAdditionalReview = approvalNotificationFixtures.find(({ id }) => id === 'pending-additional-review')!
const pendingTitleI = approvalNotificationFixtures.find(({ id }) => id === 'pending-title-i')!
const pendingTitleIHisdBus = approvalNotificationFixtures.find(({ id }) => id === 'pending-title-i-hisd-bus')!

describe('Approval Request notification composition', () => {
  it('constructs the subject from the schema-neutral model', () => {
    expect(buildApprovalRequestMessage(pending.model, pending.state).subject)
      .toBe('Approval Request: Field Trip FTR-1042')
  })

  it('renders the bounded request summary in every fallback', () => {
    const message = buildApprovalRequestMessage(pending.model, pending.state)

    for (const value of [
      'FTR-1042',
      'Jones HS',
      'Manuel Umanzor',
      'August 18, 2026',
      'Houston Museum of Natural Science',
      'Local',
      'Principal',
    ]) {
      expect(message.html).toContain(value)
      expect(message.text).toContain(value)
      expect(JSON.stringify(message.adaptiveCard)).toContain(value)
    }
    expect(message.html).toContain('Primary Destination')
    expect(message.text).toContain('Primary Destination: Houston Museum of Natural Science')
  })

  it('shows Additional Review Required only for the flagged pending fixture', () => {
    const normal = buildApprovalRequestMessage(pending.model, pending.state)
    const flagged = buildApprovalRequestMessage(pendingAdditionalReview.model, pendingAdditionalReview.state)

    expect(normal.html).not.toContain('Additional Review Required')
    expect(JSON.stringify(normal.adaptiveCard)).not.toContain('Additional Review Required')
    expect(flagged.html).toContain('Additional Review Required')
    expect(JSON.stringify(flagged.adaptiveCard)).toContain('Additional Review Required')
    expect(flagged.html).toMatch(/Additional Review Required<\/span>/)
    expect(flagged.html).toMatch(/background:#EDF1F8;color:#31598F[^>]*>Additional Review Required/)
    expect(flagged.adaptiveCard.body.find((element) => element.text === '⚠ Additional Review Required')?.color)
      .toBe('Accent')
  })

  it('shows a Title I coordination message only for Local Title I pending approvals', () => {
    const normal = buildApprovalRequestMessage(pending.model, pending.state)
    const titleI = buildApprovalRequestMessage(pendingTitleI.model, pendingTitleI.state)

    for (const output of [titleI.html, titleI.text, JSON.stringify(titleI.adaptiveCard)]) {
      expect(output).toContain('Title I coordination')
      expect(output).toContain('Title I will be reaching out on a separate timeline')
    }
    expect(titleI.html).toContain('data-title-i-coordination="pending"')
    expect(titleI.html).toContain('background:#FFF7DD')
    expect(normal.html).not.toContain('Title I coordination')

    const nonLocal = buildApprovalRequestMessage(
      { ...pendingTitleI.model, tripType: 'Out of State' },
      pendingTitleI.state,
    )
    expect(nonLocal.html).not.toContain('Title I coordination')
  })

  it('combines separate Title I and Transportation coordination messages for Local Title I HISD bus requests', () => {
    const message = buildApprovalRequestMessage(pendingTitleIHisdBus.model, pendingTitleIHisdBus.state)

    expect(message.html).toContain('data-title-i-coordination="pending"')
    expect(message.html).toContain('data-transportation-coordination="pending"')
    expect(message.html).toContain('background:#FFF7DD')
    expect(message.html).toContain('background:#FFF7DD')
    expect(message.text).toContain('Title I will be reaching out on a separate timeline')
    expect(message.text).toContain('No contact timeline is currently available')
  })

  it('models pending Review, Approve, and Reject without inventing live transport', () => {
    const message = buildApprovalRequestMessage(pending.model, pending.state)
    const previewHtml = buildApprovalRequestPreviewHtml(pending.model, pending.state)
    const card = JSON.stringify(message.adaptiveCard)

    expect(card).toContain('Request Details')
    expect(card).not.toContain('Review Request')
    expect(card).toContain('Approve')
    expect(card).toContain('Reject')
    expect(message.actionContract.transport).toBe('unconfigured')
    expect(message.actionContract.supportedModels).toEqual(['action-http', 'action-execute'])
    expect(card).not.toContain('Action.Http')
    expect(card).not.toContain('Action.Execute')
    expect(previewHtml).toContain('>Request Details</a>')
    expect(message.html).toContain('>Request Details</a>')
    expect(message.text).toContain('Request Details:')
    expect(previewHtml).toContain('>Approve</button>')
    expect(previewHtml).toContain('>Reject</button>')
    expect(previewHtml).toContain('Action required')
    expect(previewHtml).toContain('A field trip needs your approval')
    expect(previewHtml).toContain('Open full request in Experience Pass')
    expect(previewHtml).toContain('Experience Pass</span>')
    expect(previewHtml).toContain('Approval Notification')
    expect(previewHtml).toMatch(/data-brand-title="experience-pass"[^>]*>[\s\S]*Experience Pass[\s\S]*Approval Notification[\s\S]*<\/div><\/div>/)
    expect(previewHtml).toContain('Houston Independent School District &middot; 4400 W. 18th St, Houston, TX 77092')
    expect(previewHtml).toMatch(/data-preview-action="approve"[^>]+background:#00A3AF[^>]+color:#ffffff/)
    expect(previewHtml).toMatch(/data-preview-action="details"[^>]+min-height:44px[^>]+border:1\.5px solid #BCC7C9[^>]+border-radius:8px[^>]+background:#ffffff/)
    expect(previewHtml.indexOf('>Approve</button>')).toBeLessThan(previewHtml.indexOf('>Reject</button>'))
    expect(previewHtml.indexOf('>Reject</button>')).toBeLessThan(previewHtml.indexOf('>Request Details</a>'))
    expect(card.indexOf('"title":"Approve"')).toBeLessThan(card.indexOf('"title":"Reject"'))
    expect(card.indexOf('"title":"Reject"')).toBeLessThan(card.indexOf('"title":"Request Details"'))
    expect(message.html).not.toContain('>Approve</button>')
    expect(message.html).not.toContain('>Reject</button>')
  })

  it('presents a comment-free reject confirmation with only Confirm Reject and Cancel', () => {
    const fixture = approvalNotificationFixtures.find(({ id }) => id === 'reject-entry')!
    const message = buildApprovalRequestMessage(fixture.model, fixture.state)
    const previewHtml = buildApprovalRequestPreviewHtml(fixture.model, fixture.state)
    const card = JSON.stringify(message.adaptiveCard)

    expect(card).toContain('Reject Request')
    expect(card).not.toContain('Input.Text')
    expect(card).not.toContain('Rejection comments')
    expect(card).toContain('Confirm Reject')
    expect(card).toContain('Cancel')
    expect(card).not.toContain('View Request')
    expect(previewHtml).toContain('>Confirm Reject</button>')
    expect(previewHtml).toContain('>Cancel</button>')
    expect(previewHtml).toContain('Confirm that you want to reject this field trip request.')
    expect(previewHtml).not.toContain('Add a reason')
    expect(previewHtml).not.toContain('<textarea')
    expect(previewHtml).not.toContain('>View Request</a>')
  })

  it.each([
    ['approved', 'Request FTR-1042 has been approved'],
    ['rejected', 'Request Rejected'],
    ['stale', 'This request no longer requires your approval.'],
  ] as const)('%s removes decision actions', (fixtureId, expectedCopy) => {
    const fixture = approvalNotificationFixtures.find(({ id }) => id === fixtureId)!
    const message = buildApprovalRequestMessage(fixture.model, fixture.state)
    const card = JSON.stringify(message.adaptiveCard)

    expect(card).toContain(expectedCopy)
    expect(card).not.toContain('"title":"Approve"')
    expect(card).not.toContain('"title":"Reject"')
    expect(card).toContain('View Request')
  })

  it('combines the UID with approval and renders a named vertical approval history', () => {
    const approved = approvalNotificationFixtures.find(({ id }) => id === 'approved')!
    const message = buildApprovalRequestMessage(approved.model, approved.state)
    const card = JSON.stringify(message.adaptiveCard)

    for (const value of ['Principal', 'Dr. Jordan Lee', 'Sr. Executive Director', 'Morgan Davis', 'Division Chief', 'Taylor Brooks']) {
      expect(message.html).toContain(value)
      expect(message.text).toContain(value)
      expect(card).toContain(value)
    }
    expect(message.html).toContain('Request FTR-1042 has been approved')
    expect(message.text).toContain('Request FTR-1042 has been approved')
    expect(card).toContain('Request FTR-1042 has been approved')
    expect(message.html).not.toContain('All required Experience Pass approval stages are complete.')
    expect(message.html).toContain('data-approval-chain="complete"')
    expect(message.html.match(/data-approval-step="complete"/g)).toHaveLength(3)
    expect(message.html).toContain('background:#E6F2EF')
    expect(message.html).toContain('color:#006F5B')
    expect(message.html).toContain('&#10003;')
    expect(message.html.match(/data-approval-connector="complete"/g)).toHaveLength(2)
    expect(message.html).toContain('background:#006F5B')
  })

  it('includes a teal-tinted trip reminder in the final approved message', () => {
    const approved = approvalNotificationFixtures.find(({ id }) => id === 'approved')!
    const message = buildApprovalRequestMessage(approved.model, approved.state)
    const card = JSON.stringify(message.adaptiveCard)

    for (const value of [approved.model.tripDateDisplay, approved.model.primaryDestination]) {
      expect(message.html).toContain(value)
      expect(message.text).toContain(value)
      expect(card).toContain(value)
    }
    expect(message.html).toContain('data-trip-reminder="approved"')
    expect(message.html).toContain('background:#F2FAFB')
  })

  it('shows conditional amber Transportation Services guidance without promising a timeline', () => {
    const approved = approvalNotificationFixtures.find(({ id }) => id === 'approved')!
    const message = buildApprovalRequestMessage(approved.model, approved.state)
    const card = JSON.stringify(message.adaptiveCard)

    expect(message.html).toContain('Transportation Services coordination')
    expect(message.html).toContain('background:#FFF7DD')
    expect(message.html).toContain('color:#8A6814')
    expect(message.text).toContain('No contact timeline is currently available')
    expect(card).toContain('separate system')

    const withoutHisdBuses = buildApprovalRequestMessage(
      { ...approved.model, hisdBusTransportationRequested: false },
      approved.state,
    )
    expect(withoutHisdBuses.html).not.toContain('Transportation Services coordination')
    expect(withoutHisdBuses.text).not.toContain('No contact timeline is currently available')
    expect(JSON.stringify(withoutHisdBuses.adaptiveCard)).not.toContain('separate system')
  })

  it('requires at least one completed stage for an approved notification', () => {
    const approved = approvalNotificationFixtures.find(({ id }) => id === 'approved')!
    expect(() => buildApprovalRequestMessage(approved.model, {
      kind: 'approved',
      completedApprovals: [],
    })).toThrow('Approved notifications require at least one completed approval stage.')
  })

  it('renders a requester submission receipt with conditional HISD bus guidance', () => {
    const submitted = approvalNotificationFixtures.find(({ id }) => id === 'submitted')!
    const message = buildApprovalRequestMessage(submitted.model, submitted.state)
    const card = JSON.stringify(message.adaptiveCard)

    expect(message.subject).toBe('Request Submitted: Field Trip FTR-1042')
    for (const output of [message.html, message.text, card]) {
      expect(output).toContain('Your request has been submitted')
      expect(output).toContain('Please await completion of the approval process')
      expect(output).toContain('Transportation Services')
    }
    expect(message.html).toContain('background:#FFF7DD')
    for (const value of [submitted.model.uid, submitted.model.tripDateDisplay, submitted.model.primaryDestination]) {
      expect(message.html).toContain(value)
      expect(message.text).toContain(value)
      expect(card).toContain(value)
    }
    expect(message.html).toContain('data-trip-reminder="submitted"')
    expect(message.html).toContain('background:#F2FAFB')
    for (const value of ['Principal', 'Dr. Jordan Lee', 'Sr. Executive Director', 'Morgan Davis', 'Division Chief', 'Taylor Brooks']) {
      expect(message.html).toContain(value)
      expect(message.text).toContain(value)
      expect(card).toContain(value)
    }
    expect(message.html).toContain('data-approval-path="pending"')
    expect(message.html.match(/data-approval-route-step="pending"/g)).toHaveLength(3)
    expect(message.html.match(/data-approval-route-connector="pending"/g)).toHaveLength(2)

    const withoutHisdBuses = buildApprovalRequestMessage(
      { ...submitted.model, hisdBusTransportationRequested: false },
      submitted.state,
    )
    expect(withoutHisdBuses.html).not.toContain('Transportation Services coordination')
  })

  it('renders rejection comments with the submitted trip details', () => {
    const rejected = approvalNotificationFixtures.find(({ id }) => id === 'rejected')!
    const rejectedMessage = buildApprovalRequestMessage(rejected.model, rejected.state)

    expect(rejectedMessage.text).toContain('Trip conflicts with the campus testing schedule.')
    const rejectedCard = JSON.stringify(rejectedMessage.adaptiveCard)
    for (const value of [rejected.model.uid, rejected.model.tripDateDisplay, rejected.model.primaryDestination]) {
      expect(rejectedMessage.html).toContain(value)
      expect(rejectedMessage.text).toContain(value)
      expect(rejectedCard).toContain(value)
    }
    expect(rejectedMessage.html).toContain('data-trip-reminder="rejected"')
    expect(rejectedMessage.html).toContain('background:#F2FAFB')
  })

  it('takes the review URL and yellow-city submark URL only through inputs', () => {
    const message = buildApprovalRequestMessage(pending.model, pending.state, {
      yellowCitySubmarkUrl: 'https://assets.example.test/hisd-white-yellow-submark.svg',
    })
    const card = JSON.stringify(message.adaptiveCard)

    expect(card).toContain(pending.model.reviewUrl!)
    expect(card).toContain('https://assets.example.test/hisd-white-yellow-submark.svg')
    expect(message.html).toContain('https://assets.example.test/hisd-white-yellow-submark.svg')
    expect(message.html).toContain('alt="Houston Independent School District"')
    expect(message.html).toContain('>FTR-1042</a>')
    expect(JSON.stringify(buildApprovalRequestMessage({ ...pending.model, reviewUrl: undefined }, pending.state).adaptiveCard))
      .not.toContain('Review Request')
  })

  it('uses only a non-routable placeholder for presentation fixture links', () => {
    const fixture = buildApprovalRequestMessage(pending.model, pending.state)

    expect(pending.model.reviewUrl).toBe('https://example.invalid/approval-request/FTR-1042')
    expect(JSON.stringify(fixture)).toContain('example.invalid/approval-request/FTR-1042')
  })

  it('uses the handoff summary panel hierarchy while preserving the brief fields', () => {
    const previewHtml = buildApprovalRequestPreviewHtml(pending.model, pending.state)

    expect(previewHtml).toContain('background:#F2FAFB')
    expect(previewHtml).toContain('data-summary-panel="request"')
    expect(previewHtml).toContain('class="summary-cell" width="50%"')
    expect(previewHtml).toContain('font-family:ui-monospace,Consolas,monospace')
    expect(previewHtml).toContain('@media(max-width:480px)')
    expect(previewHtml).toContain('.summary-cell{display:block!important;width:100%!important;padding:8px 12px!important')
  })

  it('renders a separated full-width View Request action for every result state', () => {
    for (const fixtureId of ['submitted', 'approved', 'rejected', 'stale'] as const) {
      const fixture = approvalNotificationFixtures.find(({ id }) => id === fixtureId)!
      const previewHtml = buildApprovalRequestPreviewHtml(fixture.model, fixture.state)

      expect(previewHtml).toMatch(/data-result-action="view-request"[^>]+display:flex[^>]+width:100%[^>]+border-radius:8px/)
      expect(previewHtml).toContain('class="email-body" style="padding:26px 40px 32px"')
    }
  })

  it('escapes request-provided text in HTML and keeps fixtures out of renderer defaults', () => {
    const message = buildApprovalRequestMessage({
      ...pending.model,
      uid: '<script>alert(1)</script>',
      schoolName: 'A & B "School"',
    }, pending.state)

    expect(message.html).not.toContain('<script>')
    expect(message.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(message.html).toContain('A &amp; B &quot;School&quot;')
    expect(() => buildApprovalRequestMessage({} as never, pending.state)).toThrow()
  })

  it('produces an Outlook-compatible Adaptive Card 1.0 document', () => {
    for (const fixture of approvalNotificationFixtures) {
      const card = buildApprovalRequestMessage(fixture.model, fixture.state).adaptiveCard
      expect(validateOutlookAdaptiveCard(card)).toEqual([])
      expect(card.version).toBe('1.0')
      expect(card.$schema).toBe('https://adaptivecards.io/schemas/adaptive-card.json')
    }
  })

  it('provides all requested demo-safe preview fixtures', () => {
    expect(approvalNotificationFixtures.map(({ id }) => id)).toEqual([
      'pending',
      'pending-additional-review',
      'pending-title-i',
      'pending-title-i-hisd-bus',
      'reject-entry',
      'submitted',
      'approved',
      'rejected',
      'stale',
    ])
  })
})

import { describe, expect, it } from 'vitest'
import {
  buildExperiencePassEmail,
  demoNotificationContext,
  emailTemplateFixtures,
} from './approvalRequestNotification'

const templateIds = emailTemplateFixtures.map(({ id }) => id)

describe('finalized ExperiencePass email templates', () => {
  it('uses the spaced Experience Pass product name in every stakeholder-facing email', () => {
    for (const fixture of emailTemplateFixtures) {
      const message = buildExperiencePassEmail(fixture.id, fixture.context)
      expect(message.html).not.toContain('ExperiencePass')
      expect(message.text).not.toContain('ExperiencePass')
    }
  })

  it('publishes the complete requester, approver, and department template set', () => {
    expect(templateIds).toEqual([
      'submitted-receipt',
      'submitted-receipt-title-i',
      'submitted-receipt-hisd-bus',
      'submitted-receipt-title-i-hisd-bus',
      'approved',
      'rejected',
      'request-for-details',
      'pending-approval',
      'pending-approval-additional-review',
      'awaiting-approval',
      'already-actioned',
      'cte-notification',
      'title-i-notification',
      'transportation-services-notification',
    ])
  })

  it('uses the finalized alternative detail fields for requester receipts and approver review', () => {
    const submitted = buildExperiencePassEmail('submitted-receipt', demoNotificationContext)
    for (const label of ['Campus', 'Sponsor Name', 'Destination', 'Trip Dates', 'Transportation Requested']) {
      expect(submitted.html).toContain(label)
    }
    expect(submitted.subject).toBe('Request Submitted: Field Trip - Jones High School - August 18, 2026 - Local')

    const bus = buildExperiencePassEmail('submitted-receipt-hisd-bus', demoNotificationContext)
    for (const value of ['Trip Type', 'Number of Buses', 'HISD Bus', '2']) expect(bus.html).toContain(value)

    const pending = buildExperiencePassEmail('pending-approval', demoNotificationContext)
    for (const value of ['Sponsor', 'Transportation Requestor', 'Manuel Umanzor']) expect(pending.html).toContain(value)
  })

  it('keeps Title I and Transportation notices only on the matching requester receipts', () => {
    const standard = buildExperiencePassEmail('submitted-receipt', demoNotificationContext)
    const titleI = buildExperiencePassEmail('submitted-receipt-title-i', demoNotificationContext)
    const bus = buildExperiencePassEmail('submitted-receipt-hisd-bus', demoNotificationContext)
    const combined = buildExperiencePassEmail('submitted-receipt-title-i-hisd-bus', demoNotificationContext)

    expect(standard.html).not.toContain('Title I coordination')
    expect(standard.html).not.toContain('Transportation Services coordination')
    expect(titleI.html).toContain('Title I coordination')
    expect(titleI.html).not.toContain('Transportation Services coordination')
    expect(bus.html).not.toContain('Title I coordination')
    expect(bus.html).toContain('Transportation Services coordination')
    expect(combined.html).toContain('Title I coordination')
    expect(combined.html).toContain('Transportation Services coordination')
    expect(combined.html.indexOf('Expected approval path')).toBeLessThan(combined.html.indexOf('Title I coordination'))
    expect(combined.html.indexOf('Expected approval path')).toBeLessThan(combined.html.indexOf('Transportation Services coordination'))
  })

  it.each(['cte-notification', 'title-i-notification'] as const)(
    '%s links to the Experience Pass Data Workspace and directs follow-up to the latest approver',
    (templateId) => {
      const message = buildExperiencePassEmail(templateId, demoNotificationContext)
      for (const value of ['Latest Approver', 'Jane Smith', 'Senior Executive Director', 'jsmith@houstonisd.org']) {
        expect(message.html).toContain(value)
        expect(message.text).toContain(value)
      }
      expect(message.html).toContain('coordinate with the latest approver in the approval chain')
      expect(message.html).toContain('Experience Pass Data Workspace')
      expect(message.html).toContain('View in Data Workspace')
      expect(message.html).toContain(demoNotificationContext.dataWorkspaceUrl)
      expect(message.text).toContain(`View in Data Workspace: ${demoNotificationContext.dataWorkspaceUrl}`)
      expect(message.html).not.toContain('>Approve<')
      expect(message.html).not.toContain('>Reject<')
    },
  )

  it('gives Transportation Services the campus and trip context plus an application link', () => {
    const message = buildExperiencePassEmail('transportation-services-notification', demoNotificationContext)

    for (const value of [
      'Jones High School',
      'Campus Number',
      '101',
      'Houston Museum of Natural Science',
      'August 18, 2026',
      'Local field trip for 84 students and 8 chaperones',
      'View Request',
    ]) expect(message.html).toContain(value)

    expect(message.html).not.toContain('Latest Approver')
    expect(message.html).not.toContain('>Approve<')
    expect(message.html).not.toContain('>Reject<')
  })

  it.each(['pending-approval', 'pending-approval-additional-review'] as const)(
    '%s sends the approver to Experience Pass instead of offering email decisions',
    (templateId) => {
      const message = buildExperiencePassEmail(templateId, demoNotificationContext)

      expect(message.html).toContain('View Request')
      expect(message.html).not.toContain('>Approve<')
      expect(message.html).not.toContain('>Reject<')
      expect(message.html).not.toContain('Confirm Reject')
    },
  )

  it('renders one informational Awaiting Approval template with a dynamic review duration', () => {
    const message = buildExperiencePassEmail('awaiting-approval', {
      ...demoNotificationContext,
      awaitingReviewDuration: '1 business day',
    })

    for (const value of [
      'Awaiting Approval',
      'This request has been awaiting review for 1 business day.',
      'Jones High School',
      'Houston Museum of Natural Science',
      'August 18, 2026',
      'Ana Morales',
    ]) {
      expect(message.html).toContain(value)
      expect(message.text).toContain(value)
    }
    expect(message.html).toContain('>Review Request</a>')
    expect(message.text).toContain(`Review Request: ${demoNotificationContext.reviewUrl}`)
    expect(message.html).not.toContain('>Approve<')
    expect(message.html).not.toContain('>Reject<')
    expect(message.html).not.toContain('>Return<')
  })

  it('uses the same light teal treatment for the email header and footer', () => {
    const message = buildExperiencePassEmail('submitted-receipt', demoNotificationContext)

    expect(message.html).toContain('class="email-header" style="padding:20px 40px;background:#E6F6F7')
    expect(message.html).toContain('class="email-footer" style="padding:20px 40px;background:#E6F6F7')
  })

  it('retains normal dynamic field substitution for notification context values', () => {
    const message = buildExperiencePassEmail('cte-notification', {
      ...demoNotificationContext,
      uid: 'FTR-2099',
      campusName: 'Northside High School',
      destination: 'Space Center Houston',
      latestApprover: {
        name: 'Alex Rivera',
        role: 'Area Chief',
        email: 'arivera@houstonisd.org',
      },
      dataWorkspaceUrl: 'https://experience-pass-data-workspace.example.invalid/requests/FTR-2099',
    })

    for (const value of ['FTR-2099', 'Northside High School', 'Space Center Houston', 'Alex Rivera', 'Area Chief', 'arivera@houstonisd.org']) {
      expect(message.html).toContain(value)
      expect(message.text).toContain(value)
    }
    expect(message.html).not.toContain('Jane Smith')
    expect(message.html).toContain('https://experience-pass-data-workspace.example.invalid/requests/FTR-2099')
  })

  it('standardizes every non-CTE and non-Title I action as View Request', () => {
    for (const fixture of emailTemplateFixtures.filter(({ id }) => !['cte-notification', 'title-i-notification', 'awaiting-approval'].includes(id))) {
      const message = buildExperiencePassEmail(fixture.id, fixture.context)
      if (message.html.includes('<div style="margin-top:26px">')) {
        expect(message.html).toContain('>View Request</a>')
        expect(message.text).toContain(`View Request: ${fixture.context.reviewUrl}`)
      }
    }
  })

  it('keeps all preview links backend-agnostic and non-routable', () => {
    for (const fixture of emailTemplateFixtures) {
      const message = buildExperiencePassEmail(fixture.id, fixture.context)
      if (fixture.id === 'cte-notification' || fixture.id === 'title-i-notification') {
        expect(message.html).toContain('https://experience-pass-data-workspace.example.invalid/requests/FTR-1042')
      } else if (message.html.includes('<div style="margin-top:26px">')) {
        expect(message.html).toContain('https://experience-pass.example.invalid/requests/FTR-1042')
      }
    }
  })

  it('uses the existing blue-city HISD mark instead of the yellow-city email submark', () => {
    const message = buildExperiencePassEmail('submitted-receipt', demoNotificationContext)

    expect(message.html).toContain('data:image/svg+xml')
    expect(message.html).toContain('%234975bd')
    expect(message.html).not.toContain('hisd-logo-submark-white-yellow')
    expect(message.html).not.toContain('%23ffd100')
  })

})

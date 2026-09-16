import { hisdBlueCityLogoDataUrl } from '../branding/experiencePassBrand'

export type EmailAudience = 'requester' | 'approver' | 'department'

export type EmailTemplateId =
  | 'submitted-receipt'
  | 'submitted-receipt-title-i'
  | 'submitted-receipt-hisd-bus'
  | 'submitted-receipt-title-i-hisd-bus'
  | 'approved'
  | 'rejected'
  | 'request-for-details'
  | 'pending-approval'
  | 'pending-approval-additional-review'
  | 'already-actioned'
  | 'cte-notification'
  | 'title-i-notification'
  | 'transportation-services-notification'

export type ApprovalRouteStep = {
  stage: string
  approverName: string
}

export type NotificationContext = {
  uid: string
  campusName: string
  campusNumber: string
  requesterName: string
  sponsorName: string
  transportationRequestorName: string
  tripType: string
  tripDateDisplay: string
  destination: string
  studentCount: number
  chaperoneCount: number
  numberOfBuses: number
  currentApprovalStage: string
  reviewUrl: string
  approvalPath: readonly ApprovalRouteStep[]
  rejectionReason: string
  requestedDetails: string
  latestApprover: {
    name: string
    role: string
    email: string
  }
}

export type EmailTemplateFixture = {
  id: EmailTemplateId
  audience: EmailAudience
  label: string
  description: string
  context: NotificationContext
}

export type BuiltExperiencePassEmail = {
  subject: string
  html: string
  text: string
}

type Detail = readonly [label: string, value: string]
type StatusTone = 'teal' | 'blue' | 'green' | 'red' | 'yellow'
type TemplatePresentation = {
  audience: EmailAudience
  label: string
  description: string
  headerLabel: string
  status: string
  statusTone: StatusTone
  subject: string
  introduction: string
  details: readonly Detail[]
  sections: string
  textSections: readonly string[]
  actions: string
}

export const demoNotificationContext: NotificationContext = {
  uid: 'FTR-1042',
  campusName: 'Jones High School',
  campusNumber: '101',
  requesterName: 'Ana Morales',
  sponsorName: 'Ana Morales',
  transportationRequestorName: 'Manuel Umanzor',
  tripType: 'Local',
  tripDateDisplay: 'August 18, 2026',
  destination: 'Houston Museum of Natural Science',
  studentCount: 84,
  chaperoneCount: 8,
  numberOfBuses: 2,
  currentApprovalStage: 'Principal',
  reviewUrl: 'https://experience-pass.example.invalid/requests/FTR-1042',
  approvalPath: [
    { stage: 'Principal', approverName: 'Dr. Jordan Lee' },
    { stage: 'Senior Executive Director', approverName: 'Jane Smith' },
    { stage: 'Division Chief', approverName: 'Taylor Brooks' },
  ],
  rejectionReason: 'Trip conflicts with the campus testing schedule.',
  requestedDetails: 'Please clarify the instructional objective and attach the finalized itinerary.',
  latestApprover: {
    name: 'Jane Smith',
    role: 'Senior Executive Director',
    email: 'jsmith@houstonisd.org',
  },
}

const fixture = (
  id: EmailTemplateId,
  audience: EmailAudience,
  label: string,
  description: string,
  context: NotificationContext = demoNotificationContext,
): EmailTemplateFixture => ({ id, audience, label, description, context })

export const emailTemplateFixtures: readonly EmailTemplateFixture[] = [
  fixture('submitted-receipt', 'requester', 'Submitted Receipt', 'Confirms submission and shows the expected approval path.'),
  fixture('submitted-receipt-title-i', 'requester', 'Submitted Receipt · Title I', 'Adds the passive Title I coordination notice below the approval path.'),
  fixture('submitted-receipt-hisd-bus', 'requester', 'Submitted Receipt · HISD Bus', 'Adds HISD bus details and Transportation Services guidance.'),
  fixture('submitted-receipt-title-i-hisd-bus', 'requester', 'Submitted Receipt · Title I + HISD Bus', 'Shows both external coordination notices below the approval path.'),
  fixture('approved', 'requester', 'Approved', 'Confirms every displayed approval stage and reminds the requester of trip details.', { ...demoNotificationContext, numberOfBuses: 2 }),
  fixture('rejected', 'requester', 'Rejected', 'Explains the rejection and keeps the request details available.'),
  fixture('request-for-details', 'requester', 'Request for Details', 'Tells the requester what must be clarified in ExperiencePass.'),
  fixture('pending-approval', 'approver', 'Pending Approval', 'Directs the approver to review and act in ExperiencePass.'),
  fixture('pending-approval-additional-review', 'approver', 'Pending Approval · Additional Review', 'Uses the blue additional-review status and directs the approver to ExperiencePass.'),
  fixture('already-actioned', 'approver', 'Already Actioned', 'Explains that approval is no longer available and links to the current request.'),
  fixture('cte-notification', 'department', 'CTE Notification', 'Notifies CTE and identifies the latest approver for follow-up.'),
  fixture('title-i-notification', 'department', 'Title I Notification', 'Notifies Title I and identifies the latest approver for follow-up.'),
  fixture('transportation-services-notification', 'department', 'Transportation Services Notification', 'Provides the campus and trip context needed to continue in ExperiencePass.'),
]

export function buildExperiencePassEmail(
  templateId: EmailTemplateId,
  context: NotificationContext,
): BuiltExperiencePassEmail {
  assertContext(context)
  const presentation = presentationFor(templateId, context)
  const detailHtml = renderDetails(presentation.details)
  const heading = `Field Trip Request ${context.uid}`
  const status = renderStatus(presentation.status, presentation.statusTone)
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(presentation.subject)}</title><style>@media(max-width:480px){.email-outer{padding:12px 6px!important}.email-body{padding:22px 20px 24px!important}.email-header,.email-footer{padding:17px 20px!important}.summary-cell{display:block!important;width:100%!important;padding:9px 14px!important}.email-actions{flex-direction:column!important}.email-actions>*{width:100%!important;flex:none!important}.request-heading{font-size:19px!important}}</style></head><body style="margin:0;background:#F8F9F9;color:#24383C;font-family:'Radio Canada',Arial,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;background:#F8F9F9"><tr><td class="email-outer" align="center" style="padding:24px 12px"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;border-collapse:separate;border-spacing:0;background:#FFFFFF;border:1px solid #D9DFE0;border-radius:10px;box-shadow:1.5px 2.6px 3px 1px rgba(36,56,60,.16);overflow:hidden"><tr><td class="email-header" style="padding:20px 40px;background:#E6F6F7;border-radius:10px 10px 0 0"><div style="display:flex;align-items:center;gap:12px"><img src="${escapeHtml(hisdBlueCityLogoDataUrl)}" height="24" alt="Houston Independent School District" style="display:block;width:auto;height:24px"><span aria-hidden="true" style="display:inline-block;width:1px;height:34px;background:#AFCBCD"></span><div style="display:flex;flex-direction:column;justify-content:center"><span style="color:#24383C;font-family:'Parkinsans','Radio Canada',Arial,sans-serif;font-size:16px;font-weight:700;line-height:1.25">Experience Pass</span><span style="margin-top:3px;color:#006F78;font-size:10px;font-weight:700;letter-spacing:.06em;line-height:1.25;text-transform:uppercase">${escapeHtml(presentation.headerLabel)}</span></div></div></td></tr><tr><td class="email-body" style="padding:28px 40px 32px"><h1 class="request-heading" style="margin:0;color:#24383C;font-family:'Parkinsans','Radio Canada',Arial,sans-serif;font-size:22px;line-height:1.3">${escapeHtml(heading)}</h1>${status}<p style="margin:14px 0 0;color:#526468;font-size:14px;line-height:1.6">${escapeHtml(presentation.introduction)}</p><div style="margin-top:24px">${detailHtml}</div>${presentation.sections}${presentation.actions}</td></tr><tr><td class="email-footer" style="padding:20px 40px;background:#E6F6F7;border-radius:0 0 10px 10px;color:#24383C;font-size:11.5px;line-height:1.6"><p style="margin:0 0 4px">This is an automated notification from Experience Pass. Please do not reply to this email.</p><p style="margin:0;color:#526468">Houston Independent School District &middot; 4400 W. 18th St, Houston, TX 77092</p></td></tr></table></td></tr></table></body></html>`

  const text = [
    presentation.headerLabel.toUpperCase(),
    '',
    heading,
    `Status: ${presentation.status}`,
    presentation.introduction,
    '',
    ...presentation.details.map(([label, value]) => `${label}: ${value}`),
    ...presentation.textSections,
    context.reviewUrl && presentation.actions ? `\nOpen Request in ExperiencePass: ${context.reviewUrl}` : '',
    '',
    'This is an automated notification from Experience Pass. Please do not reply to this email.',
  ].filter(Boolean).join('\n')

  return { subject: presentation.subject, html, text }
}

function presentationFor(templateId: EmailTemplateId, context: NotificationContext): TemplatePresentation {
  const submittedSubject = `Request Submitted: Field Trip - ${context.campusName} - ${context.tripDateDisplay} - ${context.tripType}`
  const basicDetails: readonly Detail[] = [
    ['Campus', context.campusName],
    ['Sponsor Name', context.sponsorName],
    ['Destination', context.destination],
    ['Trip Dates', context.tripDateDisplay],
    ['Transportation Requested', 'Charter Bus'],
  ]
  const busDetails: readonly Detail[] = [
    ['Campus', context.campusName],
    ['Sponsor Name', context.sponsorName],
    ['Destination', context.destination],
    ['Trip Type', context.tripType],
    ['Trip Dates', context.tripDateDisplay],
    ['Transportation Requested', 'HISD Bus'],
    ['Number of Buses', String(context.numberOfBuses)],
  ]
  const approverDetails: readonly Detail[] = [
    ['Campus', context.campusName],
    ['Requester', context.requesterName],
    ['Sponsor', context.sponsorName],
    ['Destination', context.destination],
    ['Trip Date', context.tripDateDisplay],
    ['Trip Type', context.tripType],
    ['Current Approval Stage', context.currentApprovalStage],
    ['Transportation Requestor', context.transportationRequestorName],
  ]
  const requestDetails: readonly Detail[] = [
    ['Campus', context.campusName],
    ['Sponsor Name', context.sponsorName],
    ['Destination', context.destination],
    ['Trip Dates', context.tripDateDisplay],
    ['Trip Type', context.tripType],
  ]
  const approvalPath = renderApprovalPath(context.approvalPath, false)
  const approvalPathText = ['\nExpected approval path:', ...context.approvalPath.map(({ stage, approverName }, index) => `${index + 1}. ${stage} — ${approverName}`)]
  const titleINotice = renderPassiveNotice('Title I coordination', 'This Local field trip includes Title I funding. Title I will be reaching out on a separate timeline. Please watch for communications about next steps.')
  const transportationNotice = renderPassiveNotice('Transportation Services coordination', 'HISD bus transportation was requested. Transportation Services coordination is handled in a separate system. No contact timeline is currently available.', 'If you have not already been contacted, please watch for communications about scheduling and further coordination.')
  const openRequest = renderOpenRequest(context.reviewUrl)

  switch (templateId) {
    case 'submitted-receipt':
    case 'submitted-receipt-title-i':
    case 'submitted-receipt-hisd-bus':
    case 'submitted-receipt-title-i-hisd-bus': {
      const titleI = templateId === 'submitted-receipt-title-i' || templateId === 'submitted-receipt-title-i-hisd-bus'
      const bus = templateId === 'submitted-receipt-hisd-bus' || templateId === 'submitted-receipt-title-i-hisd-bus'
      const notices = `${titleI ? titleINotice : ''}${bus ? transportationNotice : ''}`
      return {
        audience: 'requester',
        label: 'Submitted Receipt',
        description: 'Submission receipt',
        headerLabel: 'Submission Receipt',
        status: 'Submitted',
        statusTone: 'teal',
        subject: submittedSubject,
        introduction: 'Your request has been submitted. Please await completion of the approval process.',
        details: bus ? busDetails : basicDetails,
        sections: `${approvalPath}${notices}`,
        textSections: [...approvalPathText, ...(titleI ? ['\nTitle I coordination', 'Title I will be reaching out on a separate timeline.'] : []), ...(bus ? ['\nTransportation Services coordination', 'No contact timeline is currently available.'] : [])],
        actions: openRequest,
      }
    }
    case 'approved':
      return {
        audience: 'requester', label: 'Approved', description: 'Final approval', headerLabel: 'Approval Notification', status: 'Approved', statusTone: 'green',
        subject: `Field Trip Request ${context.uid} Approved`,
        introduction: 'All displayed ExperiencePass approval stages are complete. Keep the trip date and destination below for reference.',
        details: requestDetails,
        sections: `${renderApprovalPath(context.approvalPath, true)}${transportationNotice}`,
        textSections: ['\nCompleted approval stages:', ...context.approvalPath.map(({ stage, approverName }) => `✓ ${stage} — ${approverName}`), '\nTransportation Services coordination', 'No contact timeline is currently available.'],
        actions: openRequest,
      }
    case 'rejected':
      return {
        audience: 'requester', label: 'Rejected', description: 'Rejected request', headerLabel: 'Approval Notification', status: 'Rejected', statusTone: 'red',
        subject: `Field Trip Request ${context.uid} Rejected`, introduction: 'The request was not approved. Review the reason below and open the request for the authoritative record.', details: requestDetails,
        sections: renderMessagePanel('Rejection reason', context.rejectionReason, 'red'), textSections: ['\nRejection reason:', context.rejectionReason], actions: openRequest,
      }
    case 'request-for-details':
      return {
        audience: 'requester', label: 'Request for Details', description: 'Details requested', headerLabel: 'Approval Notification', status: 'Details Requested', statusTone: 'blue',
        subject: `Additional Details Requested: Field Trip ${context.uid}`, introduction: 'Additional information is needed before the approval process can continue.', details: requestDetails,
        sections: renderMessagePanel('Requested information', context.requestedDetails, 'blue'), textSections: ['\nRequested information:', context.requestedDetails], actions: renderOpenRequest(context.reviewUrl, 'Open Request in ExperiencePass'),
      }
    case 'pending-approval':
    case 'pending-approval-additional-review': {
      const additional = templateId === 'pending-approval-additional-review'
      return {
        audience: 'approver', label: additional ? 'Pending Approval · Additional Review' : 'Pending Approval', description: 'Approver notification', headerLabel: 'Approval Notification',
        status: additional ? 'Additional Review Required' : 'Action Required', statusTone: additional ? 'blue' : 'teal',
        subject: `Approval Request: Field Trip ${context.uid}`, introduction: `${context.campusName} submitted a ${context.tripType} field trip for your review as ${context.currentApprovalStage}.`,
        details: approverDetails, sections: '', textSections: [], actions: renderOpenRequest(context.reviewUrl, 'Open Request in ExperiencePass'),
      }
    }
    case 'already-actioned':
      return {
        audience: 'approver', label: 'Already Actioned', description: 'Approval no longer available', headerLabel: 'Approval Notification', status: 'Already Actioned', statusTone: 'yellow',
        subject: `Approval No Longer Available: Field Trip ${context.uid}`, introduction: 'This request no longer requires your approval. Open ExperiencePass to review the current request status.', details: approverDetails,
        sections: '', textSections: [], actions: openRequest,
      }
    case 'cte-notification':
    case 'title-i-notification': {
      const department = templateId === 'cte-notification' ? 'CTE' : 'Title I'
      return {
        audience: 'department', label: `${department} Notification`, description: `${department} coordination`, headerLabel: 'Department Notification', status: 'Coordination Requested', statusTone: 'blue',
        subject: `${department} Coordination: Field Trip ${context.uid}`, introduction: `This field trip request includes ${department} involvement. Review the general request information below. If follow-up or clarification is needed, coordinate with the latest approver in the approval chain.`,
        details: requestDetails, sections: renderLatestApprover(context), textSections: ['\nLatest Approver:', context.latestApprover.name, context.latestApprover.role, context.latestApprover.email],
        actions: renderOpenRequest(context.reviewUrl, 'Open Request in ExperiencePass'),
      }
    }
    case 'transportation-services-notification':
      return {
        audience: 'department', label: 'Transportation Services Notification', description: 'Transportation coordination', headerLabel: 'Department Notification', status: 'Transportation Coordination', statusTone: 'blue',
        subject: `Transportation Coordination: Field Trip ${context.uid}`, introduction: 'HISD bus transportation was requested. Use ExperiencePass for the operational request details and ongoing coordination.',
        details: [
          ['Campus', context.campusName], ['Campus Number', context.campusNumber], ['Sponsor Name', context.sponsorName],
          ['Trip Summary', `${context.tripType} field trip for ${context.studentCount} students and ${context.chaperoneCount} chaperones`],
          ['Destination', context.destination], ['Trip Date', context.tripDateDisplay], ['Number of Buses', String(context.numberOfBuses)],
        ],
        sections: '', textSections: [], actions: renderOpenRequest(context.reviewUrl, 'Open Request in ExperiencePass'),
      }
  }
}

function renderStatus(status: string, tone: StatusTone) {
  const colors: Record<StatusTone, readonly [string, string]> = {
    teal: ['#E6F6F7', '#006F78'], blue: ['#EAF1FB', '#31598F'], green: ['#E6F2EF', '#006F5B'], red: ['#FAEEEE', '#A9383D'], yellow: ['#FFF7DD', '#765710'],
  }
  const [background, color] = colors[tone]
  return `<div style="display:flex;align-items:center;gap:8px;margin-top:12px;color:#526468;font-size:14px;font-weight:700"><span>Status:</span><span style="display:inline-block;padding:6px 13px;border-radius:999px;background:${background};color:${color};font-size:12px;font-weight:800;letter-spacing:.04em;text-transform:uppercase">${escapeHtml(status)}</span></div>`
}

function renderDetails(details: readonly Detail[]) {
  const cells = details.map(([label, value]) => `<td class="summary-cell" width="50%" style="box-sizing:border-box;width:50%;padding:10px 14px;vertical-align:top"><div style="margin-bottom:3px;color:#52777A;font-size:10.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase">${escapeHtml(label)}</div><div style="color:#24383C;font-size:14px;font-weight:650;line-height:1.4">${escapeHtml(value)}</div></td>`)
  const rows: string[] = []
  for (let index = 0; index < cells.length; index += 2) rows.push(`<tr>${cells[index]}${cells[index + 1] ?? '<td width="50%"></td>'}</tr>`)
  return `<table data-summary-panel="final" role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:separate;border-spacing:0;background:#F2FAFB;border:1px solid #D9F0F2;border-radius:8px"><tbody>${rows.join('')}</tbody></table>`
}

function renderApprovalPath(steps: readonly ApprovalRouteStep[], complete: boolean) {
  const color = complete ? '#006F5B' : '#00838C'
  const background = complete ? '#E6F2EF' : '#E6F6F7'
  const items = steps.map(({ stage, approverName }, index) => {
    const connector = index < steps.length - 1 ? `<div aria-hidden="true" style="width:2px;height:30px;margin:4px 0 -2px 13px;background:${color};border-radius:2px"></div>` : ''
    const marker = complete ? '&#10003;' : String(index + 1)
    return `<div style="margin-top:${index === 0 ? '14px' : '0'}"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td width="38" style="width:38px;vertical-align:top"><span aria-hidden="true" style="box-sizing:border-box;display:inline-block;width:28px;height:28px;border:1.5px solid ${color};border-radius:50%;background:${background};color:${color};font:800 14px/25px Arial,sans-serif;text-align:center">${marker}</span>${connector}</td><td style="padding:1px 0 0;vertical-align:top"><div style="color:#24383C;font-size:14px;font-weight:800;line-height:1.35">${escapeHtml(stage)}</div><div style="margin-top:2px;color:#526468;font-size:13px;line-height:1.4">${escapeHtml(approverName)}</div></td></tr></table></div>`
  })
  return `<div style="margin-top:24px"><div style="color:${color};font-size:10.5px;font-weight:800;letter-spacing:.05em;text-transform:uppercase">${complete ? 'Completed approval stages' : 'Expected approval path'}</div>${complete ? '' : '<p style="margin:6px 0 0;color:#526468;font-size:13px;line-height:1.5">Your request will move through these approvers in order.</p>'}${items.join('')}</div>`
}

function renderPassiveNotice(title: string, first: string, second?: string) {
  return `<div style="margin-top:24px;padding:16px 18px;border-left:3px solid #D4A72C;border-radius:0 8px 8px 0;background:#FFF7DD"><div style="color:#8A6814;font-size:10.5px;font-weight:800;letter-spacing:.05em;text-transform:uppercase">${escapeHtml(title)}</div><p style="margin:6px 0 0;color:#5F4A12;font-size:14px;line-height:1.55">${escapeHtml(first)}</p>${second ? `<p style="margin:10px 0 0;color:#5F4A12;font-size:14px;line-height:1.55">${escapeHtml(second)}</p>` : ''}</div>`
}

function renderMessagePanel(title: string, message: string, tone: 'red' | 'blue') {
  const colors = tone === 'red' ? ['#D96364', '#FAEEEE', '#8F3034'] : ['#5AADE0', '#EAF5FC', '#31598F']
  return `<div style="margin-top:24px;padding:16px 18px;border-left:3px solid ${colors[0]};border-radius:0 8px 8px 0;background:${colors[1]}"><div style="color:${colors[2]};font-size:10.5px;font-weight:800;letter-spacing:.05em;text-transform:uppercase">${escapeHtml(title)}</div><p style="margin:6px 0 0;color:#24383C;font-size:14px;line-height:1.55">${escapeHtml(message)}</p></div>`
}

function renderLatestApprover(context: NotificationContext) {
  const approver = context.latestApprover
  return `<div style="margin-top:24px;padding:16px 18px;border:1px solid #D9F0F2;border-radius:8px;background:#F2FAFB"><div style="color:#00838C;font-size:10.5px;font-weight:800;letter-spacing:.05em;text-transform:uppercase">Latest Approver</div><div style="margin-top:8px;color:#24383C;font-size:15px;font-weight:800">${escapeHtml(approver.name)}</div><div style="margin-top:2px;color:#526468;font-size:13px">${escapeHtml(approver.role)}</div><a href="mailto:${escapeHtml(approver.email)}" style="display:inline-block;margin-top:5px;color:#1A5E9A;font-size:13px;font-weight:700">${escapeHtml(approver.email)}</a></div>`
}

function renderOpenRequest(url: string, label = 'View Request') {
  return `<div style="margin-top:26px"><a href="${escapeHtml(url)}" style="box-sizing:border-box;display:flex;width:100%;min-height:44px;padding:12px 20px;align-items:center;justify-content:center;border:1px solid #00838C;border-radius:8px;background:#00838C;color:#FFFFFF;text-align:center;text-decoration:none;font-weight:700">${escapeHtml(label)}</a></div>`
}

function assertContext(context: NotificationContext) {
  const required = [context.uid, context.campusName, context.campusNumber, context.requesterName, context.sponsorName, context.tripType, context.tripDateDisplay, context.destination, context.reviewUrl, context.latestApprover.name, context.latestApprover.role, context.latestApprover.email]
  if (required.some((value) => !value.trim()) || !context.approvalPath.length) throw new Error('ExperiencePass email context is incomplete.')
  try {
    const url = new URL(context.reviewUrl)
    if (url.protocol !== 'https:') throw new Error()
  } catch {
    throw new Error('ExperiencePass email links must use an HTTPS URL contract.')
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!)
}

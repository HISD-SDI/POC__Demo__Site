export const OUTLOOK_ADAPTIVE_CARD_VERSION = '1.0' as const
export const OUTLOOK_ADAPTIVE_CARD_SCHEMA = 'https://adaptivecards.io/schemas/adaptive-card.json' as const

export type ApprovalRequestNotification = {
  uid: string
  schoolName: string
  requesterName: string
  tripDateDisplay: string
  primaryDestination: string
  tripType: string
  approvalStage: string
  additionalReviewRequired: boolean
  titleIRequested: boolean
  hisdBusTransportationRequested: boolean
  reviewUrl?: string
}

export type ApprovalRouteStep = {
  stage: string
  approverName: string
}

export type ApprovalNotificationState =
  | { kind: 'pending' }
  | { kind: 'reject-entry' }
  | { kind: 'submitted'; approvalPath: readonly ApprovalRouteStep[] }
  | { kind: 'approved'; completedApprovals: readonly ApprovalRouteStep[] }
  | { kind: 'rejected'; comments: string }
  | { kind: 'stale' }

export type AdaptiveCardDocument = {
  $schema: typeof OUTLOOK_ADAPTIVE_CARD_SCHEMA
  type: 'AdaptiveCard'
  version: typeof OUTLOOK_ADAPTIVE_CARD_VERSION
  body: AdaptiveCardElement[]
  actions?: AdaptiveCardAction[]
}

type AdaptiveCardElement = Record<string, unknown> & { type: string }
type AdaptiveCardAction = Record<string, unknown> & { type: string; title: string }

export type ApprovalActionContract = {
  transport: 'unconfigured'
  supportedModels: readonly ['action-http', 'action-execute']
  decisions: readonly ['approve', 'reject']
}

export type ApprovalRequestMessage = {
  subject: string
  adaptiveCard: AdaptiveCardDocument
  html: string
  text: string
  actionContract: ApprovalActionContract
  metadata: {
    notificationType: 'approval-request' | 'request-submitted'
    requestUid: string
    state: ApprovalNotificationState['kind']
    reviewUrl?: string
    yellowCitySubmarkStatus: 'provided' | 'missing'
  }
}

export type ApprovalNotificationBranding = {
  yellowCitySubmarkUrl?: string
}

export type ApprovalNotificationFixture = {
  id: 'pending' | 'pending-additional-review' | 'pending-title-i' | 'pending-title-i-hisd-bus' | 'reject-entry' | 'submitted' | 'approved' | 'rejected' | 'stale'
  label: string
  description: string
  model: ApprovalRequestNotification
  state: ApprovalNotificationState
}

const requiredModelFields = [
  'uid',
  'schoolName',
  'requesterName',
  'tripDateDisplay',
  'primaryDestination',
  'tripType',
  'approvalStage',
] as const

const actionContract: ApprovalActionContract = {
  transport: 'unconfigured',
  supportedModels: ['action-http', 'action-execute'],
  decisions: ['approve', 'reject'],
}

const demoModel: ApprovalRequestNotification = {
  uid: 'FTR-1042',
  schoolName: 'Jones HS',
  requesterName: 'Manuel Umanzor',
  tripDateDisplay: 'August 18, 2026',
  primaryDestination: 'Houston Museum of Natural Science',
  tripType: 'Local',
  approvalStage: 'Principal',
  additionalReviewRequired: false,
  titleIRequested: false,
  hisdBusTransportationRequested: false,
  reviewUrl: 'https://example.invalid/approval-request/FTR-1042',
}

const demoApprovalPath: readonly ApprovalRouteStep[] = [
  { stage: 'Principal', approverName: 'Dr. Jordan Lee' },
  { stage: 'Sr. Executive Director', approverName: 'Morgan Davis' },
  { stage: 'Division Chief', approverName: 'Taylor Brooks' },
]

export const approvalNotificationFixtures: readonly ApprovalNotificationFixture[] = [
  {
    id: 'pending',
    label: 'Pending Approval',
    description: 'Standard Approval Request with all three approver actions.',
    model: demoModel,
    state: { kind: 'pending' },
  },
  {
    id: 'pending-additional-review',
    label: 'Pending · Additional Review',
    description: 'The restrained exception indicator is visible without exposing its reason.',
    model: { ...demoModel, additionalReviewRequired: true },
    state: { kind: 'pending' },
  },
  {
    id: 'pending-title-i',
    label: 'Pending · Title I',
    description: 'A Local Title I request notes that coordination will occur on a separate timeline.',
    model: { ...demoModel, titleIRequested: true },
    state: { kind: 'pending' },
  },
  {
    id: 'pending-title-i-hisd-bus',
    label: 'Pending · Title I + HISD Bus',
    description: 'A Local Title I request with HISD bus transportation keeps both coordination paths visible.',
    model: { ...demoModel, titleIRequested: true, hisdBusTransportationRequested: true },
    state: { kind: 'pending' },
  },
  {
    id: 'reject-entry',
    label: 'Reject Confirmation',
    description: 'A confirmation step prevents an accidental rejection without collecting comments in email.',
    model: demoModel,
    state: { kind: 'reject-entry' },
  },
  {
    id: 'submitted',
    label: 'Submitted Receipt',
    description: 'The requester is told the request was received and that the approval process is underway.',
    model: { ...demoModel, hisdBusTransportationRequested: true },
    state: { kind: 'submitted', approvalPath: demoApprovalPath },
  },
  {
    id: 'approved',
    label: 'Approved',
    description: 'All completed approval stages and conditional Transportation Services next steps are shown.',
    model: { ...demoModel, hisdBusTransportationRequested: true },
    state: {
      kind: 'approved',
      completedApprovals: demoApprovalPath,
    },
  },
  {
    id: 'rejected',
    label: 'Rejected',
    description: 'The refreshed result preserves the submitted rejection reason.',
    model: demoModel,
    state: { kind: 'rejected', comments: 'Trip conflicts with the campus testing schedule.' },
  },
  {
    id: 'stale',
    label: 'Already Actioned / Stale',
    description: 'No invalid decision action remains when the approval step is no longer active.',
    model: demoModel,
    state: { kind: 'stale' },
  },
]

export function buildApprovalRequestMessage(
  model: ApprovalRequestNotification,
  state: ApprovalNotificationState,
  branding: ApprovalNotificationBranding = {},
): ApprovalRequestMessage {
  assertValidModel(model)
  assertValidState(state)
  if (state.kind === 'rejected' && !state.comments.trim()) {
    throw new Error('Rejected notifications require submitted comments.')
  }

  return {
    subject: state.kind === 'submitted'
      ? `Request Submitted: Field Trip ${model.uid}`
      : `Approval Request: Field Trip ${model.uid}`,
    adaptiveCard: buildAdaptiveCard(model, state, branding),
    html: buildHtmlFallback(model, state, branding),
    text: buildTextFallback(model, state),
    actionContract,
    metadata: {
      notificationType: state.kind === 'submitted' ? 'request-submitted' : 'approval-request',
      requestUid: model.uid,
      state: state.kind,
      ...(model.reviewUrl ? { reviewUrl: model.reviewUrl } : {}),
      yellowCitySubmarkStatus: branding.yellowCitySubmarkUrl ? 'provided' : 'missing',
    },
  }
}

export function buildApprovalRequestPreviewHtml(
  model: ApprovalRequestNotification,
  state: ApprovalNotificationState,
  branding: ApprovalNotificationBranding = {},
) {
  assertValidModel(model)
  assertValidState(state)
  if (state.kind === 'rejected' && !state.comments.trim()) {
    throw new Error('Rejected notifications require submitted comments.')
  }
  return buildHtmlFallback(model, state, branding, true)
}

function assertValidModel(model: ApprovalRequestNotification) {
  for (const field of requiredModelFields) {
    if (typeof model?.[field] !== 'string' || !model[field].trim()) {
      throw new Error(`Approval Request notification requires ${field}.`)
    }
  }
  if (typeof model.additionalReviewRequired !== 'boolean') {
    throw new Error('Approval Request notification requires additionalReviewRequired.')
  }
  if (typeof model.titleIRequested !== 'boolean') {
    throw new Error('Approval Request notification requires titleIRequested.')
  }
  if (typeof model.hisdBusTransportationRequested !== 'boolean') {
    throw new Error('Approval Request notification requires hisdBusTransportationRequested.')
  }
}

function assertValidState(state: ApprovalNotificationState) {
  const approvals = state.kind === 'approved'
    ? state.completedApprovals
    : state.kind === 'submitted'
      ? state.approvalPath
      : undefined
  if (approvals && (
    !Array.isArray(approvals)
    || approvals.length === 0
    || approvals.some((approval) => (
      typeof approval?.stage !== 'string'
      || !approval.stage.trim()
      || typeof approval.approverName !== 'string'
      || !approval.approverName.trim()
    ))
  )) {
    throw new Error(state.kind === 'approved'
      ? 'Approved notifications require at least one completed approval stage.'
      : 'Submitted notifications require at least one expected approval stage.')
  }
}

function buildAdaptiveCard(
  model: ApprovalRequestNotification,
  state: ApprovalNotificationState,
  branding: ApprovalNotificationBranding,
): AdaptiveCardDocument {
  const body: AdaptiveCardElement[] = [
    {
      type: 'Container',
      style: 'emphasis',
      items: [
        ...(branding.yellowCitySubmarkUrl ? [{
          type: 'Image',
          url: branding.yellowCitySubmarkUrl,
          altText: 'Houston Independent School District',
          horizontalAlignment: 'Center',
          size: 'Medium',
        }] : []),
        {
          type: 'TextBlock',
          text: state.kind === 'submitted' ? 'REQUEST SUBMITTED' : 'APPROVAL REQUEST',
          horizontalAlignment: 'Center',
          weight: 'Bolder',
          color: 'Accent',
          spacing: 'Small',
        },
      ],
    },
    ...stateElements(model, state),
    {
      type: 'Container',
      separator: true,
      spacing: 'Large',
      items: [
        {
          type: 'TextBlock',
          text: 'This is an automated notification from Experience Pass.',
          horizontalAlignment: 'Center',
          wrap: true,
          size: 'Small',
          weight: 'Bolder',
        },
        {
          type: 'TextBlock',
          text: 'Please do not reply to this message.',
          horizontalAlignment: 'Center',
          wrap: true,
          size: 'Small',
          spacing: 'None',
          isSubtle: true,
        },
      ],
    },
  ]
  const actions = stateActions(model, state)

  return {
    $schema: OUTLOOK_ADAPTIVE_CARD_SCHEMA,
    type: 'AdaptiveCard',
    version: OUTLOOK_ADAPTIVE_CARD_VERSION,
    body,
    ...(actions.length ? { actions } : {}),
  }
}

function stateElements(model: ApprovalRequestNotification, state: ApprovalNotificationState): AdaptiveCardElement[] {
  if (state.kind === 'pending' || state.kind === 'reject-entry') {
    return [
      {
        type: 'TextBlock',
        text: state.kind === 'reject-entry' ? 'Reject Request' : 'A field trip needs your approval',
        size: 'Large',
        weight: 'Bolder',
        wrap: true,
      },
      {
        type: 'TextBlock',
        text: state.kind === 'reject-entry'
          ? 'Confirm that you want to reject this field trip request.'
          : `${model.schoolName} submitted a ${model.tripType} field trip for your review as ${model.approvalStage}.`,
        wrap: true,
        spacing: 'Small',
      },
      ...(model.additionalReviewRequired ? [{
        type: 'TextBlock',
        text: '⚠ Additional Review Required',
        color: 'Accent',
        weight: 'Bolder',
        wrap: true,
        spacing: 'Medium',
      }] : []),
      ...summaryElements(model),
      ...(state.kind === 'pending' ? titleICoordinationAdaptiveElements(model) : []),
      ...(state.kind === 'pending' ? transportationAdaptiveElements(model) : []),
      ...(state.kind === 'reject-entry' ? rejectionEntryElements(true) : rejectionEntryElements(false)),
    ]
  }

  const result = resultCopy(model, state)
  return [
    {
      type: 'TextBlock',
      text: result.heading,
      size: 'Large',
      weight: 'Bolder',
      color: result.color,
      wrap: true,
    },
    {
      type: 'TextBlock',
      text: result.message,
      wrap: true,
      spacing: 'Small',
    },
    ...(state.kind === 'approved' ? approvedReminderAdaptiveElements(model) : state.kind === 'submitted' || state.kind === 'rejected' ? requestBasicDetailsAdaptiveElements(model) : [{
      type: 'FactSet',
      separator: true,
      spacing: 'Medium',
      facts: [{ title: 'UID', value: model.uid }],
    }]),
    ...(state.kind === 'approved' ? approvedAdaptiveElements(model, state) : []),
    ...(state.kind === 'submitted' ? submittedApprovalPathAdaptiveElements(state) : []),
    ...(state.kind === 'submitted' ? transportationAdaptiveElements(model) : []),
    ...(state.kind === 'rejected' ? [{
      type: 'TextBlock',
      text: `**Rejection comments**\n\n${state.comments}`,
      wrap: true,
      separator: true,
      spacing: 'Medium',
    }] : []),
  ]
}

function approvedAdaptiveElements(
  model: ApprovalRequestNotification,
  state: Extract<ApprovalNotificationState, { kind: 'approved' }>,
): AdaptiveCardElement[] {
  return [
    ...state.completedApprovals.map(({ stage, approverName }, index) => ({
      type: 'TextBlock',
      text: `✓ **${stage}**\n${approverName}`,
      wrap: true,
      separator: index === 0,
      spacing: index === 0 ? 'Medium' : 'Small',
      color: 'Good',
    })),
    ...transportationAdaptiveElements(model),
  ]
}

function approvedReminderAdaptiveElements(model: ApprovalRequestNotification): AdaptiveCardElement[] {
  return [{
    type: 'Container',
    style: 'emphasis',
    separator: true,
    spacing: 'Medium',
    items: [{
      type: 'FactSet',
      facts: [
        { title: 'Trip Date', value: model.tripDateDisplay },
        { title: 'Primary Destination', value: model.primaryDestination },
      ],
    }],
  }]
}

function requestBasicDetailsAdaptiveElements(model: ApprovalRequestNotification): AdaptiveCardElement[] {
  return [{
    type: 'Container',
    style: 'emphasis',
    separator: true,
    spacing: 'Medium',
    items: [{
      type: 'FactSet',
      facts: [
        { title: 'UID', value: model.uid },
        { title: 'Trip Date', value: model.tripDateDisplay },
        { title: 'Primary Destination', value: model.primaryDestination },
      ],
    }],
  }]
}

function submittedApprovalPathAdaptiveElements(
  state: Extract<ApprovalNotificationState, { kind: 'submitted' }>,
): AdaptiveCardElement[] {
  return [{
    type: 'TextBlock',
    text: '**Expected approval path**\n\nYour request will move through these approvers in order.',
    wrap: true,
    separator: true,
    spacing: 'Medium',
    color: 'Accent',
  }, ...state.approvalPath.map(({ stage, approverName }, index) => ({
    type: 'TextBlock',
    text: `${index + 1}. **${stage}**\n${approverName}`,
    wrap: true,
    spacing: 'Small',
  }))]
}

function transportationAdaptiveElements(model: ApprovalRequestNotification): AdaptiveCardElement[] {
  if (!model.hisdBusTransportationRequested) return []
  return [{
    type: 'TextBlock',
    text: `**Transportation Services coordination**\n\n${transportationCoordinationCopy}`,
    wrap: true,
    separator: true,
    spacing: 'Medium',
    color: 'Warning',
  }]
}

function titleICoordinationAdaptiveElements(model: ApprovalRequestNotification): AdaptiveCardElement[] {
  if (!isLocalTitleIRequest(model)) return []
  return [{
    type: 'TextBlock',
    text: `**Title I coordination**\n\n${titleICoordinationCopy}`,
    wrap: true,
    separator: true,
    spacing: 'Medium',
    color: 'Warning',
  }]
}

function summaryElements(model: ApprovalRequestNotification): AdaptiveCardElement[] {
  return [
    {
      type: 'FactSet',
      separator: true,
      spacing: 'Large',
      facts: [
        { title: 'UID', value: model.uid },
        { title: 'Trip Date', value: model.tripDateDisplay },
        { title: 'School', value: model.schoolName },
        { title: 'Requester', value: model.requesterName },
        { title: 'Primary Destination', value: model.primaryDestination },
        { title: 'Trip Type', value: model.tripType },
        { title: 'Current Approval Stage', value: model.approvalStage },
      ],
    },
  ]
}

function rejectionEntryElements(visible: boolean): AdaptiveCardElement[] {
  return [{
    type: 'Container',
    id: 'reject-entry',
    isVisible: visible,
    separator: true,
    spacing: 'Large',
    items: [
      {
        type: 'TextBlock',
        text: 'Reject this request?',
        weight: 'Bolder',
        wrap: true,
      },
      {
        type: 'ActionSet',
        actions: [
          {
            type: 'Action.ToggleVisibility',
            title: 'Confirm Reject',
            targetElements: ['transport-unconfigured'],
          },
          {
            type: 'Action.ToggleVisibility',
            title: 'Cancel',
            targetElements: ['reject-entry'],
          },
        ],
      },
    ],
  }, {
    type: 'TextBlock',
    id: 'transport-unconfigured',
    isVisible: false,
    text: 'POC preview only — no decision was sent or recorded.',
    color: 'Warning',
    wrap: true,
  }]
}

function stateActions(model: ApprovalRequestNotification, state: ApprovalNotificationState): AdaptiveCardAction[] {
  if (state.kind === 'pending') {
    return [
      {
        type: 'Action.ToggleVisibility',
        title: 'Approve',
        targetElements: ['transport-unconfigured'],
      },
      {
        type: 'Action.ToggleVisibility',
        title: 'Reject',
        targetElements: ['reject-entry'],
      },
      ...(model.reviewUrl ? [openUrlAction('Request Details', model.reviewUrl)] : []),
    ]
  }
  if (state.kind === 'reject-entry') return []
  return model.reviewUrl ? [openUrlAction('View Request', model.reviewUrl)] : []
}

function openUrlAction(title: string, url: string): AdaptiveCardAction {
  return { type: 'Action.OpenUrl', title, url }
}

function resultCopy(
  model: ApprovalRequestNotification,
  state: Exclude<ApprovalNotificationState, { kind: 'pending' | 'reject-entry' }>,
) {
  switch (state.kind) {
    case 'submitted':
      return {
        heading: 'Your request has been submitted',
        message: 'Please await completion of the approval process.',
        color: 'Accent',
      }
    case 'approved':
      return {
        heading: `Request ${model.uid} has been approved`,
        message: 'The completed approval stages are listed below.',
        color: 'Good',
      }
    case 'rejected':
      return { heading: 'Request Rejected', message: 'The rejection was recorded successfully.', color: 'Attention' }
    case 'stale':
      return { heading: 'Approval No Longer Available', message: 'This request no longer requires your approval.', color: 'Warning' }
  }
}

function buildHtmlFallback(
  model: ApprovalRequestNotification,
  state: ApprovalNotificationState,
  branding: ApprovalNotificationBranding,
  includePreviewActions = false,
) {
  const result = state.kind === 'pending' || state.kind === 'reject-entry' ? undefined : resultCopy(model, state)
  const heading = state.kind === 'pending'
    ? 'A field trip needs your approval'
    : state.kind === 'reject-entry'
      ? 'Reject Request'
      : result!.heading
  const support = state.kind === 'pending'
    ? `${model.schoolName} submitted a ${model.tripType} field trip for your review as ${model.approvalStage}.`
    : state.kind === 'reject-entry'
      ? 'Confirm that you want to reject this field trip request.'
      : result!.message
  const reviewLink = model.reviewUrl && state.kind !== 'reject-entry'
    ? includePreviewActions && state.kind === 'pending'
      ? `<a data-preview-action="details" href="${escapeHtml(model.reviewUrl)}" style="box-sizing:border-box;display:inline-flex;flex:1;min-width:108px;min-height:44px;padding:11px 16px;align-items:center;justify-content:center;border:1.5px solid #BCC7C9;border-radius:8px;background:#ffffff;color:#24383C;text-decoration:none;font:700 14px Arial,sans-serif">Request Details</a>`
      : state.kind === 'pending'
        ? `<a href="${escapeHtml(model.reviewUrl)}" style="display:inline-block;padding:12px 20px;border:1.5px solid #BCC7C9;border-radius:8px;background:#FFFFFF;color:#24383C;text-decoration:none;font-weight:700">Request Details</a>`
        : `<a data-result-action="view-request" href="${escapeHtml(model.reviewUrl)}" style="box-sizing:border-box;display:flex;width:100%;min-height:44px;padding:12px 20px;align-items:center;justify-content:center;border:1px solid #00838C;border-radius:8px;background:#00838C;color:#FFFFFF;text-align:center;text-decoration:none;font-weight:700">View Request</a>`
    : ''
  const summary = state.kind === 'pending' || state.kind === 'reject-entry'
    ? summaryPanel(model)
    : state.kind === 'approved'
      ? approvedTripReminderPanel(model)
      : state.kind === 'submitted' || state.kind === 'rejected'
        ? requestBasicDetailsPanel(model, state.kind)
        : `<div style="background:#F2FAFB;border:1px solid #D9F0F2;border-radius:8px;padding:18px 20px"><div style="color:#52777A;font-size:10.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase">UID</div><div style="margin-top:3px;color:#24383C;font:700 14px ui-monospace,Consolas,monospace">${escapeHtml(model.uid)}</div></div>`
  const summarySection = summary ? `<div style="margin-top:26px">${summary}</div>` : ''
  const comments = state.kind === 'rejected'
    ? `<div style="margin:24px 0 0;padding:16px;border-left:4px solid #D96364;background:#F5F5F5"><strong>Rejection comments</strong><p style="margin:8px 0 0">${escapeHtml(state.comments)}</p></div>`
    : ''
  const approvedDetails = state.kind === 'approved' ? approvalChainHtml(state.completedApprovals) : ''
  const submittedApprovalPath = state.kind === 'submitted' ? approvalPathHtml(state.approvalPath) : ''
  const titleIDetails = state.kind === 'pending' ? titleICoordinationHtml(model) : ''
  const transportationDetails = (state.kind === 'pending' || state.kind === 'approved' || state.kind === 'submitted')
    ? transportationCoordinationHtml(model)
    : ''
  const rejectPreview = ''
  const previewDecisionActions = includePreviewActions && state.kind === 'pending'
    ? '<button data-preview-action="approve" type="button" aria-describedby="preview-action-note" style="box-sizing:border-box;flex:1;min-width:108px;min-height:44px;padding:11px 16px;border:1.5px solid #00A3AF;border-radius:8px;background:#00A3AF;color:#ffffff;font:700 14px Arial,sans-serif;cursor:pointer">Approve</button><button data-preview-action="reject" type="button" aria-describedby="preview-action-note" style="box-sizing:border-box;flex:1;min-width:108px;min-height:44px;padding:11px 16px;border:1.5px solid #B94D51;border-radius:8px;background:#ffffff;color:#B94D51;font:700 14px Arial,sans-serif;cursor:pointer">Reject</button>'
    : includePreviewActions && state.kind === 'reject-entry'
      ? '<button type="button" aria-describedby="preview-action-note" style="box-sizing:border-box;flex:1;min-height:44px;padding:11px 20px;border:1.5px solid #B94D51;border-radius:8px;background:#B94D51;color:#ffffff;font:700 14px Arial,sans-serif;cursor:pointer">Confirm Reject</button><button type="button" aria-describedby="preview-action-note" style="box-sizing:border-box;flex:1;min-height:44px;padding:11px 20px;border:1.5px solid #BCC7C9;border-radius:8px;background:#ffffff;color:#24383C;font:700 14px Arial,sans-serif;cursor:pointer">Cancel</button>'
      : ''
  const previewActionNote = includePreviewActions && (state.kind === 'pending' || state.kind === 'reject-entry')
    ? '<p id="preview-action-note" style="margin:12px 0 0;color:#57666A;font-size:13px">Local visual preview only. No decision is sent or recorded.</p>'
    : state.kind === 'pending'
      ? '<p style="margin:18px 0 0;color:#57666A;font-size:13px">Approve and Reject are available in supported Outlook Actionable Message clients after the approved action transport is connected.</p>'
      : ''
  const renderedActions = includePreviewActions && (state.kind === 'pending' || state.kind === 'reject-entry')
    ? `${previewDecisionActions}${reviewLink}`
    : `${reviewLink}${previewDecisionActions}`
  const brand = branding.yellowCitySubmarkUrl
    ? `<img src="${escapeHtml(branding.yellowCitySubmarkUrl)}" height="24" alt="Houston Independent School District" style="display:block;width:auto;height:24px">`
    : '<div data-brand-asset-gap="yellow-city-submark" style="margin:0 auto 14px;color:#ffffff;font-size:18px;font-weight:800;letter-spacing:.04em">HOUSTON ISD</div>'

  const eyebrow = state.kind === 'pending' || state.kind === 'reject-entry'
    ? model.additionalReviewRequired
      ? '<span style="display:inline-block;padding:5px 12px;border-radius:999px;background:#EDF1F8;color:#31598F;font-size:11px;font-weight:800;letter-spacing:.05em;text-transform:uppercase">Additional Review Required</span>'
      : `<span style="display:inline-block;padding:5px 12px;border-radius:999px;background:${state.kind === 'pending' ? '#E6F6F7' : '#FAEEEE'};color:${state.kind === 'pending' ? '#00838C' : '#B94D51'};font-size:11px;font-weight:800;letter-spacing:.05em;text-transform:uppercase">${state.kind === 'pending' ? 'Action required' : 'Rejection required'}</span>`
    : `<span style="display:inline-block;padding:5px 12px;border-radius:999px;background:${state.kind === 'approved' ? '#E6F2EF' : state.kind === 'submitted' ? '#E6F6F7' : state.kind === 'rejected' ? '#FAEEEE' : '#FFF7DD'};color:${state.kind === 'approved' ? '#006F5B' : state.kind === 'submitted' ? '#00838C' : state.kind === 'rejected' ? '#B94D51' : '#8A6814'};font-size:11px;font-weight:800;letter-spacing:.05em;text-transform:uppercase">${state.kind === 'approved' ? 'Approved' : state.kind === 'submitted' ? 'Submitted' : state.kind === 'rejected' ? 'Not approved' : 'Needs attention'}</span>`
  const fullRequestLink = model.reviewUrl && state.kind === 'pending'
    ? `<a href="${escapeHtml(model.reviewUrl)}" style="display:inline-block;margin-bottom:16px;color:#00838C;text-decoration:none;font-size:13px;font-weight:700">Open full request in Experience Pass &rarr;</a>`
    : ''

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(heading)}</title><style>@media(max-width:480px){.email-outer{padding:12px 6px!important}.email-body{padding:22px 20px 20px!important}.email-header{padding:16px 20px!important}.email-footer{padding:16px 20px!important}.summary-cell{display:block!important;width:100%!important;padding:8px 12px!important}.decision-actions{flex-direction:column!important}.decision-actions>*{width:100%!important;flex:none!important}.email-heading{font-size:18px!important}.email-context{font-size:13px!important}}</style></head><body style="margin:0;background:#F8F9F9;color:#24383C;font-family:'Radio Canada',Arial,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;background:#F8F9F9"><tr><td class="email-outer" align="center" style="padding:24px 12px"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;border-collapse:separate;border-spacing:0;background:#FFFFFF;border:1px solid #D9DFE0;border-radius:10px;box-shadow:1.5px 2.6px 3px 1px rgba(36,56,60,.16);overflow:hidden"><tr><td class="email-header" style="padding:20px 40px;background:#00A3AF;border-radius:10px 10px 0 0"><div style="display:flex;align-items:center;gap:12px">${brand}<span aria-hidden="true" style="display:inline-block;width:1px;height:34px;background:rgba(255,255,255,.4)"></span><div data-brand-title="experience-pass" style="display:flex;flex-direction:column;justify-content:center"><span style="color:#FFFFFF;font-family:'Parkinsans','Radio Canada',Arial,sans-serif;font-size:16px;font-weight:700;line-height:1.25">Experience Pass</span><span style="margin-top:3px;color:rgba(255,255,255,.85);font-size:10px;font-weight:700;letter-spacing:.06em;line-height:1.25;text-transform:uppercase">${state.kind === 'submitted' ? 'Submission Receipt' : 'Approval Notification'}</span></div></div></td></tr><tr><td class="email-body" style="padding:26px 40px 32px">${eyebrow}<h1 class="email-heading" style="margin:12px 0 8px;color:#24383C;font-family:'Parkinsans','Radio Canada',Arial,sans-serif;font-size:22px;line-height:1.3">${escapeHtml(heading)}</h1><p class="email-context" style="margin:0;color:#526468;font-size:14px;line-height:1.6">${escapeHtml(support)}</p>${summarySection}${titleIDetails}${submittedApprovalPath}${approvedDetails}${transportationDetails}${comments}${rejectPreview}<div style="margin-top:26px">${fullRequestLink}<div class="decision-actions" style="display:flex;gap:10px;align-items:stretch">${renderedActions}</div>${previewActionNote}</div></td></tr><tr><td class="email-footer" style="padding:20px 40px;background:#00A3AF;border-radius:0 0 10px 10px;color:#FFFFFF;font-size:11.5px;line-height:1.6"><p style="margin:0 0 4px">This is an automated notification from Experience Pass. Please do not reply to this email.</p><p style="margin:0;color:rgba(255,255,255,.85)">Houston Independent School District &middot; 4400 W. 18th St, Houston, TX 77092</p></td></tr></table></td></tr></table></body></html>`
}

const transportationCoordinationSummary = 'HISD bus transportation was requested. Transportation Services coordination is handled in a separate system. No contact timeline is currently available.'
const transportationCoordinationGuidance = 'If you have not already been contacted, please watch for communications about scheduling and further coordination.'
const transportationCoordinationCopy = `${transportationCoordinationSummary}\n\n${transportationCoordinationGuidance}`
const titleICoordinationCopy = 'This Local field trip includes Title I funding. Title I will be reaching out on a separate timeline. Please watch for communications about next steps.'

function isLocalTitleIRequest(model: ApprovalRequestNotification) {
  return model.tripType === 'Local' && model.titleIRequested
}

function approvalChainHtml(approvals: Extract<ApprovalNotificationState, { kind: 'approved' }>['completedApprovals']) {
  const steps = approvals.map(({ stage, approverName }, index) => {
    const connector = index < approvals.length - 1
      ? '<div data-approval-connector="complete" aria-hidden="true" style="width:2px;height:30px;margin:4px 0 -2px 13px;background:#006F5B;border-radius:2px"></div>'
      : ''
    return `<div data-approval-step="complete" style="margin-top:${index === 0 ? '14px' : '0'}"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse"><tr><td width="38" style="width:38px;vertical-align:top"><span aria-hidden="true" style="display:inline-block;width:28px;height:28px;border-radius:50%;background:#E6F2EF;color:#006F5B;font:800 16px/28px Arial,sans-serif;text-align:center">&#10003;</span>${connector}</td><td style="padding:1px 0 0;vertical-align:top"><div style="color:#24383C;font-size:14px;font-weight:800;line-height:1.35">${escapeHtml(stage)}</div><div style="margin-top:2px;color:#526468;font-size:13px;line-height:1.4">${escapeHtml(approverName)}</div></td></tr></table></div>`
  })
  return `<div data-approval-chain="complete" style="margin-top:24px"><div style="color:#006F5B;font-size:10.5px;font-weight:800;letter-spacing:.05em;text-transform:uppercase">Completed approval stages</div>${steps.join('')}</div>`
}

function approvalPathHtml(approvals: Extract<ApprovalNotificationState, { kind: 'submitted' }>['approvalPath']) {
  const steps = approvals.map(({ stage, approverName }, index) => {
    const connector = index < approvals.length - 1
      ? '<div data-approval-route-connector="pending" aria-hidden="true" style="width:2px;height:30px;margin:4px 0 -2px 13px;background:#67B8BE;border-radius:2px"></div>'
      : ''
    return `<div data-approval-route-step="pending" style="margin-top:${index === 0 ? '14px' : '0'}"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse"><tr><td width="38" style="width:38px;vertical-align:top"><span aria-hidden="true" style="box-sizing:border-box;display:inline-block;width:28px;height:28px;border:1.5px solid #00838C;border-radius:50%;background:#E6F6F7;color:#006F5B;font:800 13px/25px Arial,sans-serif;text-align:center">${index + 1}</span>${connector}</td><td style="padding:1px 0 0;vertical-align:top"><div style="color:#24383C;font-size:14px;font-weight:800;line-height:1.35">${escapeHtml(stage)}</div><div style="margin-top:2px;color:#526468;font-size:13px;line-height:1.4">${escapeHtml(approverName)}</div></td></tr></table></div>`
  })
  return `<div data-approval-path="pending" style="margin-top:24px"><div style="color:#00838C;font-size:10.5px;font-weight:800;letter-spacing:.05em;text-transform:uppercase">Expected approval path</div><p style="margin:6px 0 0;color:#526468;font-size:13px;line-height:1.5">Your request will move through these approvers in order.</p>${steps.join('')}</div>`
}

function approvedTripReminderPanel(model: ApprovalRequestNotification) {
  return `<table data-trip-reminder="approved" role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:separate;border-spacing:0;background:#F2FAFB;border:1px solid #D9F0F2;border-radius:8px"><tbody><tr><td class="summary-cell" width="36%" style="box-sizing:border-box;width:36%;padding:14px 16px;vertical-align:top"><div style="margin-bottom:3px;color:#52777A;font-size:10.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase">Trip Date</div><div style="color:#24383C;font-size:14px;font-weight:700;line-height:1.4">${escapeHtml(model.tripDateDisplay)}</div></td><td class="summary-cell" width="64%" style="box-sizing:border-box;width:64%;padding:14px 16px;vertical-align:top"><div style="margin-bottom:3px;color:#52777A;font-size:10.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase">Primary Destination</div><div style="color:#24383C;font-size:14px;font-weight:700;line-height:1.4">${escapeHtml(model.primaryDestination)}</div></td></tr></tbody></table>`
}

function requestBasicDetailsPanel(model: ApprovalRequestNotification, context: 'submitted' | 'rejected') {
  return `<table data-trip-reminder="${context}" role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:separate;border-spacing:0;background:#F2FAFB;border:1px solid #D9F0F2;border-radius:8px"><tbody><tr><td class="summary-cell" width="36%" style="box-sizing:border-box;width:36%;padding:14px 16px;vertical-align:top"><div style="margin-bottom:3px;color:#52777A;font-size:10.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase">UID</div><div style="color:#24383C;font:700 14px ui-monospace,Consolas,monospace;line-height:1.4">${escapeHtml(model.uid)}</div></td><td class="summary-cell" width="64%" style="box-sizing:border-box;width:64%;padding:14px 16px;vertical-align:top"><div style="margin-bottom:3px;color:#52777A;font-size:10.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase">Trip Date</div><div style="color:#24383C;font-size:14px;font-weight:700;line-height:1.4">${escapeHtml(model.tripDateDisplay)}</div></td></tr><tr><td class="summary-cell" colspan="2" style="box-sizing:border-box;width:100%;padding:10px 16px 14px;vertical-align:top"><div style="margin-bottom:3px;color:#52777A;font-size:10.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase">Primary Destination</div><div style="color:#24383C;font-size:14px;font-weight:700;line-height:1.4">${escapeHtml(model.primaryDestination)}</div></td></tr></tbody></table>`
}

function transportationCoordinationHtml(model: ApprovalRequestNotification) {
  if (!model.hisdBusTransportationRequested) return ''
  return `<div data-transportation-coordination="pending" style="margin-top:24px;padding:16px 18px;border-left:3px solid #D4A72C;border-radius:0 8px 8px 0;background:#FFF7DD"><div style="color:#8A6814;font-size:10.5px;font-weight:800;letter-spacing:.05em;text-transform:uppercase">Transportation Services coordination</div><p style="margin:6px 0 0;color:#5F4A12;font-size:14px;line-height:1.55">${escapeHtml(transportationCoordinationSummary)}</p><p style="margin:10px 0 0;color:#5F4A12;font-size:14px;line-height:1.55">${escapeHtml(transportationCoordinationGuidance)}</p></div>`
}

function titleICoordinationHtml(model: ApprovalRequestNotification) {
  if (!isLocalTitleIRequest(model)) return ''
  return `<div data-title-i-coordination="pending" style="margin-top:24px;padding:16px 18px;border-left:3px solid #D4A72C;border-radius:0 8px 8px 0;background:#FFF7DD"><div style="color:#8A6814;font-size:10.5px;font-weight:800;letter-spacing:.05em;text-transform:uppercase">Title I coordination</div><p style="margin:6px 0 0;color:#5F4A12;font-size:14px;line-height:1.55">${escapeHtml(titleICoordinationCopy)}</p></div>`
}

function summaryPanel(model: ApprovalRequestNotification) {
  const values: readonly [string, string][] = [
    ['UID', model.uid],
    ['Trip Date', model.tripDateDisplay],
    ['School', model.schoolName],
    ['Requester', model.requesterName],
    ['Primary Destination', model.primaryDestination],
    ['Trip Type', model.tripType],
    ['Current Approval Stage', model.approvalStage],
  ]
  const cells = values.map(([label, value]) => {
    const renderedValue = label === 'UID' && model.reviewUrl
      ? `<a href="${escapeHtml(model.reviewUrl)}" style="color:#24383C;text-decoration:none">${escapeHtml(value)}</a>`
      : escapeHtml(value)
    return `<td class="summary-cell" width="50%" style="box-sizing:border-box;width:50%;padding:8px 10px;vertical-align:top"><div style="margin-bottom:3px;color:#6D7B7E;font-size:10.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase">${escapeHtml(label)}</div><div style="color:#24383C;font-family:${label === 'UID' ? 'ui-monospace,Consolas,monospace' : 'Arial,sans-serif'};font-size:14px;font-weight:${label === 'UID' ? '700' : '600'};line-height:1.35">${renderedValue}</div></td>`
  })
  const rows: string[] = []
  for (let index = 0; index < cells.length; index += 2) rows.push(`<tr>${cells[index]}${cells[index + 1] ?? '<td width="50%"></td>'}</tr>`)
  return `<table data-summary-panel="request" role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:separate;border-spacing:0;background:#F2FAFB;border:1px solid #D9F0F2;border-radius:8px"><tbody>${rows.join('')}</tbody></table>`
}

function buildTextFallback(model: ApprovalRequestNotification, state: ApprovalNotificationState) {
  const lines = [state.kind === 'submitted' ? 'REQUEST SUBMITTED' : 'APPROVAL REQUEST', '']
  if (state.kind === 'pending' || state.kind === 'reject-entry') {
    lines.push(
      state.kind === 'pending' ? 'Approval Required' : 'Reject Request',
      state.kind === 'pending'
        ? 'A field trip request is awaiting your review.'
        : 'Confirm or cancel this rejection decision.',
      '',
    )
    if (model.additionalReviewRequired) lines.push('Additional Review Required', '')
    lines.push(
      `UID: ${model.uid}`,
      `School: ${model.schoolName}`,
      `Requester: ${model.requesterName}`,
      `Trip Date: ${model.tripDateDisplay}`,
      `Primary Destination: ${model.primaryDestination}`,
      `Trip Type: ${model.tripType}`,
      `Current Approval Stage: ${model.approvalStage}`,
    )
    if (state.kind === 'pending' && isLocalTitleIRequest(model)) {
      lines.push('', 'Title I coordination', titleICoordinationCopy)
    }
    if (state.kind === 'pending' && model.hisdBusTransportationRequested) {
      lines.push('', 'Transportation Services coordination', transportationCoordinationCopy)
    }
  } else {
    const result = resultCopy(model, state)
    lines.push(result.heading, result.message)
    if (state.kind !== 'approved') lines.push('', `UID: ${model.uid}`)
    if (state.kind === 'approved') {
      lines.push('', `Trip Date: ${model.tripDateDisplay}`, `Primary Destination: ${model.primaryDestination}`)
      lines.push('', 'Completed approval stages:')
      state.completedApprovals.forEach(({ stage, approverName }) => lines.push(`✓ ${stage} — ${approverName}`))
    }
    if (state.kind === 'submitted') {
      lines.push(`Trip Date: ${model.tripDateDisplay}`, `Primary Destination: ${model.primaryDestination}`)
      lines.push('', 'Expected approval path:', 'Your request will move through these approvers in order.')
      state.approvalPath.forEach(({ stage, approverName }, index) => lines.push(`${index + 1}. ${stage} — ${approverName}`))
    }
    if ((state.kind === 'approved' || state.kind === 'submitted') && model.hisdBusTransportationRequested) {
      lines.push('', 'Transportation Services coordination', transportationCoordinationCopy)
    }
    if (state.kind === 'rejected') {
      lines.push(`Trip Date: ${model.tripDateDisplay}`, `Primary Destination: ${model.primaryDestination}`)
      lines.push('', 'Rejection comments:', state.comments)
    }
  }
  if (model.reviewUrl && state.kind !== 'reject-entry') lines.push('', `${state.kind === 'pending' ? 'Request Details' : 'View Request'}: ${model.reviewUrl}`)
  lines.push('', 'This is an automated notification from Experience Pass.', 'Please do not reply to this message.')
  return lines.join('\n')
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]!)
}

const supportedElements = new Set([
  'ActionSet',
  'Container',
  'FactSet',
  'Image',
  'TextBlock',
])
const supportedActions = new Set(['Action.OpenUrl', 'Action.ToggleVisibility'])

export function validateOutlookAdaptiveCard(card: AdaptiveCardDocument): string[] {
  const errors: string[] = []
  if (card.$schema !== OUTLOOK_ADAPTIVE_CARD_SCHEMA) errors.push('Unexpected Adaptive Card schema URL.')
  if (card.type !== 'AdaptiveCard') errors.push('Root type must be AdaptiveCard.')
  if (card.version !== OUTLOOK_ADAPTIVE_CARD_VERSION) errors.push('Outlook preview cards must target version 1.0.')
  if (!Array.isArray(card.body) || card.body.length === 0) errors.push('Adaptive Card body must not be empty.')

  const inspect = (value: unknown, path: string) => {
    if (Array.isArray(value)) {
      value.forEach((entry, index) => inspect(entry, `${path}[${index}]`))
      return
    }
    if (!value || typeof value !== 'object') return
    const candidate = value as Record<string, unknown>
    if (typeof candidate.type === 'string') {
      const isAction = candidate.type.startsWith('Action.')
      if (isAction && !supportedActions.has(candidate.type)) errors.push(`${path} uses unsupported action ${candidate.type}.`)
      if (!isAction && candidate.type !== 'AdaptiveCard' && !supportedElements.has(candidate.type)) {
        errors.push(`${path} uses unsupported element ${candidate.type}.`)
      }
      if (candidate.type === 'Action.OpenUrl' && (typeof candidate.url !== 'string' || !candidate.url)) {
        errors.push(`${path} Action.OpenUrl requires a URL.`)
      }
    }
    for (const [key, entry] of Object.entries(candidate)) inspect(entry, `${path}.${key}`)
  }
  inspect(card, '$')
  return errors
}

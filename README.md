# Experience Pass Approval Notification Gallery

A static stakeholder gallery for reviewing the finalized Experience Pass email templates for requesters, approvers, CTE, Title I, and Transportation Services.

This repository intentionally contains only demo-safe notification fixtures, the email renderer, visual gallery, tests, and static branding assets. It has no connection to the Experience Pass application, authentication, Dataverse, Azure Functions, Graph delivery, or production request data. Any visible action URL is a non-routable placeholder used solely to preserve the finalized email presentation.

Requester, approver, and Transportation Services messages use a demo-safe **View Request** link. CTE and Title I messages use a separate demo-safe **View in Data Workspace** contract for the Experience Pass Data Workspace. The POC does not render in-email approval choices or separate decision-confirmation emails.

## Local review

```powershell
npm install
npm run dev
```

Open `http://127.0.0.1:5173/`.

## Validation

```powershell
npm test
npm run test:e2e
npm run build
```

Pushes to `main` are built and published through the repository's GitHub Pages workflow.

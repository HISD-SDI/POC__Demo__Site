# HISD Approval Request Notification Preview

A static stakeholder gallery for reviewing the presentation of Approval Request notification emails and their generated Outlook Adaptive Card JSON.

This repository intentionally contains only demo-safe notification fixtures, the email/card renderer, visual gallery, tests, and static branding assets. It has no connection to the Experience Pass application, authentication, Dataverse, Azure Functions, email delivery, or production request data. Any visible action URL is a non-routable placeholder used solely to preserve the proposed email presentation.

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

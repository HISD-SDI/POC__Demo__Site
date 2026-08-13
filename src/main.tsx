import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ApprovalNotificationGallery } from './notifications/ApprovalNotificationGallery'
import './index.css'

const root = document.getElementById('root')

if (!root) throw new Error('Approval notification gallery root was not found.')

createRoot(root).render(
  <StrictMode>
    <ApprovalNotificationGallery />
  </StrictMode>,
)

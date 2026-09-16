import { expect, test } from '@playwright/test'

test('finalized gallery separates audiences and previews department notifications', async ({ page }) => {
  await page.goto('/?preview=approval-notification')

  await expect(page.getByRole('heading', { name: 'Approval Notification Gallery', level: 1 })).toBeVisible()
  await expect(page.getByRole('img', { name: 'Houston Independent School District' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Requester Notifications' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Approver Notifications' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Department Notifications' })).toBeVisible()
  await expect(page.getByText('Compare proposed alternatives')).toHaveCount(0)
  await expect(page.getByText('Dynamic email')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Approval Confirmation/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Reject Confirmation/ })).toHaveCount(0)

  await page.getByRole('button', { name: 'Pending Approval Directs the approver to review and act in Experience Pass.' }).click()
  const pending = page.getByTitle('Pending Approval desktop email preview').contentFrame()
  await expect(pending.getByRole('link', { name: 'View Request' })).toBeVisible()
  await expect(pending.getByRole('button', { name: 'Approve' })).toHaveCount(0)
  await expect(pending.getByRole('button', { name: 'Reject' })).toHaveCount(0)

  await page.getByRole('button', { name: /CTE Notification/ }).click()
  const cte = page.getByTitle('CTE Notification desktop email preview').contentFrame()
  await expect(cte.getByText('Latest Approver', { exact: true })).toBeVisible()
  await expect(cte.getByText('Jane Smith', { exact: true })).toBeVisible()
  await expect(cte.getByText('Senior Executive Director', { exact: true })).toBeVisible()
  await expect(cte.getByRole('link', { name: 'jsmith@houstonisd.org' })).toBeVisible()
  await expect(cte.getByText(/Experience Pass Data Workspace/)).toBeVisible()
  await expect(cte.getByRole('link', { name: 'View in Data Workspace' })).toBeVisible()
  await expect(cte.getByRole('button', { name: 'Approve' })).toHaveCount(0)

  await page.getByRole('button', { name: /Title I Notification/ }).click()
  const titleI = page.getByTitle('Title I Notification desktop email preview').contentFrame()
  await expect(titleI.getByText(/coordinate with the latest approver in the approval chain/i)).toBeVisible()
  await expect(titleI.getByRole('link', { name: 'View in Data Workspace' })).toBeVisible()

  await page.getByRole('button', { name: /Transportation Services Notification/ }).click()
  const transportation = page.getByTitle('Transportation Services Notification desktop email preview').contentFrame()
  await expect(transportation.getByText('Jones High School', { exact: true })).toBeVisible()
  await expect(transportation.getByText('Campus Number', { exact: true })).toBeVisible()
  await expect(transportation.getByText('Houston Museum of Natural Science', { exact: true })).toBeVisible()
  await expect(transportation.getByRole('link', { name: 'View Request' })).toBeVisible()
  await expect(transportation.getByText('Latest Approver')).toHaveCount(0)
})

test('requester receipts keep conditional notices below the approval path', async ({ page }) => {
  await page.goto('/?preview=approval-notification')
  await page.getByRole('button', { name: /Submitted Receipt · Title I \+ HISD Bus/ }).click()
  const preview = page.getByTitle('Submitted Receipt · Title I + HISD Bus desktop email preview').contentFrame()

  await expect(preview.getByText('Expected approval path', { exact: true })).toBeVisible()
  await expect(preview.getByText('Title I coordination', { exact: true })).toBeVisible()
  await expect(preview.getByText('Transportation Services coordination', { exact: true })).toBeVisible()
})

test('gallery remains usable at a representative narrow width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/?preview=approval-notification')

  await expect(page.getByRole('heading', { name: 'Approval Notification Gallery', level: 1 })).toBeVisible()
  await expect(page.getByRole('button', { name: /Transportation Services Notification/ })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

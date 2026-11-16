# PS White E-Commerce - Maintenance Guide

## Daily Checks
- Inspect API health: `GET /health`
- Review PM2 logs for unhandled errors
- Check payment failures and webhook errors
- Verify new orders are processing normally

## Weekly Tasks
- Review `BUG_TRACKER.md` and close verified fixes
- Audit failed emails in Resend dashboard
- Validate Cloudinary usage and storage growth
- Confirm MongoDB backup job succeeded

## Monthly Tasks
- Update dependencies (`npm outdated`, then controlled upgrades)
- Re-run smoke tests using `TESTING_CHECKLIST.md`
- Rotate secrets if needed (JWT, payment keys, OAuth keys)
- Review Lighthouse score and optimize regressions

## Incident Response
1. Identify scope (frontend only, backend only, payments only)
2. Check PM2 logs and provider dashboards
3. Apply hotfix in a branch
4. Validate in staging/local
5. Deploy and monitor for 30+ minutes

## Add New Book Workflow
1. Login admin
2. Add metadata and pricing
3. Upload cover and files
4. Publish and verify on customer pages
5. Test checkout and library access

## Customer Support Workflow
1. Verify order in admin panel
2. Verify payment status from provider
3. Reissue secure download link if required
4. Escalate refund requests per policy


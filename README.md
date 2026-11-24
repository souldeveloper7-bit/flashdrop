# FlashDrop

Dark Next.js file-transfer starter using Vercel Blob client uploads.

## Important limits and safety notes
- "Unlimited" is not available on a free plan. Vercel Blob has storage, transfer, operation and per-file limits. Vercel's published maximum individual blob size is 5 TB; files over 100 MB should use multipart uploads. Check the current plan and SDK limits before accepting very large files.
- This starter uses a **public** Blob store. Anyone who obtains a direct file URL can access that file. The 6-digit code is a convenience lookup, not strong access control.
- Seven-day expiry is checked during code lookup, but this starter does not physically delete expired blobs. Add a scheduled cleanup process before public launch.
- Code lookup scans Blob manifests, which is suitable only for a small prototype. A public service needs a database index, collision checks, and durable rate limiting.
- Multiple-file retrieval opens each file separately; ZIP packaging is not included.
- Maximum 20 files per transfer. Storage and bandwidth are not unlimited.

## Deploy from a phone
1. Download and unzip this project.
2. Create a GitHub repository named `flashdrop`.
3. Upload all files and folders, preserving their paths.
4. In Vercel, import the GitHub repository.
5. Open the project's **Storage** tab → **Create Database** → **Blob**.
6. Choose **Public** for this prototype and connect the store to this project.
7. Confirm `BLOB_READ_WRITE_TOKEN` exists in Project Settings → Environment Variables.
8. Redeploy from the Deployments tab.
9. Test with a small, non-sensitive file first.

## Local development
```bash
npm install
npm run dev
```

## Seven-day automatic cleanup

The project includes a daily Vercel Cron endpoint. Add a random `CRON_SECRET` environment variable in Vercel (same value for Production) before relying on cleanup. The endpoint removes expired transfer blobs during its daily run, so physical deletion may happen up to roughly 24 hours after the 7-day expiry time. Verify that Cron is available on your Vercel plan.

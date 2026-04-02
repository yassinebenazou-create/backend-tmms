# TMMS Backend

## Local run

```bash
npm install
npm run dev
```

## Deploy Backend on Vercel

1. Push `tmms-backend` to GitHub.
2. Go to Vercel dashboard -> `Add New` -> `Project`.
3. Import your backend repository/folder.
4. Keep root directory as `tmms-backend`.
5. Add environment variables in Vercel Project Settings -> Environment Variables:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN` (example: `7d`)
   - `NODE_ENV` = `production`
6. Deploy.

After deployment:
- Health check: `https://your-backend.vercel.app/health`
- API base URL example: `https://your-backend.vercel.app`

## Important note for file uploads on Vercel

Vercel serverless filesystem is temporary.
Uploaded files can disappear between invocations/redeploys.

For production file persistence, use object storage (S3, Cloudinary, Supabase Storage, etc.).

# Instagram Automatic Content Setup

This guide will help you set up automatic Instagram content fetching for The TripMan website.

## Overview

The website now automatically fetches and displays your latest Instagram post/reel. When you post new content on Instagram, it will automatically appear on your website within 5-10 minutes.

## Features

- ✅ **Automatic Updates**: Fetches latest Instagram content automatically
- ✅ **Smart Caching**: 5-minute cache to reduce API calls
- ✅ **Fallback Content**: Shows static content if API fails
- ✅ **Loading States**: Professional loading animations
- ✅ **Error Handling**: Graceful error handling with retry options
- ✅ **Manual Refresh**: Refresh button to fetch latest content
- ✅ **Responsive Design**: Works on all devices

## Prerequisites

1. **Instagram Business/Creator Account**: Your Instagram account must be converted to Business or Creator
2. **Facebook Page**: Your Instagram account must be connected to a Facebook Page
3. **Facebook App**: You need a Facebook App with Instagram Basic Display permissions

## Step-by-Step Setup

### 1. Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "Create App"
3. Choose "Business" as the app type
4. Fill in your app details
5. Add "Instagram Basic Display" product to your app

### 2. Configure Instagram Basic Display

1. In your Facebook App, go to "Instagram Basic Display"
2. Click "Create New App"
3. Add your Instagram account as a test user
4. Generate a long-lived access token

### 3. Get Required Credentials

You'll need these values:

- **IG_USER_ID**: Your Instagram User ID
- **IG_USER_TOKEN**: Long-lived Instagram access token
- **FB_APP_ID**: Your Facebook App ID
- **FB_APP_SECRET**: Your Facebook App Secret

### 4. Environment Variables

Add these to your `.env.local` file:

```env
# Instagram API Configuration
IG_USER_ID=your_instagram_user_id
IG_USER_TOKEN=your_long_lived_instagram_token
FB_APP_ID=your_facebook_app_id
FB_APP_SECRET=your_facebook_app_secret
```

### 5. Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add the environment variables in Vercel dashboard
4. Deploy

## How to Get Credentials

### Instagram User ID

1. Go to [Instagram Basic Display](https://developers.facebook.com/docs/instagram-basic-display-api/getting-started)
2. Use the Instagram Graph API Explorer
3. Call: `GET /me?fields=id`
4. Copy the `id` value

### Long-lived Access Token

1. In your Facebook App, go to "Instagram Basic Display" > "Basic Display"
2. Click "Generate Token"
3. Follow the authorization flow
4. Exchange the short-lived token for a long-lived token:
   ```
   GET /oauth/access_token?grant_type=fb_exchange_token&client_id={app-id}&client_secret={app-secret}&fb_exchange_token={short-lived-token}
   ```

### Facebook App ID & Secret

1. In your Facebook App dashboard
2. Go to "Settings" > "Basic"
3. Copy the App ID and App Secret

## API Endpoints

### GET /api/instagram/latest

Returns the latest Instagram post/reel embed HTML.

**Response:**
```json
{
  "html": "<blockquote class=\"instagram-media\"...>",
  "mediaType": "VIDEO",
  "permalink": "https://www.instagram.com/reel/...",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

**Error Response:**
```json
{
  "html": null,
  "error": "Instagram not configured",
  "fallback": true
}
```

## Caching

- **Success**: 5 minutes cache
- **Error**: 5 minutes cache
- **Not Configured**: 1 hour cache

## Troubleshooting

### Common Issues

1. **"Instagram not configured"**
   - Check that all environment variables are set
   - Verify the values are correct

2. **"Failed to fetch Instagram media"**
   - Check if your Instagram token is valid
   - Ensure your account is Business/Creator type
   - Verify Instagram Basic Display permissions

3. **"No Instagram media found"**
   - Make sure you have public posts on Instagram
   - Check if your account is properly connected to Facebook

4. **Embed not loading**
   - Check browser console for errors
   - Ensure Instagram embed script is loading
   - Try refreshing the page

### Debug Mode

Add this to your `.env.local` for detailed logging:

```env
NODE_ENV=development
```

## Security Notes

- ✅ All API calls are server-side (no client exposure)
- ✅ Tokens are never sent to the browser
- ✅ Proper error handling prevents token leakage
- ✅ Caching reduces API rate limits

## Rate Limits

- Instagram Graph API: 200 calls per hour per user
- With 5-minute caching, you can handle ~2400 requests per hour
- More than sufficient for most websites

## Support

If you encounter issues:

1. Check the browser console for errors
2. Verify your environment variables
3. Test the API endpoint directly: `/api/instagram/latest`
4. Check Instagram/Facebook developer documentation

## Future Enhancements

- YouTube integration
- Multiple social media platforms
- Content scheduling
- Analytics dashboard
- Custom embed styling

---

**Note**: This setup requires Instagram Business/Creator account and Facebook App. Personal Instagram accounts cannot use this API.

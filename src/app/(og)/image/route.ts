import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const title = searchParams.get('title') || 'The Tripman'
    const description = searchParams.get('description') || 'Premium Transportation & Experience Services'

    const html = `
      <div style="
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
        color: white;
        padding: 40px;
        font-family: system-ui, sans-serif;
      ">
        <h1 style="
          font-size: 48px;
          font-weight: bold;
          text-align: center;
          margin: 0 0 16px 0;
          line-height: 1.2;
        ">${title}</h1>
        <p style="
          font-size: 24px;
          text-align: center;
          margin: 0;
          opacity: 0.9;
          max-width: 600px;
          line-height: 1.4;
        ">${description}</p>
      </div>
    `

    return new ImageResponse(html as unknown as React.ReactElement, {
      width: 1200,
      height: 630,
    })
  } catch (e) {
    console.log(`Error generating image: ${e instanceof Error ? e.message : 'Unknown error'}`)
    return new Response(`Failed to generate the image`, {
      status: 500,
    })
  }
}

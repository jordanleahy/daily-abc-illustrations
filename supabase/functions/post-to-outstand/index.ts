import { createHandler, parseBody } from '../_shared/handler.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';

interface OutstandRequest {
  platform: 'instagram' | 'facebook' | 'tiktok' | 'linkedin';
  content: string;
  mediaUrls?: string[];
  scheduledAt?: string;
}

interface OutstandResponse {
  id: string;
  status: string;
  platform?: string;
}

Deno.serve(createHandler({
  name: 'post-to-outstand',
  clientMode: 'user',
  requireAuth: true,
}, async ({ req, user }) => {
  const OUTSTAND_API_KEY = Deno.env.get('OUTSTAND_API_KEY');
  
  if (!OUTSTAND_API_KEY) {
    console.error('[POST-TO-OUTSTAND] API key not configured');
    return errorResponse('Outstand API key not configured', 500);
  }

  const body = await parseBody<OutstandRequest>(req);
  
  if (!body.platform) {
    return errorResponse('Platform is required', 400);
  }
  
  if (!body.content) {
    return errorResponse('Content is required', 400);
  }

  console.log(`[POST-TO-OUTSTAND] Posting to ${body.platform} for user ${user?.userId}`);
  console.log(`[POST-TO-OUTSTAND] Content length: ${body.content.length} chars`);

  // Build the Outstand API request
  const outstandPayload: Record<string, unknown> = {
    content: body.content,
    accounts: [body.platform],
  };

  // Add scheduled time if provided
  if (body.scheduledAt) {
    outstandPayload.schedule_at = body.scheduledAt;
    console.log(`[POST-TO-OUTSTAND] Scheduled for: ${body.scheduledAt}`);
  }

  // Add media if provided
  if (body.mediaUrls && body.mediaUrls.length > 0) {
    outstandPayload.media = body.mediaUrls;
    console.log(`[POST-TO-OUTSTAND] Media URLs: ${body.mediaUrls.length}`);
  }

  try {
    const response = await fetch('https://api.outstand.so/v1/posts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OUTSTAND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(outstandPayload),
    });

    const responseText = await response.text();
    console.log(`[POST-TO-OUTSTAND] Response status: ${response.status}`);
    console.log(`[POST-TO-OUTSTAND] Response body: ${responseText}`);

    if (!response.ok) {
      console.error(`[POST-TO-OUTSTAND] API error: ${responseText}`);
      return errorResponse(`Outstand API error: ${responseText}`, response.status);
    }

    let result: OutstandResponse;
    try {
      result = JSON.parse(responseText);
    } catch {
      console.error('[POST-TO-OUTSTAND] Failed to parse response JSON');
      return errorResponse('Invalid response from Outstand API', 500);
    }

    console.log(`[POST-TO-OUTSTAND] Success! Post ID: ${result.id}`);
    
    return successResponse({ 
      postId: result.id, 
      status: result.status,
      platform: body.platform,
    });

  } catch (error) {
    console.error('[POST-TO-OUTSTAND] Network error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to connect to Outstand API',
      500
    );
  }
}));

import { NextResponse } from 'next/server';
import { loadAnalyticsSummary } from '../../../lib/getAnalytics';

export async function GET() {
  try {
    const analytics = await loadAnalyticsSummary();
    if (!analytics) {
      return NextResponse.json({ error: 'Analytics not generated yet' }, { status: 404 });
    }
    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Analytics API error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

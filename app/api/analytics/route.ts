import { NextResponse } from 'next/server';
import { loadAnalyticsSummary } from '../../../lib/getAnalytics';

export const revalidate = 0;

export async function GET() {
  try {
    const analytics = await loadAnalyticsSummary();
    return NextResponse.json(
      { analytics },
      {
        headers: {
          'Cache-Control': 'no-store'
        }
      }
    );
  } catch (error) {
    console.error('analytics api error', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

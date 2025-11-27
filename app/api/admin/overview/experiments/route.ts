import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface ExperimentVariant {
  name: string;
  percentage: number;
  users: number;
}

interface Experiment {
  key: string;
  name: string;
  status: 'running' | 'paused' | 'completed';
  variants: ExperimentVariant[];
  startDate: string;
  sampleSize: number;
}

export async function GET() {
  try {
    // Mock experiments - in production, this would fetch from LaunchDarkly
    const experiments: Experiment[] = [
      {
        key: 'onboarding-quiz-v2',
        name: 'Onboarding Quiz V2',
        status: 'running',
        variants: [
          { name: 'control', percentage: 50, users: 1250 },
          { name: 'variant-a', percentage: 50, users: 1235 }
        ],
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        sampleSize: 2485
      },
      {
        key: 'profile-prompt-recommendations',
        name: 'AI Profile Prompt Suggestions',
        status: 'running',
        variants: [
          { name: 'control', percentage: 33, users: 820 },
          { name: 'variant-a', percentage: 33, users: 815 },
          { name: 'variant-b', percentage: 34, users: 835 }
        ],
        startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        sampleSize: 2470
      },
      {
        key: 'subscription-trial-7d',
        name: '7-Day Premium Trial',
        status: 'running',
        variants: [
          { name: 'control', percentage: 50, users: 950 },
          { name: 'trial-7d', percentage: 50, users: 945 }
        ],
        startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        sampleSize: 1895
      }
    ];

    return NextResponse.json({ experiments });
  } catch (error) {
    console.error('Error fetching experiments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch experiments' },
      { status: 500 }
    );
  }
}

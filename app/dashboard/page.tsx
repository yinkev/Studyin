/**
 * Dashboard - Enhanced Bento Grid with Unified Navigation
 * World-class dashboard with AppNav integration
 */

'use client';

import Link from 'next/link';
import {
  Card, CardBody, CardHeader, Progress, Chip, Button, Skeleton
} from '@heroui/react';
import { useDashboardMetrics } from '../../lib/hooks/useDashboardMetrics';

export default function DashboardNovaPage() {
  const { metrics, isLoading, error } = useDashboardMetrics('local-dev');

  return (
      <main className="min-h-screen bg-surface-bg1 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-12 gap-4">

            {/* Large Card - Today's Progress */}
            <Card className="col-span-12 md:col-span-8">
              <CardHeader className="flex gap-3 items-center p-6 pb-2">
                <div className="p-3 rounded-2xl bg-semantic-success/10">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <div className="flex flex-col">
                  <p className="text-lg font-bold text-text-high">Today's Progress</p>
                  <p className="text-sm text-text-med">Keep up the momentum!</p>
                </div>
              </CardHeader>
              <CardBody className="space-y-6 px-6 pb-6">
                {isLoading ? (
                  <>
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                  </>
                ) : (
                  <>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-text-med">Questions Answered</span>
                        <span className="text-sm font-bold text-text-high">{metrics.questionsAnswered}</span>
                      </div>
                      <Progress value={100} color="success" className="h-3" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-text-med">Study Time</span>
                        <span className="text-sm font-bold text-text-high">{metrics.totalStudyTime.toFixed(1)}h</span>
                      </div>
                      <Progress value={100} color="primary" className="h-3" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-text-med">Accuracy</span>
                        <span className="text-sm font-bold text-text-high">{Math.round(metrics.accuracy)}%</span>
                      </div>
                      <Progress value={metrics.accuracy} color="warning" className="h-3" />
                    </div>
                  </>
                )}
              </CardBody>
            </Card>

            {/* Streak Card */}
            <Card className="col-span-6 md:col-span-4">
              <CardBody className="p-6 flex flex-col items-center justify-center text-center">
                {isLoading ? (
                  <>
                    <Skeleton className="w-16 h-16 rounded-full mb-4" />
                    <Skeleton className="h-10 w-16 rounded mb-2" />
                    <Skeleton className="h-4 w-24 rounded" />
                  </>
                ) : (
                  <>
                    <div className="p-4 rounded-full mb-4 bg-semantic-danger/10 text-semantic-danger">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                        <path d="M2 17l10 5 10-5"/>
                        <path d="M2 12l10 5 10-5"/>
                      </svg>
                    </div>
                    <p className="text-4xl font-extrabold mb-2 text-text-high">{metrics.streak}</p>
                    <p className="text-sm font-medium text-text-med">Day Streak 🔥</p>
                  </>
                )}
              </CardBody>
            </Card>

            {/* Quick Stats - 3 Small Cards */}
            <Card className="col-span-6 md:col-span-4">
              <CardBody className="p-5">
                {isLoading ? (
                  <Skeleton className="h-16 w-full rounded-lg" />
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="text-2xl font-bold text-text-high">{Math.round(metrics.accuracy)}%</div>
                    <div>
                      <p className="text-xs text-text-med">Overall Accuracy</p>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>

            <Card className="col-span-6 md:col-span-4">
              <CardBody className="p-5">
                {isLoading ? (
                  <>
                    <Skeleton className="h-9 w-24 rounded mb-1" />
                    <Skeleton className="h-3 w-32 rounded" />
                  </>
                ) : (
                  <>
                    <p className="text-3xl font-bold mb-1 text-text-high">{metrics.questionsCorrect.toLocaleString()}</p>
                    <p className="text-xs text-text-med">Questions Correct</p>
                  </>
                )}
              </CardBody>
            </Card>

            <Card className="col-span-6 md:col-span-4">
              <CardBody className="p-5">
                {isLoading ? (
                  <>
                    <Skeleton className="h-9 w-20 rounded mb-1" />
                    <Skeleton className="h-3 w-28 rounded" />
                  </>
                ) : (
                  <>
                    <p className="text-3xl font-bold mb-1 text-text-high">{metrics.totalStudyTime.toFixed(1)}h</p>
                    <p className="text-xs text-text-med">Total Study Time</p>
                  </>
                )}
              </CardBody>
            </Card>

            {/* Recent Activity */}
            <Card className="col-span-12 md:col-span-6">
              <CardHeader className="p-5 pb-2">
                <p className="text-lg font-bold text-text-high">Recent Activity</p>
              </CardHeader>
              <CardBody className="px-5 pb-5 space-y-3">
                {isLoading ? (
                  <>
                    <Skeleton className="h-14 w-full rounded-xl" />
                    <Skeleton className="h-14 w-full rounded-xl" />
                    <Skeleton className="h-14 w-full rounded-xl" />
                  </>
                ) : metrics.recentTopics.length > 0 ? (
                  metrics.recentTopics.map((item, index) => {
                    const colors = [
                      'var(--success)',
                      'var(--accent-trust)',
                      'var(--warning)',
                      'var(--accent-mastery)',
                      'var(--error)'
                    ];
                    const color = colors[index % colors.length];
                    return (
                      <div key={item.loId} className="flex items-center justify-between p-3 rounded-xl bg-surface-bg2/60">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full" style={{ background: color }}></div>
                          <div>
                            <p className="text-sm font-semibold text-text-high">{item.name}</p>
                            <p className="text-xs text-text-med">{item.questionsAnswered} questions</p>
                          </div>
                        </div>
                        <Chip size="sm" variant="flat" className="bg-semantic-success/10 text-semantic-success">
                          {Math.round(item.accuracy)}%
                        </Chip>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-text-med">
                    <p className="text-sm">No activity yet. Start studying to see your progress!</p>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Quick Actions */}
            <Card className="col-span-12 md:col-span-6">
              <CardHeader className="p-5 pb-2">
                <p className="text-lg font-bold text-text-high">Quick Actions</p>
              </CardHeader>
              <CardBody className="px-5 pb-5 space-y-3">
                <Link href="/study" className="block">
                  <Button fullWidth size="lg" color="primary" startContent={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                    </svg>
                  }>
                    Continue Studying
                  </Button>
                </Link>
                <Link href="/summary" className="block">
                  <Button fullWidth size="lg" variant="flat" startContent={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="20" x2="18" y2="10"/>
                      <line x1="12" y1="20" x2="12" y2="4"/>
                      <line x1="6" y1="20" x2="6" y2="14"/>
                    </svg>
                  }>
                    View Analytics
                  </Button>
                </Link>
                <Link href="/upload" className="block">
                  <Button fullWidth size="lg" variant="bordered" startContent={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  }>
                    Upload Content
                  </Button>
                </Link>
              </CardBody>
            </Card>

          </div>
        </div>
      </main>
  );
}

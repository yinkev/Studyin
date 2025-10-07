import { FollowTheMoneyGame } from '@/components/games/follow-the-money/FollowTheMoneyGame';
import { XPProvider } from '@/components/XPProvider';

export const metadata = {
  title: 'Follow The Money | Studyin',
  description:
    'Test your memory and tracking skills in this Mario Party-inspired mini-game',
};

export default function FollowTheMoneyPage() {
  return (
    <XPProvider>
      <main className="min-h-screen bg-gradient-to-br from-accent-trust/10 via-surface-bg1 to-accent-mastery/10 px-4 py-12">
        <FollowTheMoneyGame />
      </main>
    </XPProvider>
  );
}

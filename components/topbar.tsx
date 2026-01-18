import { Bell, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Topbar() {
  return (
    <div
      className="flex items-center justify-between py-2 mb-2 px-4 rounded-xl"
      style={{
        background: 'linear-gradient(90deg, #7c3aed 0%, #000 100%)',
        color: 'white',
      }}
    >
      <div className="text-xl font-bold" style={{ color: 'white' }}>Together</div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="Notifications" className="text-white hover:bg-white/10">
          <Bell />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Help" className="text-white hover:bg-white/10">
          <HelpCircle />
        </Button>
      </div>
    </div>
  );
}

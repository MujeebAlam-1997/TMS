import { Truck } from 'lucide-react';

export function AppLogo() {
  return (
    <div className="flex items-center gap-2 p-2">
      <div className="bg-primary text-primary-foreground p-2 rounded-lg">
        <Truck className="h-6 w-6" />
      </div>
      <span className="text-xl font-bold">TMS</span>
    </div>
  );
}

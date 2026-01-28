'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Clock, 
  Target, 
  Zap, 
  PenTool, 
  Search,
  Tag,
  ChevronDown
} from 'lucide-react';
import { cn } from "@/lib/utils";

interface CreativeLog {
  id: string;
  work_date: string;
  hours_worked: number;
  worked_on: string;
  produced: string | null;
  aligned: boolean | null;
  focused: boolean | null;
  work_type: string;
}

const typeStyles: Record<string, string> = {
  'Deep Work': 'bg-indigo-500/10 text-indigo-600 ring-1 ring-indigo-500/20',
  'Creative': 'bg-violet-500/10 text-violet-600 ring-1 ring-violet-500/20',
  'Admin': 'bg-slate-500/10 text-slate-600 ring-1 ring-slate-500/20',
  'Learning': 'bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20',
  'default': 'bg-muted text-muted-foreground ring-1 ring-border',
};

export default function CreativeWorkLogs() {
  const supabase = createClient();
  const [logs, setLogs] = useState<CreativeLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'focused' | 'aligned'>('all');
  const [selectedWorkType, setSelectedWorkType] = useState<string>('All Types');

  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;

      const { data } = await supabase
        .from('creative_work')
        .select('*')
        .eq('user_id', auth.user.id)
        .order('work_date', { ascending: false })
        .limit(30);

      setLogs(data ?? []);
      setLoading(false);
    };
    void load();
  }, [supabase]);

  const uniqueWorkTypes = useMemo(() => {
    const types = new Set(logs.map(l => l.work_type).filter(Boolean));
    return ['All Types', ...Array.from(types)];
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = log.worked_on.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterType === 'focused' ? log.focused : filterType === 'aligned' ? log.aligned : true;
      const matchesType = selectedWorkType === 'All Types' || log.work_type === selectedWorkType;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [logs, searchQuery, filterType, selectedWorkType]);

  if (loading) return <div className="p-8 text-center text-sm text-muted-foreground font-mono">LOADING LEDGER...</div>;

  return (
    <div className="w-full space-y-4">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between px-1 gap-4">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Production Ledger</h3>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Activity Stream</p>
        </div>

        {/* COMPACT FILTERS */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-secondary/50 border-none rounded-md text-xs w-32 md:w-40 outline-none focus:ring-1 ring-primary/20"
            />
          </div>
          
          <div className="relative">
            <select 
              value={selectedWorkType}
              onChange={(e) => setSelectedWorkType(e.target.value)}
              className="pl-3 pr-8 py-1.5 bg-secondary/50 border-none rounded-md text-xs appearance-none outline-none cursor-pointer"
            >
              {uniqueWorkTypes.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
          </div>

          <div className="flex bg-secondary/50 p-1 rounded-md">
            {(['all', 'focused', 'aligned'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={cn(
                  "px-3 py-1 text-[10px] uppercase font-bold tracking-tighter rounded",
                  filterType === t ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CLASSIC TABLE DESIGN */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b text-muted-foreground font-medium">
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Activity</th>
                <th className="px-4 py-3 font-semibold">Volume</th>
                <th className="px-4 py-3 font-semibold text-center">Metrics</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground tabular-nums">
                        {new Date(log.work_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: '2-digit' })}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-tighter">
                        {new Date(log.work_date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                      typeStyles[log.work_type] || typeStyles.default
                    )}>
                      {log.work_type || 'General'}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <div className="space-y-0.5">
                      <div className="text-foreground font-medium leading-tight truncate max-w-[200px] md:max-w-xs">
                        {log.worked_on}
                      </div>
                      {log.produced && (
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 opacity-70 italic">
                          Yield: {log.produced}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5 font-mono text-xs tabular-nums">
                      <div className="h-1 w-10 bg-secondary rounded-full overflow-hidden hidden sm:block">
                        <div 
                          className="h-full bg-primary/60" 
                          style={{ width: `${Math.min((log.hours_worked / 10) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="font-bold">{log.hours_worked}h</span>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex justify-center gap-2">
                      <Zap className={cn("w-3.5 h-3.5", log.focused ? "text-emerald-500 fill-current" : "text-muted-foreground/20")} />
                      <Target className={cn("w-3.5 h-3.5", log.aligned ? "text-blue-500" : "text-muted-foreground/20")} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FOOTER SUMMARY */}
        <div className="bg-muted/20 px-4 py-2 border-t flex justify-between items-center text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">
           <span>Total Filtered Yield</span>
           <span>
             {filteredLogs.reduce((acc, curr) => acc + (curr.hours_worked || 0), 0)} Hours Logged
           </span>
        </div>
      </div>
    </div>
  );
}
'use client'

import { useState } from 'react'
import { FileText, MoreHorizontal, Trash2, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function PageList({ section, onSelect, onDeletePage }: any) {
  const [searchQuery, setSearchQuery] = useState('')

  // Filter logic for pages
  const filteredPages = section.pages?.filter((p: any) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  return (
    <main className="flex-grow overflow-y-auto flex flex-col font-poppins transition-all">
      
      {/* INLINE PAGE SEARCH */}
      <div className="px-6 py-4 sticky top-0 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md z-10 border-b border-slate-50 dark:border-slate-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search notes..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 border-none text-[13px] font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#7719aa]"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              <X className="w-3 h-3 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* PAGE ITEMS */}
      <div className="px-2 pb-20">
        {filteredPages.length > 0 ? (
          filteredPages.map((p: any) => (
            <div 
              key={p.id} 
              className="group px-4 py-4 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between active:bg-slate-50 dark:active:bg-slate-900 rounded-xl transition-all"
            >
              <div onClick={() => onSelect(p)} className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer">
                <FileText className="w-4 h-4 shrink-0 text-slate-300 dark:text-slate-600" />
                <span className="text-[14px] font-medium text-slate-700 dark:text-slate-300 truncate tracking-tight">
                  {p.title}
                </span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-300 hover:text-slate-600 dark:hover:text-slate-100">
                    <MoreHorizontal size={18} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[130px] shadow-2xl bg-white dark:bg-slate-900 border-none font-poppins">
                  <DropdownMenuItem 
                    onClick={() => onDeletePage(p)} 
                    className="rounded-xl font-semibold text-[11px] uppercase py-3 text-red-500 cursor-pointer"
                  >
                    <Trash2 size={14} className="mr-2" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        ) : (
          <div className="py-20 text-center">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
              {searchQuery ? 'No results found' : 'No pages in this section'}
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
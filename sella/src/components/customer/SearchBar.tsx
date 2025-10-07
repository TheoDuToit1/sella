'use client'

import { useState } from 'react'
import { Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="flex gap-2">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search for butcheries, delis, or products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>
      <Button variant="outline" size="icon" className="h-12 w-12">
        <Filter className="h-4 w-4" />
      </Button>
    </div>
  )
}

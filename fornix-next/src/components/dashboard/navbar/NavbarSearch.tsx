import React, { useState, useMemo } from "react"

interface NavbarSearchProps {
    placeholder: string
    searchData: any[]
    activeCategory: string
    onResultClick: (item: any) => void
    searchQuery: string
    onSearchChange: (query: string) => void
}

export const NavbarSearch: React.FC<NavbarSearchProps> = ({
    placeholder,
    searchData,
    activeCategory,
    onResultClick,
    searchQuery,
    onSearchChange
}) => {
    /* const [searchQuery, setSearchQuery] = useState("") */

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onSearchChange(e.target.value)
    }

    const filteredResults = useMemo(() => {
        if (!searchQuery) return []
        const lowerQuery = searchQuery.toLowerCase()
        return searchData.filter(item => item.name && item.name.toLowerCase().includes(lowerQuery))
    }, [searchQuery, searchData])

    const handleResultClick = (item: any) => {
        onResultClick(item)
        onSearchChange("") // Clear search input on selection
    }

    return (
        <div className="relative flex-1">
            <input
                type="text"
                placeholder={placeholder}
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none"
            />
            {searchQuery && (
                <div className="absolute top-full left-0 right-0 bg-white shadow-md z-10 max-h-60 overflow-y-auto mt-1 rounded-md">
                    {filteredResults.length > 0 ? (
                        filteredResults.map((item, index) => (
                            <div
                                key={index}
                                role="button"
                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-0"
                                onClick={() => handleResultClick(item)}>
                                <p className="text-sm font-medium text-gray-700">{item.name}</p>
                            </div>
                        ))
                    ) : (
                        <div className="px-3 py-2 text-sm text-gray-500">No results found</div>
                    )}
                </div>
            )}
        </div>
    )
}

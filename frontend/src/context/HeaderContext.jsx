import { createContext, useContext, useState } from 'react'

const HeaderContext = createContext()

export function HeaderProvider({ children }) {
    const [isHeaderVisible, setIsHeaderVisible] = useState(false)

    return (
        <HeaderContext.Provider value={{ isHeaderVisible, setIsHeaderVisible }}>
            {children}
        </HeaderContext.Provider>
    )
}

export function useHeader() {
    const context = useContext(HeaderContext)
    if (!context) {
        throw new Error('useHeader must be used within HeaderProvider')
    }
    return context
}


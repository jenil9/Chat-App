import React, { createContext, useContext } from 'react'

const SidebarContext = createContext(null)

export const SidebarProvider = ({ children, onMenuClick }) => (
  <SidebarContext.Provider value={{ onMenuClick }}>
    {children}
  </SidebarContext.Provider>
)

export const useSidebar = () => {
  const ctx = useContext(SidebarContext)
  return ctx
}

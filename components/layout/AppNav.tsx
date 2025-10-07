'use client';

/**
 * AppNav - Unified Navigation using HeroUI Navbar
 * Used across all pages for consistent navigation
 */

import { useEffect, useState } from 'react';
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  Avatar,
  Badge,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Link as HeroLink,
} from '@heroui/react';
import Link from 'next/link';
import { getActiveTheme, setTheme } from '@/lib/themes';

interface AppNavProps {
  theme?: 'light' | 'dark';
  currentPage?: string;
}

export function AppNav({ theme = 'light', currentPage = '' }: AppNavProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') {
      return theme;
    }
    return getActiveTheme();
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Synchronize with the persisted theme when the component mounts.
    setActiveTheme(getActiveTheme());
  }, []);

  const isDarkMode = activeTheme === 'dark';

  const handleToggleTheme = () => {
    const nextTheme = isDarkMode ? 'light' : 'dark';
    setTheme(nextTheme);
    setActiveTheme(nextTheme);
  };

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/study', label: 'Study' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/summary', label: 'Analytics' },
    { href: '/upload', label: 'Upload' },
  ];

  return (
    <Navbar
      onMenuOpenChange={setIsMenuOpen}
      isBordered
      className={isDarkMode ? 'bg-slate-900/95' : 'bg-white/95'}
    >
      <NavbarContent>
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="sm:hidden"
        />
        <NavbarBrand>
          <Link href="/" className="flex items-center gap-3">
            <div
              className="w-11 h-11 flex items-center justify-center rounded-2xl"
              style={{
                background: isDarkMode
                  ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
                  : 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)',
                boxShadow: isDarkMode
                  ? '0 4px 0 #1D4ED8, 0 6px 12px rgba(59, 130, 246, 0.4)'
                  : '0 3px 0 #2563EB, 0 6px 20px rgba(59, 130, 246, 0.25)',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
            </div>
            <span className={`text-xl font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Studyin
            </span>
          </Link>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden sm:flex gap-6" justify="center">
        {navLinks.map((link) => (
          <NavbarItem key={link.href} isActive={currentPage === link.href}>
            <Link
              href={link.href}
              className={currentPage === link.href
                ? (isDarkMode ? 'text-blue-400' : 'text-blue-600')
                : (isDarkMode ? 'text-slate-400' : 'text-slate-600')
              }
            >
              {link.label}
            </Link>
          </NavbarItem>
        ))}
      </NavbarContent>

      <NavbarContent justify="end">
        <NavbarItem>
          <Button
            size="sm"
            variant="flat"
            onClick={handleToggleTheme}
            className={isDarkMode ? 'bg-slate-800' : 'bg-yellow-100'}
          >
            {isDarkMode ? (
              <span className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
                Dark
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor"/>
                  <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor"/>
                  <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor"/>
                  <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor"/>
                </svg>
                Light
              </span>
            )}
          </Button>
        </NavbarItem>
        <NavbarItem>
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Badge content="3" color="danger" size="sm">
                <Avatar
                  as="button"
                  className="w-10 h-10"
                  style={{
                    background: isDarkMode
                      ? 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)'
                      : 'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)',
                  }}
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  }
                />
              </Badge>
            </DropdownTrigger>
            <DropdownMenu aria-label="User menu">
              <DropdownItem key="dashboard" href="/dashboard">Dashboard</DropdownItem>
              <DropdownItem key="study" href="/study">Study</DropdownItem>
              <DropdownItem key="analytics" href="/summary">Analytics</DropdownItem>
              <DropdownItem key="upload" href="/upload">Upload Content</DropdownItem>
              <DropdownItem key="home" href="/">Home</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </NavbarItem>
      </NavbarContent>

      <NavbarMenu>
        {navLinks.map((link, index) => (
          <NavbarMenuItem key={`${link.href}-${index}`}>
            <Link
              href={link.href}
              className="w-full"
            >
              {link.label}
            </Link>
          </NavbarMenuItem>
        ))}
      </NavbarMenu>
    </Navbar>
  );
}

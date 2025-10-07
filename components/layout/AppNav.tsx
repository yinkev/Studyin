'use client';

/**
 * AppNav - Unified Navigation using Mantine Components
 * Used across all pages for consistent navigation
 */

import { useState } from 'react';
import { Avatar, Menu, Indicator, Burger, Group, Box } from '@mantine/core';
import Link from 'next/link';

interface AppNavProps {
  theme?: 'light' | 'dark';
  currentPage?: string;
}

export function AppNav({ theme = 'light', currentPage = '' }: AppNavProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Light mode enforced - Glassmorphism design system
  const isDarkMode = false;

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/study', label: 'Study' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/summary', label: 'Analytics' },
    { href: '/upload', label: 'Upload' },
  ];

  return (
    <nav className="glass-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Group h={60} justify="space-between">
          {/* Left: Logo + Burger */}
          <Group gap="md">
            <Burger
              opened={isMenuOpen}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="sm:hidden"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            />
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
          </Group>

          {/* Center: Nav Links (hidden on mobile) */}
          <Group gap="lg" className="hidden sm:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`font-medium transition-colors ${
                  currentPage === link.href
                    ? (isDarkMode ? 'text-blue-400' : 'text-blue-600')
                    : (isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')
                }`}
              >
                {link.label}
              </Link>
            ))}
          </Group>

          {/* Right: User Menu */}
          <Group gap="sm">
            <Menu position="bottom-end" shadow="md">
              <Menu.Target>
                <button className="focus:outline-none">
                  <Indicator label="3" color="red" size={16}>
                    <Avatar
                      size="md"
                      style={{
                        background: isDarkMode
                          ? 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)'
                          : 'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)',
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </Avatar>
                  </Indicator>
                </button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item component={Link} href="/dashboard">Dashboard</Menu.Item>
                <Menu.Item component={Link} href="/study">Study</Menu.Item>
                <Menu.Item component={Link} href="/summary">Analytics</Menu.Item>
                <Menu.Item component={Link} href="/upload">Upload Content</Menu.Item>
                <Menu.Item component={Link} href="/">Home</Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <Box className="sm:hidden border-t border-gray-200">
          <div className="px-4 py-3 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  currentPage === link.href
                    ? (isDarkMode ? 'bg-slate-800 text-blue-400' : 'bg-gray-100 text-blue-600')
                    : (isDarkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-gray-50 hover:text-slate-900')
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </Box>
      )}
    </nav>
  );
}

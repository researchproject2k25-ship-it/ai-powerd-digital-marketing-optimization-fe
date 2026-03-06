'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ChartBarIcon, 
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  HomeIcon,
  ChartBarSquareIcon,
  DocumentTextIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

/* ── Navigation structure with collapsible categories ──────── */

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  shortName: string;
}

interface NavCategory {
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  shortName: string;
  children: NavItem[];
}

type NavEntry = NavItem | NavCategory;

function isCategory(entry: NavEntry): entry is NavCategory {
  return 'children' in entry;
}

const navigation: NavEntry[] = [
  { name: 'Home', href: '/dashboard', icon: HomeIcon, shortName: 'Home' },
  {
    label: 'Strategy',
    icon: ChartBarIcon,
    shortName: 'Strategy',
    children: [
      { name: 'Business Profile', href: '/dashboard/my-business', icon: BuildingOfficeIcon, shortName: 'Business' },
      { name: 'Marketing Strategy', href: '/dashboard/strategy', icon: ChartBarIcon, shortName: 'Strategy' },
      { name: 'Marketing Calendar', href: '/dashboard/calendar', icon: CalendarIcon, shortName: 'Calendar' },
    ],
  },
  {
    label: 'Content',
    icon: DocumentTextIcon,
    shortName: 'Content',
    children: [
      { name: 'Content Generator', href: '/content-generator', icon: DocumentTextIcon, shortName: 'Generator' },
    ],
  },
  {
    label: 'Campaign',
    icon: ChartBarSquareIcon,
    shortName: 'Campaign',
    children: [
      { name: 'Performance Predictor', href: '/performance-predictor', icon: ChartBarSquareIcon, shortName: 'Predictor' },
    ],
  },
  {
    label: 'Assistant',
    icon: ChatBubbleLeftRightIcon,
    shortName: 'Assistant',
    children: [
      { name: 'Smart Assistant', href: '/smart-assistant', icon: ChatBubbleLeftRightIcon, shortName: 'Chat' },
    ],
  },
];

const secondaryNavigation = [
  { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon, shortName: 'Settings' },
  { name: 'Profile', href: '/dashboard/profile', icon: UserCircleIcon, shortName: 'Profile' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  /* Auto-open category that contains the active route */
  useEffect(() => {
    const auto: Record<string, boolean> = {};
    for (const entry of navigation) {
      if (isCategory(entry)) {
        const hasActive = entry.children.some((c) => pathname === c.href);
        if (hasActive) auto[entry.label] = true;
      }
    }
    setOpenCategories((prev) => ({ ...prev, ...auto }));
  }, [pathname]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientX < 50) {
        setIsExpanded(true);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleMouseLeave = () => {
    setIsExpanded(false);
  };

  const toggleCategory = (label: string) => {
    setOpenCategories((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  /* check if any child in a category is active */
  const isCategoryActive = (cat: NavCategory) =>
    cat.children.some((c) => pathname === c.href);

  return (
    <>
      {/* Glassmorphism Sidebar */}
      <div 
        className={`fixed left-0 top-0 h-screen flex flex-col bg-[#0B0F14] backdrop-blur-xl text-[#F9FAFB] border-r border-[#1F2933] shadow-2xl transition-all duration-300 ease-in-out z-50 ${
          isExpanded ? 'w-64' : 'w-16'
        }`}
        onMouseLeave={handleMouseLeave}
      >
        {/* Logo/Brand */}
        <div className="flex h-16 items-center justify-start border-b border-[#1F2933] px-4">
        <Link href="/dashboard" className="flex items-center">
          <img 
            src={isExpanded ? "/Logo.png" : "/Logo-shrink.png"}
            alt="Serendib AI Logo" 
            className={`object-contain transition-all duration-300 ${
              isExpanded ? 'h-12 w-auto' : 'w-10 h-10'
            }`}
          />
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto overflow-x-hidden scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="space-y-1">
          {navigation.map((entry) => {
            /* ── Plain link (Home) ── */
            if (!isCategory(entry)) {
              const isActive = pathname === entry.href;
              return (
                <Link
                  key={entry.name}
                  href={entry.href}
                  className={`
                    group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200
                    ${isActive 
                      ? 'bg-[#1F2933] text-[#F9FAFB] shadow-lg' 
                      : 'text-[#CBD5E1] hover:bg-[#1F2933] hover:text-[#F9FAFB]'
                    }
                  `}
                >
                  <entry.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      isActive ? 'text-[#22C55E]' : 'text-[#CBD5E1] group-hover:text-[#F9FAFB]'
                    }`}
                  />
                  <span className="truncate">{entry.shortName}</span>
                </Link>
              );
            }

            /* ── Collapsible category ── */
            const catActive = isCategoryActive(entry);
            const isOpen = openCategories[entry.label] ?? false;

            return (
              <div key={entry.label}>
                {/* Category header */}
                <button
                  onClick={() => isExpanded && toggleCategory(entry.label)}
                  className={`
                    group flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200
                    ${catActive
                      ? 'text-[#F9FAFB]'
                      : 'text-[#CBD5E1] hover:bg-[#1F2933] hover:text-[#F9FAFB]'
                    }
                  `}
                >
                  <entry.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      catActive ? 'text-[#22C55E]' : 'text-[#CBD5E1] group-hover:text-[#F9FAFB]'
                    }`}
                  />
                  <span className={`flex-1 text-left truncate transition-all duration-300 ${
                    isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'
                  }`}>{entry.shortName}</span>
                  {isExpanded && (
                    <ChevronDownIcon
                      className={`h-4 w-4 flex-shrink-0 text-[#CBD5E1] transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </button>

                {/* Children (shown when expanded + open) */}
                {isExpanded && isOpen && (
                  <div className="ml-4 mt-1 space-y-0.5 border-l border-[#1F2933] pl-3">
                    {entry.children.map((child) => {
                      const childActive = pathname === child.href;
                      return (
                        <Link
                          key={child.name}
                          href={child.href}
                          className={`
                            group flex items-center rounded-lg px-3 py-2 text-sm transition-all duration-200
                            ${childActive
                              ? 'bg-[#1F2933] text-[#F9FAFB] font-medium'
                              : 'text-[#CBD5E1] hover:bg-[#1F2933]/50 hover:text-[#F9FAFB]'
                            }
                          `}
                        >
                          <child.icon
                            className={`mr-3 h-4 w-4 flex-shrink-0 ${
                              childActive ? 'text-[#22C55E]' : 'text-[#CBD5E1] group-hover:text-[#F9FAFB]'
                            }`}
                          />
                          <span className="truncate">{child.shortName}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Secondary Navigation */}
        <div className="mt-8 border-t border-[#1F2933] pt-4 space-y-1">
          {secondaryNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-[#1F2933] text-[#F9FAFB] shadow-lg border border-[#1F2933]' 
                    : 'text-[#CBD5E1] hover:bg-[#1F2933] hover:text-[#F9FAFB]'
                  }
                `}
                title={!isExpanded ? item.shortName : ''}
              >
                <item.icon
                  className={`h-5 w-5 flex-shrink-0 transition-all ${
                    isExpanded ? 'mr-3' : 'mr-0'
                  } ${
                    isActive ? 'text-[#22C55E]' : 'text-[#CBD5E1] group-hover:text-[#F9FAFB]'
                  }`}
                />
                <span className={`truncate transition-all duration-300 ${
                  isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'
                }`}>{item.shortName}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-[#1F2933] p-4">
        <div className={`text-xs text-[#CBD5E1] text-center transition-all duration-300 ${
          isExpanded ? 'opacity-100' : 'opacity-0'
        }`}>
          <p>AI-Powered Marketing</p>
          <p className="text-[#CBD5E1]/70">Optimization Platform</p>
        </div>
      </div>
    </div>

    {/* Spacer to prevent content overlap when sidebar is hidden */}
    <div className="w-16 flex-shrink-0" />
    </>
  );
}

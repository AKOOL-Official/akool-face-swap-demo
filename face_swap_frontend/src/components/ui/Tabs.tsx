import React from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="flex gap-1.5 sm:gap-2 bg-white/5 p-1 sm:p-1.5 rounded-lg sm:rounded-xl overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-md sm:rounded-lg
            font-medium transition-all duration-200 whitespace-nowrap text-xs sm:text-sm md:text-base
            ${activeTab === tab.id
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
            }
          `}
        >
          <span className="flex-shrink-0">{tab.icon}</span>
          <span className="hidden xs:inline sm:inline">{tab.label}</span>
          <span className="xs:hidden sm:hidden">{tab.label.split(' ')[0]}</span>
        </button>
      ))}
    </div>
  );
};


import React from 'react';

interface Tab {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="flex gap-2 bg-white/5 p-1.5 rounded-xl overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            flex-1 flex flex-col items-center justify-center gap-1 px-4 py-2.5 rounded-lg
            font-medium transition-all duration-200 whitespace-nowrap min-w-0
            ${activeTab === tab.id
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
            }
          `}
        >
          <span className="text-sm font-semibold">{tab.label}</span>
          {tab.description && (
            <span className="text-[10px] opacity-80 leading-tight text-center">
              {tab.description}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};


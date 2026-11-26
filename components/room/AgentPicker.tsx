'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Check, ChevronDown, Search, UserRound, X } from 'lucide-react';
import type { IValorantAgent } from '@/lib/valorant-agents';

interface AgentPickerProps {
  agents: IValorantAgent[];
  selectedAgent?: IValorantAgent;
  unavailableAgentIds: string[];
  isConnected: boolean;
  error: string | null;
  selectionError: string | null;
  onSelect: (agentId: string) => void;
}

export function AgentPicker({
  agents,
  selectedAgent,
  unavailableAgentIds,
  isConnected,
  error,
  selectionError,
  onSelect,
}: AgentPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const filteredAgents = agents.filter((agent) =>
    agent.displayName.toLowerCase().includes(query.trim().toLowerCase())
  );

  const selectAgent = (agentId: string) => {
    onSelect(agentId);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="mt-2">
      <div className="flex items-center rounded-lg border border-[#292E3A] bg-gradient-to-r from-[#1B202B] to-[#121620] p-2 transition hover:border-[#FF4655]/60">
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          disabled={!isConnected}
          aria-expanded={isOpen}
          aria-controls="agent-picker-options"
          aria-label={selectedAgent ? `Selected agent: ${selectedAgent.displayName}` : 'Choose an agent'}
          className="flex min-w-0 flex-1 items-center gap-2 text-left disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#343A48] bg-[#0B0D12]">
            {selectedAgent?.displayIcon ? (
              <Image
                src={selectedAgent.displayIcon}
                alt=""
                width={36}
                height={36}
                className="h-full w-full object-cover"
              />
            ) : (
              <UserRound className="h-4 w-4 text-[#9298A5]" />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[9px] font-tactical uppercase tracking-[0.12em] text-[#9298A5]">
              Agent selection
            </span>
            <span className="block truncate text-xs font-display font-bold text-white">
              {selectedAgent?.displayName || 'Choose your agent'}
            </span>
          </span>
          <ChevronDown
            className={`h-4 w-4 flex-shrink-0 text-[#9298A5] transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
        {selectedAgent && (
          <button
            type="button"
            aria-label="Clear selected agent"
            title="Clear selection"
            onClick={() => selectAgent('')}
            disabled={!isConnected}
            className="ml-1 rounded p-1 text-[#9298A5] transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {isOpen && (
        <div
          id="agent-picker-options"
          className="mt-2 rounded-lg border border-[#343A48] bg-[#10141D] p-2 shadow-xl"
        >
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#737B8A]" />
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search agents..."
              aria-label="Search agents"
              className="w-full rounded-md border border-[#292E3A] bg-[#0B0D12] py-2 pl-8 pr-2 text-xs text-white outline-none placeholder:text-[#737B8A] focus:border-[#FF4655]/70"
            />
          </div>

          {error ? (
            <p role="status" className="p-3 text-center text-[10px] text-[#FF7B85]">
              {error}
            </p>
          ) : agents.length === 0 ? (
            <p className="p-3 text-center text-[10px] text-[#9298A5]">Loading agents...</p>
          ) : filteredAgents.length === 0 ? (
            <p className="p-3 text-center text-[10px] text-[#9298A5]">No agents match that search.</p>
          ) : (
            <div className="mt-2 grid max-h-52 grid-cols-3 gap-1.5 overflow-y-auto pr-1">
              {filteredAgents.map((agent) => {
                const isSelected = agent.uuid === selectedAgent?.uuid;
                const isUnavailable = unavailableAgentIds.includes(agent.uuid);
                return (
                  <button
                    key={agent.uuid}
                    type="button"
                    onClick={() => selectAgent(agent.uuid)}
                    disabled={isUnavailable}
                    aria-pressed={isSelected}
                    title={
                      isUnavailable
                        ? `${agent.displayName} is selected by another operator`
                        : agent.displayName
                    }
                    className={`group relative flex min-w-0 flex-col items-center gap-1 rounded-md border p-1.5 transition disabled:cursor-not-allowed disabled:opacity-40 ${
                      isSelected
                        ? 'border-[#FF4655] bg-[#FF4655]/10'
                        : isUnavailable
                          ? 'border-transparent bg-[#191D27]'
                          : 'border-transparent bg-[#191D27] hover:border-[#555D6E] hover:bg-[#202633]'
                    }`}
                  >
                    {agent.displayIcon ? (
                      <Image
                        src={agent.displayIcon}
                        alt=""
                        width={48}
                        height={48}
                        className="h-10 w-10 object-contain transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <span className="flex h-10 w-10 items-center justify-center">
                        <UserRound className="h-5 w-5 text-[#9298A5]" />
                      </span>
                    )}
                    <span className="w-full truncate text-center text-[9px] font-tactical text-slate-300">
                      {isUnavailable ? 'TAKEN' : agent.displayName}
                    </span>
                    {isSelected && (
                      <span className="absolute right-1 top-1 rounded-full bg-[#FF4655] p-0.5 text-white">
                        <Check className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
      {selectionError && (
        <p role="alert" className="mt-1 text-[10px] text-[#FF7B85]">
          {selectionError}
        </p>
      )}
    </div>
  );
}

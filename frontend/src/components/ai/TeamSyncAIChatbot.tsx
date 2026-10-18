'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Sparkles, RefreshCw, ExternalLink, Bookmark, Trophy, Calendar, Users, ShieldAlert, ArrowRight, UserPlus } from 'lucide-react';
import api from '@/lib/axios';
import Link from 'next/link';
import { useBookmarks } from '@/hooks/useBookmarks';
import toast from 'react-hot-toast';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  hackathons?: any[];
  teams?: any[];
  suggestions?: string[];
  isFallback?: boolean;
}

export function TeamSyncAIChatbot() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { bookmarks, bookmarkHackathon, unbookmarkHackathon } = useBookmarks();

  const suggestedQuestions = [
    'Find free AI hackathons',
    "What's best for my profile?",
    'Which hackathons are closing soon?',
    'Find online hackathons',
    'Help me find a team',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, loading, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsgId = `user-${Date.now()}`;
    const newMessages: ChatMessage[] = [
      ...messages,
      { id: userMsgId, sender: 'user', text: query },
    ];

    setMessages(newMessages);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      // Build context history from previous 4 messages
      const contextHistory = newMessages.slice(-6).map((m) => ({
        role: m.sender,
        content: m.text,
      }));

      const response = await api.post('/ai/chat', {
        message: query,
        contextHistory,
      });

      const data = response.data;

      const aiMsgId = `ai-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: aiMsgId,
          sender: 'assistant',
          text: data.message || 'Here are the matching results from TeamSync database.',
          hackathons: data.hackathons || [],
          teams: data.teams || [],
          suggestions: data.suggestions || [],
          isFallback: data.isFallback,
        },
      ]);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to connect to TeamSync AI';
      toast.error(errorMsg);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: `⚠️ ${errorMsg}. Please try asking again.`,
          suggestions: suggestedQuestions.slice(0, 3),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const handleBookmarkToggle = async (hackathonId: string) => {
    const isBookmarked = bookmarks.some((b) => (b.hackathon?._id || b.hackathon) === hackathonId);
    if (isBookmarked) {
      await unbookmarkHackathon(hackathonId);
      toast.success('Removed bookmark');
    } else {
      await bookmarkHackathon(hackathonId);
      toast.success('Added to bookmarks');
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-primary via-accent to-secondary text-white font-bold text-sm rounded-full shadow-xl shadow-primary/25 hover:shadow-2xl hover:scale-105 transition-all duration-300 backdrop-blur-md border border-white/20"
          >
            <Sparkles className="w-5 h-5 animate-pulse text-amber-300" />
            <span>Ask TeamSync AI</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chatbot Modal Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[460px] h-[90vh] sm:h-[680px] bg-background/95 backdrop-blur-2xl border border-border sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-muted/60 border-b border-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white shadow-sm">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-foreground text-sm flex items-center gap-1.5">
                    TeamSync AI <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-1.5 py-0.2 rounded-full">Live DB</span>
                  </h3>
                  <p className="text-xs text-muted-foreground">Ask anything about hackathons & teams</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleClearChat}
                  title="Clear Chat"
                  className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-background/50 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-background/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 text-sm">
              {messages.length === 0 && (
                <div className="py-6 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">Welcome to TeamSync AI!</h4>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                      I can help you search 250+ real hackathons, find open teams, and match events with your profile.
                    </p>
                  </div>
                  <div className="pt-2 flex flex-col gap-2">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Suggested Questions</span>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {suggestedQuestions.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(q)}
                          className="text-xs bg-muted/60 hover:bg-primary/10 text-foreground hover:text-primary border border-border px-3 py-1.5 rounded-full transition-all text-left"
                        >
                          ✨ {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-2`}
                >
                  {/* Bubble */}
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-2xl leading-relaxed text-xs sm:text-sm ${
                      msg.sender === 'user'
                        ? 'bg-primary text-primary-foreground font-medium rounded-br-none shadow-sm'
                        : 'bg-muted/70 text-foreground rounded-bl-none border border-border'
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Fallback notification */}
                  {msg.isFallback && (
                    <span className="text-[10px] text-amber-500/80 flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> Empirical search results (AI fallback active)
                    </span>
                  )}

                  {/* Hackathon Cards */}
                  {msg.hackathons && msg.hackathons.length > 0 && (
                    <div className="w-full space-y-2 pt-2">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Matching Hackathons ({msg.hackathons.length})
                      </span>
                      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                        {msg.hackathons.map((h: any) => {
                          const hId = h._id || h.id || h.externalId;
                          const isBookmarked = bookmarks.some((b) => (b.hackathon?._id || b.hackathon) === hId);

                          return (
                            <div
                              key={hId}
                              className="bg-card border border-border p-3.5 rounded-xl space-y-2 hover:border-primary/40 transition-all shadow-sm"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h5 className="font-bold text-foreground text-xs line-clamp-1">{h.title}</h5>
                                  <span className="text-[11px] text-muted-foreground">{h.organizer || 'Host'}</span>
                                </div>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary shrink-0">
                                  {h.registrationFeeType === 'free' ? 'FREE' : h.registrationFee ? `₹${h.registrationFee}` : 'Paid'}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 flex-wrap text-[10px] text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-primary" />
                                  {h.registrationDeadline ? new Date(h.registrationDeadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'TBA'}
                                </span>
                                <span>•</span>
                                <span>{h.mode || 'Online'}</span>
                                {h.eligibilityType && (
                                  <>
                                    <span>•</span>
                                    <span className="capitalize">{h.eligibilityType.replace('_', ' ')}</span>
                                  </>
                                )}
                              </div>

                              {/* Card Action Buttons */}
                              <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                                <Link href={`/hackathons/${hId}`} className="flex-1">
                                  <button className="w-full text-xs font-semibold py-1.5 px-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors flex items-center justify-center gap-1">
                                    <span>View</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </button>
                                </Link>

                                {h.officialUrl && (
                                  <a href={h.officialUrl} target="_blank" rel="noopener noreferrer">
                                    <button className="p-1.5 border border-border hover:bg-muted text-foreground rounded-lg transition-colors" title="Official Website">
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </button>
                                  </a>
                                )}

                                <button
                                  onClick={() => handleBookmarkToggle(hId)}
                                  className={`p-1.5 border border-border rounded-lg transition-colors ${
                                    isBookmarked ? 'bg-primary/10 text-primary border-primary/30' : 'hover:bg-muted text-muted-foreground'
                                  }`}
                                  title="Bookmark"
                                >
                                  <Bookmark className="w-3.5 h-3.5" fill={isBookmarked ? 'currentColor' : 'none'} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Team Cards */}
                  {msg.teams && msg.teams.length > 0 && (
                    <div className="w-full space-y-2 pt-2">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Open Teams ({msg.teams.length})
                      </span>
                      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                        {msg.teams.map((t: any) => (
                          <div
                            key={t._id}
                            className="bg-card border border-border p-3.5 rounded-xl space-y-2 hover:border-accent/40 transition-all shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h5 className="font-bold text-foreground text-xs">{t.name}</h5>
                                <span className="text-[11px] text-muted-foreground">{t.hackathonTitle}</span>
                              </div>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-accent/10 text-accent">
                                {t.membersCount} / {t.maxMembers} Members
                              </span>
                            </div>

                            {t.openRoles?.length > 0 && (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] text-muted-foreground">Needs:</span>
                                {t.openRoles.map((role: string, rIdx: number) => (
                                  <span key={rIdx} className="text-[10px] font-medium bg-muted px-2 py-0.5 rounded text-foreground">
                                    {role}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="pt-1 border-t border-border/50">
                              <Link href={`/teams/${t._id}`}>
                                <button className="w-full text-xs font-semibold py-1.5 px-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg transition-colors flex items-center justify-center gap-1">
                                  <span>View Team</span>
                                  <UserPlus className="w-3 h-3" />
                                </button>
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggestions Chips */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {msg.suggestions.map((s, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => handleSend(s)}
                          className="text-[11px] bg-muted/60 hover:bg-primary/10 text-muted-foreground hover:text-primary border border-border px-2.5 py-1 rounded-full transition-all"
                        >
                          💬 {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-2xl w-fit">
                  <Sparkles className="w-4 h-4 text-primary animate-spin" />
                  <span className="text-xs text-muted-foreground font-medium">TeamSync AI is querying MongoDB...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-card border-t border-border shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Ask TeamSync AI (e.g. Find free AI hackathons)..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                  className="flex-1 bg-background border border-input rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-ring focus:outline-none placeholder:text-muted-foreground/70"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="p-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl disabled:opacity-50 transition-colors shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

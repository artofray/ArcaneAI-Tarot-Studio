
import React, { useState } from 'react';
import { Users, Lock, Unlock, Activity, UserPlus, Copy, Check, Mail, Shield, X } from 'lucide-react';
import { TeamMember, ProjectSettings } from '../types';

interface CollaborationPanelProps {
  members: TeamMember[];
  settings: ProjectSettings;
  onUpdateSettings: (s: ProjectSettings) => void;
}

export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({ members, settings, onUpdateSettings }) => {
  const [isLocked, setIsLocked] = useState(!!settings.password);
  const [passwordInput, setPasswordInput] = useState(settings.password || '');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emailInput, setEmailInput] = useState('');

  const toggleLock = () => {
    if (isLocked) {
      onUpdateSettings({ ...settings, password: '' });
      setIsLocked(false);
    } else {
      onUpdateSettings({ ...settings, password: passwordInput });
      setIsLocked(true);
    }
  };

  const inviteLink = `https://arcaneai.studio/project/${settings.name.toLowerCase().replace(/\s+/g, '-')}-invite-7f2a`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 h-full flex flex-col gap-6 relative overflow-hidden">
      {/* Invite Modal Overlay */}
      {showInviteModal && (
        <div className="absolute inset-0 bg-stone-950/90 backdrop-blur-md z-50 p-8 flex flex-col animate-in fade-in zoom-in duration-300">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-cinzel text-white flex items-center gap-3">
              <UserPlus className="w-6 h-6 text-purple-400" />
              Invite Collaborators
            </h3>
            <button 
              onClick={() => setShowInviteModal(false)}
              className="p-2 hover:bg-stone-800 rounded-lg text-stone-500 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-widest">Share Project Link</label>
              <div className="flex gap-2">
                <div className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-stone-400 text-sm overflow-hidden text-ellipsis whitespace-nowrap italic">
                  {inviteLink}
                </div>
                <button 
                  onClick={copyToClipboard}
                  className={`px-6 rounded-xl font-bold flex items-center gap-2 transition-all ${
                    copied ? 'bg-green-600 text-white' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/20'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-[10px] text-stone-600">Anyone with this link and the project password can join as a Designer.</p>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-widest">Invite via Email</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-stone-600" />
                  <input 
                    type="email" 
                    placeholder="mystic.artist@ethereal.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl py-3 pl-10 pr-4 text-sm text-stone-300 focus:border-purple-500 outline-none transition-all"
                  />
                </div>
                <select className="bg-stone-900 border border-stone-800 rounded-xl px-4 text-xs font-bold text-stone-400 outline-none focus:border-purple-500">
                  <option>Designer</option>
                  <option>Reviewer</option>
                  <option>Admin</option>
                </select>
                <button className="bg-stone-800 hover:bg-stone-700 px-6 rounded-xl text-stone-300 text-sm font-bold border border-stone-700 transition-all">
                  Send Invite
                </button>
              </div>
            </div>

            <div className="pt-8 border-t border-stone-900 grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-purple-900/10 border border-purple-500/20">
                <Shield className="w-5 h-5 text-purple-400 mb-2" />
                <h4 className="text-xs font-bold text-stone-200 mb-1">Encrypted Session</h4>
                <p className="text-[10px] text-stone-500">All collaborative actions are synced in real-time across users.</p>
              </div>
              <div className="p-4 rounded-xl bg-amber-900/10 border border-amber-500/20">
                <Lock className="w-5 h-5 text-amber-500 mb-2" />
                <h4 className="text-xs font-bold text-stone-200 mb-1">Access Control</h4>
                <p className="text-[10px] text-stone-500">Password protection is {settings.password ? 'ENABLED' : 'DISABLED'}.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-cinzel text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-purple-400" />
          Collaboration Portal
        </h2>
        <div className="bg-green-900/20 text-green-400 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-2 border border-green-500/20">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          {members.length} Active Artists
        </div>
      </div>

      <div className="space-y-4 bg-stone-950 p-5 rounded-xl border border-stone-800 shadow-inner">
        <div className="flex items-center justify-between mb-2">
           <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">Project Security</label>
           <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isLocked ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
              {isLocked ? 'PROTECTED' : 'OPEN ACCESS'}
           </span>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Lock className="absolute left-3 top-2.5 w-4 h-4 text-stone-600" />
            <input
              type="password"
              placeholder="Set Project Password"
              className="w-full bg-stone-900 border border-stone-800 rounded-lg py-2 pl-10 pr-4 text-sm text-stone-300 focus:border-purple-500 outline-none transition-all"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
            />
          </div>
          <button
            onClick={toggleLock}
            className={`px-4 rounded-lg flex items-center justify-center transition-all ${
              isLocked ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-purple-600 hover:bg-purple-500 text-white'
            }`}
          >
            {isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-[10px] text-stone-600 italic">Password is required for team members to sync high-res assets.</p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">Active Team Members</span>
          <button 
            onClick={() => setShowInviteModal(true)}
            className="text-xs bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 text-purple-400 px-3 py-1 rounded-full flex items-center gap-1.5 transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" /> Invite New
          </button>
        </div>
        <div className="space-y-2">
          {members.map(member => (
            <div key={member.id} className="flex items-center gap-4 p-3 rounded-xl bg-stone-800/30 hover:bg-stone-800 transition-all border border-transparent hover:border-stone-700">
              <div className="w-10 h-10 rounded-full bg-stone-900 flex items-center justify-center text-xs font-bold border border-purple-500/20 shadow-inner group relative overflow-hidden">
                <div className="absolute inset-0 bg-
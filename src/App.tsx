/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, AreaType } from './types';
import { DEFAULT_USER } from './utils/gameData';
import { sounds } from './utils/audio';

import { TopBar } from './components/TopBar';
import { NavigationDock } from './components/NavigationDock';
import { FarmArea } from './components/FarmArea';
import { FishingArea } from './components/FishingArea';
import { MiniGameArea } from './components/MiniGameArea';
import { ParkArea } from './components/ParkArea';

import { ShopModal } from './components/ShopModal';
import { InventoryModal } from './components/InventoryModal';
import { QuestModal } from './components/QuestModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { ProfileModal } from './components/ProfileModal';
import { LoginModal } from './components/LoginModal';
import { AdminModal } from './components/AdminModal';
import { HouseModal } from './components/HouseModal';
import { VehicleShopModal } from './components/VehicleShopModal';
import { MarketplaceModal } from './components/MarketplaceModal';
import { InspectProfileModal } from './components/InspectProfileModal';


export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string>(() => localStorage.getItem('game_auth_token') || '');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentArea, setCurrentArea] = useState<AreaType>('farm');

  // Modals state
  const [showShop, setShowShop] = useState<boolean>(false);
  const [showInventory, setShowInventory] = useState<boolean>(false);
  const [showQuests, setShowQuests] = useState<boolean>(false);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [showProfile, setShowProfile] = useState<boolean>(false);
  const [showAdmin, setShowAdmin] = useState<boolean>(false);
  const [showHouse, setShowHouse] = useState<boolean>(false);
  const [showVehicle, setShowVehicle] = useState<boolean>(false);
  const [showMarket, setShowMarket] = useState<boolean>(false);
  const [inspectedPlayer, setInspectedPlayer] = useState<{ idOrName: string; initialProfile?: any } | null>(null);

  // Global marquee announcement from Admin
  const [globalAnnouncement, setGlobalAnnouncement] = useState<{ text: string; sender: string } | null>(null);


  // Sound state
  const [isMuted, setIsMuted] = useState<boolean>(sounds.isMuted);

  // Floating in-game notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-login on mount if token exists in server
  useEffect(() => {
    const savedToken = localStorage.getItem('game_auth_token');
    if (savedToken) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${savedToken}` }
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            setUser(data.user);
            setToken(savedToken);
            setIsLoggedIn(true);
          } else {
            localStorage.removeItem('game_auth_token');
            setIsLoggedIn(false);
          }
        })
        .catch(() => {
          // If server is not ready or offline
        });
    }
  }, []);


  // Sync user state to localStorage
  const handleUpdateUser = useCallback((partial: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated: UserProfile = { ...prev, ...partial };
      try {
        localStorage.setItem(`avatar_user_${updated.username}`, JSON.stringify(updated));
      } catch {
        // LocalStorage quota safety
      }
      return updated;
    });
  }, []);

  // Toast feedback helper
  const showMessage = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  // Dismiss toast after 4.5s
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Handler soi thông tin, nhà cửa & kho đồ người chơi
  const handleInspectPlayer = useCallback((idOrName: string, initialProfile?: any) => {
    setInspectedPlayer({ idOrName, initialProfile });
  }, []);

  // Periodic passive energy recovery (1 energy every 25 seconds)
  useEffect(() => {
    if (!isLoggedIn || !user) return;
    const interval = setInterval(() => {
      setUser((current) => {
        if (!current) return current;
        if (current.energy < current.maxEnergy) {
          const updated = { ...current, energy: Math.min(current.maxEnergy, current.energy + 1) };
          localStorage.setItem(`avatar_user_${updated.username}`, JSON.stringify(updated));
          return updated;
        }
        return current;
      });
    }, 25000);
    return () => clearInterval(interval);
  }, [isLoggedIn, user?.username]);

  // Handle login callback
  const handleLoginSuccess = useCallback((loggedInUser: UserProfile, receivedToken: string) => {
    setUser(loggedInUser);
    setToken(receivedToken);
    setIsLoggedIn(true);
    localStorage.setItem('game_auth_token', receivedToken);
    showMessage(`Xin chào ${loggedInUser.nickname}!`);
  }, [showMessage]);

  // Handle logout
  const handleLogout = useCallback(() => {
    localStorage.removeItem('game_auth_token');
    setUser(null);
    setToken('');
    setIsLoggedIn(false);
    setShowAdmin(false);
    showMessage('Bạn đã đăng xuất khỏi game.');
  }, [showMessage]);

  // WebSocket Live Connection for Chat, Kick & Announcements
  useEffect(() => {
    if (!isLoggedIn || !token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?token=${token}`;
    let socket: WebSocket | null = null;

    try {
      socket = new WebSocket(wsUrl);

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'KICK_DUPLICATE_LOGIN' || data.type === 'KICKED_BY_ADMIN') {
            alert(data.message || 'Tài khoản của bạn đã bị ngắt kết nối.');
            handleLogout();
          } else if (data.type === 'GLOBAL_ANNOUNCEMENT') {
            setGlobalAnnouncement({ text: data.text, sender: data.sender });
            sounds.playWin();
            setTimeout(() => setGlobalAnnouncement(null), 12000);
          }
        } catch {}
      };
    } catch {}

    return () => {
      if (socket && socket.readyState === 1) {
        socket.close();
      }
    };
  }, [isLoggedIn, token, handleLogout]);

  // Handle Toggle Mute
  const handleToggleMute = useCallback(() => {
    const nextMuted = sounds.toggleMute();
    setIsMuted(nextMuted);
    showMessage(nextMuted ? 'Đã tắt âm thanh' : 'Đã bật âm thanh');
  }, [showMessage]);

  const unclaimedQuestsCount = user
    ? user.quests.filter((q) => q.completed && !q.claimed).length
    : 0;

  return (
    <div className="min-h-screen bg-[#180d08] text-amber-100 flex flex-col selection:bg-amber-500 selection:text-black font-sans">
      {/* Global Marquee Announcement Banner */}
      {globalAnnouncement && (
        <div className="bg-gradient-to-r from-red-600 via-amber-500 to-red-600 text-black px-4 py-1 font-bold text-xs flex items-center justify-between border-b-2 border-yellow-300 shadow-lg animate-pulse z-50">
          <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
            <span className="bg-black text-yellow-300 px-1.5 py-0.5 rounded text-[10px] uppercase font-black tracking-wider shrink-0">
              📢 THÔNG BÁO ({globalAnnouncement.sender})
            </span>
            <span className="font-pixel text-xs tracking-wide">{globalAnnouncement.text}</span>
          </div>
          <button onClick={() => setGlobalAnnouncement(null)} className="text-black hover:text-white font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* If Not Logged In, Show Login / Key Modal */}
      {!isLoggedIn || !user ? (
        <LoginModal onLoginSuccess={handleLoginSuccess} onShowMessage={showMessage} />
      ) : (
        <>
          {/* Top Bar Status */}
          <TopBar
            user={user}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onOpenInventory={() => setShowInventory(true)}
            onOpenQuests={() => setShowQuests(true)}
            onOpenLeaderboard={() => setShowLeaderboard(true)}
            onOpenProfile={() => setShowProfile(true)}
            onOpenAdmin={() => setShowAdmin(true)}
            onLogout={handleLogout}
            unclaimedQuestsCount={unclaimedQuestsCount}
          />

          {/* Floating Toast Notification */}
          {toastMessage && (
            <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-200 pointer-events-none max-w-md w-11/12">
              <div className="bg-[#241209]/95 text-amber-200 border-2 border-yellow-500/80 shadow-2xl px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-center backdrop-blur flex items-center justify-center gap-2">
                <span>🔔</span>
                <span>{toastMessage}</span>
              </div>
            </div>
          )}

          {/* Main Area View */}
          <main className="flex-1 overflow-x-hidden">
            {currentArea === 'farm' && (
              <FarmArea
                user={user}
                onUpdateUser={handleUpdateUser}
                onShowMessage={showMessage}
              />
            )}

            {currentArea === 'fishing' && (
              <FishingArea
                user={user}
                onUpdateUser={handleUpdateUser}
                onShowMessage={showMessage}
                onOpenShop={() => setShowShop(true)}
              />
            )}

            {currentArea === 'casino' && (
              <MiniGameArea
                user={user}
                onUpdateUser={handleUpdateUser}
                onShowMessage={showMessage}
              />
            )}

            {currentArea === 'park' && (
              <ParkArea
                user={user}
                onUpdateUser={handleUpdateUser}
                onShowMessage={showMessage}
                onInspectPlayer={handleInspectPlayer}
              />
            )}
          </main>

          {/* Bottom Dock Navigation */}
          <NavigationDock
            currentArea={currentArea}
            onChangeArea={setCurrentArea}
            onOpenShop={() => setShowShop(true)}
            onOpenHouse={() => setShowHouse(true)}
            onOpenVehicle={() => setShowVehicle(true)}
            onOpenMarket={() => setShowMarket(true)}
          />

          {/* Modals */}
          {showAdmin && (
            <AdminModal
              token={token}
              onClose={() => setShowAdmin(false)}
              onShowMessage={showMessage}
            />
          )}

          {showHouse && (
            <HouseModal
              user={user}
              token={token}
              onUpdateUser={handleUpdateUser}
              onClose={() => setShowHouse(false)}
              onShowMessage={showMessage}
            />
          )}

          {showVehicle && (
            <VehicleShopModal
              user={user}
              token={token}
              onUpdateUser={handleUpdateUser}
              onClose={() => setShowVehicle(false)}
              onShowMessage={showMessage}
            />
          )}

          {showMarket && (
            <MarketplaceModal
              user={user}
              token={token}
              onUpdateUser={handleUpdateUser}
              onClose={() => setShowMarket(false)}
              onShowMessage={showMessage}
              onInspectPlayer={handleInspectPlayer}
            />
          )}

          {showShop && (
            <ShopModal
              user={user}
              onUpdateUser={handleUpdateUser}
              onClose={() => setShowShop(false)}
              onShowMessage={showMessage}
            />
          )}

          {showInventory && (
            <InventoryModal
              user={user}
              onUpdateUser={handleUpdateUser}
              onClose={() => setShowInventory(false)}
              onShowMessage={showMessage}
            />
          )}

          {showQuests && (
            <QuestModal
              user={user}
              token={token}
              onUpdateUser={handleUpdateUser}
              onClose={() => setShowQuests(false)}
              onShowMessage={showMessage}
            />
          )}

          {showLeaderboard && (
            <LeaderboardModal
              user={user}
              onClose={() => setShowLeaderboard(false)}
              onInspectPlayer={handleInspectPlayer}
            />
          )}

          {showProfile && (
            <ProfileModal
              user={user}
              onUpdateUser={handleUpdateUser}
              onClose={() => setShowProfile(false)}
              onShowMessage={showMessage}
            />
          )}

          {/* Inspect Profile Modal (Soi nhà cửa & vật phẩm người khác) */}
          {inspectedPlayer && (
            <InspectProfileModal
              targetIdOrName={inspectedPlayer.idOrName}
              initialProfile={inspectedPlayer.initialProfile}
              onClose={() => setInspectedPlayer(null)}
              onShowMessage={showMessage}
            />
          )}

        </>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { UserProfile, InventoryItem } from '../types';
import { sounds } from '../utils/audio';
import { Store, ShoppingBag, Plus, RefreshCw, X, Coins, Check } from 'lucide-react';

interface MarketplaceModalProps {
  user: UserProfile;
  token: string;
  onUpdateUser: (updatedUser: Partial<UserProfile>) => void;
  onClose: () => void;
  onShowMessage: (msg: string) => void;
}

export const MarketplaceModal: React.FC<MarketplaceModalProps> = ({
  user,
  token,
  onUpdateUser,
  onClose,
  onShowMessage,
}) => {
  const [activeTab, setActiveTab] = useState<'market' | 'my_shop'>('market');
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Form list item
  const [selectedItemToSell, setSelectedItemToSell] = useState<InventoryItem | null>(null);
  const [sellCount, setSellCount] = useState<number>(1);
  const [sellPriceXu, setSellPriceXu] = useState<number>(100);

  const fetchMarket = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/game/market');
      const data = await res.json();
      if (data.success) {
        setListings(data.listings);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarket();
  }, []);

  const handleBuyItem = async (listingId: number) => {
    sounds.playClick();
    setLoading(true);
    try {
      const res = await fetch('/api/game/market/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ listingId })
      });
      const data = await res.json();
      if (data.success && data.user) {
        sounds.playWin();
        onUpdateUser(data.user);
        onShowMessage(data.message);
        fetchMarket();
      } else {
        onShowMessage(data.error || 'Lỗi mua hàng.');
      }
    } catch {
      onShowMessage('Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  const handleListItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemToSell) return;

    sounds.playClick();
    setLoading(true);
    try {
      const res = await fetch('/api/game/market/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          itemId: selectedItemToSell.id,
          count: sellCount,
          priceXu: sellPriceXu
        })
      });
      const data = await res.json();
      if (data.success && data.user) {
        sounds.playWin();
        onUpdateUser(data.user);
        onShowMessage(data.message);
        setSelectedItemToSell(null);
        setActiveTab('market');
        fetchMarket();
      } else {
        onShowMessage(data.error || 'Lỗi bày bán.');
      }
    } catch {
      onShowMessage('Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-[#1e100a] border-4 border-amber-600 rounded-2xl shadow-[0_0_50px_rgba(217,119,6,0.3)] flex flex-col max-h-[90vh] overflow-hidden text-amber-100 font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-950 via-[#2a170e] to-amber-950 border-b-2 border-amber-600/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-amber-300 font-pixel flex items-center gap-2">
                SÀN GIAO DỊCH & CHỢ ĐÊM AVATAR
              </h2>
              <p className="text-xs text-amber-300/80">Trao đổi mua bán tự do giữa các người chơi toàn server</p>
            </div>
          </div>
          <button
            onClick={() => { sounds.playClick(); onClose(); }}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/60 rounded-xl transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-amber-900/60 bg-[#160c07] px-6 gap-2">
          <button
            onClick={() => { sounds.playClick(); setActiveTab('market'); }}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition ${
              activeTab === 'market'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4" /> Dạo Chợ Mua Đồ ({listings.length})
          </button>
          <button
            onClick={() => { sounds.playClick(); setActiveTab('my_shop'); }}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition ${
              activeTab === 'my_shop'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Plus className="w-4 h-4" /> Mở Sạp Bày Bán Đồ
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'market' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-300">Danh sách các món đồ đang được bày bán:</p>
                <button
                  onClick={fetchMarket}
                  className="flex items-center gap-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg border border-zinc-700"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Làm mới
                </button>
              </div>

              {listings.length === 0 ? (
                <div className="text-center py-12 text-zinc-400 text-xs">
                  Hiện chưa có người chơi nào bày bán đồ trên Chợ Đêm. Hãy là người đầu tiên mở sạp!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {listings.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-[#24130b] border border-amber-800/60 rounded-xl flex items-center justify-between gap-3 hover:border-amber-500 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{item.item_icon}</span>
                        <div>
                          <p className="font-bold text-amber-200 text-xs">{item.item_name} x{item.count}</p>
                          <p className="text-[10px] text-zinc-400">Người bán: <span className="text-amber-400 font-semibold">{item.seller_name}</span></p>
                          <p className="text-xs text-yellow-400 font-bold mt-1">{item.price_xu?.toLocaleString()} Xu</p>
                        </div>
                      </div>

                      {item.seller_id === user.id ? (
                        <span className="text-[10px] text-zinc-400 bg-zinc-800 px-2 py-1 rounded">Sạp của bạn</span>
                      ) : (
                        <button
                          disabled={loading || user.xu < item.price_xu}
                          onClick={() => handleBuyItem(item.id)}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-bold rounded-lg text-xs transition"
                        >
                          Mua
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* TAB: MY SHOP (BÀY BÁN) */
            <div className="space-y-4 max-w-xl mx-auto">
              <h4 className="text-sm font-bold text-amber-300">Chọn món đồ trong túi của bạn để treo bán:</h4>

              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-2 bg-[#140b07] border border-zinc-800 rounded-xl">
                {user.inventory.filter(i => i.count > 0).map((inv) => (
                  <button
                    key={inv.id}
                    onClick={() => {
                      setSelectedItemToSell(inv);
                      setSellCount(1);
                      setSellPriceXu((inv.sellPrice || 50) * 2);
                    }}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center transition ${
                      selectedItemToSell?.id === inv.id
                        ? 'bg-amber-500/20 border-yellow-400 scale-105'
                        : 'bg-[#22120a] border-zinc-800 hover:border-amber-700'
                    }`}
                  >
                    <span className="text-2xl">{inv.icon}</span>
                    <span className="text-[9px] text-zinc-300 truncate w-full text-center mt-1">{inv.name}</span>
                    <span className="text-[8px] text-amber-400 font-bold">x{inv.count}</span>
                  </button>
                ))}
              </div>

              {selectedItemToSell && (
                <form onSubmit={handleListItem} className="p-4 bg-[#26140b] border border-amber-600/50 rounded-xl space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{selectedItemToSell.icon}</span>
                    <div>
                      <p className="text-xs font-bold text-amber-200">Bày bán: {selectedItemToSell.name}</p>
                      <p className="text-[10px] text-zinc-400">Số lượng có trong túi: {selectedItemToSell.count}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-zinc-400 block mb-1">Số lượng bán:</label>
                      <input
                        type="number"
                        min={1}
                        max={selectedItemToSell.count}
                        value={sellCount}
                        onChange={(e) => setSellCount(Number(e.target.value))}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-400 block mb-1">Giá bán tổng (Xu):</label>
                      <input
                        type="number"
                        min={10}
                        value={sellPriceXu}
                        onChange={(e) => setSellPriceXu(Number(e.target.value))}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-yellow-400 font-bold"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black rounded-lg text-xs transition"
                  >
                    + Đăng Lên Chợ Đêm Ngay
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

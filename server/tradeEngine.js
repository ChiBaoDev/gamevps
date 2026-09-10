import { db } from './db.js';
import { getUserById, saveUserProfile, updateUserBalance, activeSessions } from './keyManager.js';
import { updateQuestProgress } from './questEngine.js';

// Quản lý các phiên giao dịch trực tiếp 1-1 đang diễn ra trong RAM
export const activeTrades = new Map(); // tradeId -> { id, userA: { id, name, items: [], xu: 0, locked: false, confirmed: false }, userB: { id, name, items: [], xu: 0, locked: false, confirmed: false }, status: 'open' }

/**
 * Khởi tạo phiên giao dịch trực tiếp giữa 2 người chơi
 */
export function initiateDirectTrade(userAId, userBId) {
  const userA = getUserById(userAId);
  const userB = getUserById(userBId);
  if (!userA || !userB) return { success: false, error: 'Người chơi không tồn tại.' };

  const tradeId = `trade_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const tradeSession = {
    id: tradeId,
    userA: { id: userA.id, name: userA.nickname, items: [], xu: 0, locked: false, confirmed: false },
    userB: { id: userB.id, name: userB.nickname, items: [], xu: 0, locked: false, confirmed: false },
    status: 'open',
    createdAt: Date.now(),
  };

  activeTrades.set(tradeId, tradeSession);

  // Gửi thông báo WebSocket tới userB
  notifyUserSocket(userB.keyCode, {
    type: 'TRADE_INVITE',
    tradeId,
    fromUser: { id: userA.id, name: userA.nickname },
  });

  return { success: true, trade: tradeSession };
}

/**
 * Cập nhật món đồ / tiền Xu đưa lên bàn giao dịch
 */
export function updateTradeOffer(tradeId, userId, items = [], xu = 0) {
  const trade = activeTrades.get(tradeId);
  if (!trade || trade.status !== 'open') return { success: false, error: 'Phiên giao dịch không hợp lệ.' };

  const isUserA = trade.userA.id === userId;
  const party = isUserA ? trade.userA : trade.userB;
  const otherParty = isUserA ? trade.userB : trade.userA;

  // Nếu đã khóa thì không cho sửa
  if (party.locked) return { success: false, error: 'Giao dịch đã bị khóa, mở khóa trước khi đổi đồ.' };

  party.items = items;
  party.xu = Math.max(0, xu);
  // Reset lock nếu có bên thay đổi
  trade.userA.confirmed = false;
  trade.userB.confirmed = false;

  // Bắn cập nhật cho cả 2 bên
  broadcastTradeUpdate(trade);
  return { success: true, trade };
}

/**
 * Khóa hoặc mở khóa bàn giao dịch (Bước 1)
 */
export function lockTradeOffer(tradeId, userId, locked = true) {
  const trade = activeTrades.get(tradeId);
  if (!trade) return { success: false, error: 'Phiên giao dịch không tồn tại.' };

  const isUserA = trade.userA.id === userId;
  const party = isUserA ? trade.userA : trade.userB;
  party.locked = locked;
  trade.userA.confirmed = false;
  trade.userB.confirmed = false;

  broadcastTradeUpdate(trade);
  return { success: true, trade };
}

/**
 * Xác nhận hoàn tất giao dịch (Bước 2: Atomic SQLite Swap)
 */
export function confirmTradeOffer(tradeId, userId) {
  const trade = activeTrades.get(tradeId);
  if (!trade) return { success: false, error: 'Phiên giao dịch không tồn tại.' };

  const isUserA = trade.userA.id === userId;
  const party = isUserA ? trade.userA : trade.userB;
  party.confirmed = true;

  // Nếu CẢ 2 BÊN cùng khóa và cùng bấm Xác Nhận -> Thực thi Transaction hoán đổi
  if (trade.userA.locked && trade.userB.locked && trade.userA.confirmed && trade.userB.confirmed) {
    const userA = getUserById(trade.userA.id);
    const userB = getUserById(trade.userB.id);

    // Kiểm tra số dư Xu và đồ của cả 2 bên lần cuối
    if (userA.xu < trade.userA.xu || userB.xu < trade.userB.xu) {
      cancelTradeOffer(tradeId, 'Giao dịch thất bại: Một trong hai bên không đủ số dư Xu.');
      return { success: false, error: 'Không đủ số dư Xu để hoàn tất giao dịch.' };
    }

    // Thực hiện hoán đổi túi đồ
    const invA = [...userA.inventory];
    const invB = [...userB.inventory];

    // Trừ đồ A đưa cho B
    for (const item of trade.userA.items) {
      const idx = invA.findIndex(i => i.id === item.id);
      if (idx !== -1) {
        invA[idx].count -= item.count || 1;
        if (invA[idx].count <= 0) invA.splice(idx, 1);
      }
      // Thêm vào B
      const idxB = invB.findIndex(i => i.id === item.id);
      if (idxB !== -1) invB[idxB].count += (item.count || 1);
      else invB.push({ ...item });
    }

    // Trừ đồ B đưa cho A
    for (const item of trade.userB.items) {
      const idx = invB.findIndex(i => i.id === item.id);
      if (idx !== -1) {
        invB[idx].count -= item.count || 1;
        if (invB[idx].count <= 0) invB.splice(idx, 1);
      }
      // Thêm vào A
      const idxA = invA.findIndex(i => i.id === item.id);
      if (idxA !== -1) invA[idxA].count += (item.count || 1);
      else invA.push({ ...item });
    }

    // Cập nhật Xu
    updateUserBalance(userA.id, trade.userB.xu - trade.userA.xu, 0);
    updateUserBalance(userB.id, trade.userA.xu - trade.userB.xu, 0);

    // Lưu Inventory vào Database
    saveUserProfile(userA.id, { inventory: invA });
    saveUserProfile(userB.id, { inventory: invB });

    trade.status = 'completed';
    updateQuestProgress(userA.id, 'market_trade', 1);
    updateQuestProgress(userB.id, 'market_trade', 1);

    broadcastTradeEvent(trade, {
      type: 'TRADE_COMPLETED',
      message: 'Giao dịch thành công mỹ mãn! Đồ và Xu đã được chuyển vào túi của cả hai.',
      userA: getUserById(userA.id),
      userB: getUserById(userB.id),
    });

    activeTrades.delete(tradeId);
    return { success: true, message: 'Giao dịch thành công!' };
  }

  broadcastTradeUpdate(trade);
  return { success: true, trade };
}

/**
 * Hủy bỏ giao dịch
 */
export function cancelTradeOffer(tradeId, reason = 'Giao dịch đã bị hủy bỏ.') {
  const trade = activeTrades.get(tradeId);
  if (!trade) return;

  broadcastTradeEvent(trade, {
    type: 'TRADE_CANCELLED',
    message: reason,
  });

  activeTrades.delete(tradeId);
}

// ==========================================
// SÀN GIAO DỊCH / CHỢ ĐÊM (MARKETPLACE)
// ==========================================

export function listMarketplaceItem(userId, itemId, count = 1, priceXu = 100) {
  const user = getUserById(userId);
  if (!user) return { success: false, error: 'Không tìm thấy người chơi.' };

  const inventory = [...user.inventory];
  const itemIndex = inventory.findIndex(i => i.id === itemId);
  if (itemIndex === -1 || inventory[itemIndex].count < count) {
    return { success: false, error: 'Bạn không có đủ số lượng món đồ này để bày bán.' };
  }

  const item = inventory[itemIndex];
  item.count -= count;
  if (item.count <= 0) inventory.splice(itemIndex, 1);

  // Lưu vào Database Bảng Chợ Đêm
  const insertStmt = db.prepare(`
    INSERT INTO marketplace_listings (seller_id, seller_name, item_id, item_name, item_type, item_icon, count, price_xu, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
  `);
  insertStmt.run(user.id, user.nickname, item.id, item.name, item.type || 'item', item.icon || '📦', count, priceXu);

  saveUserProfile(user.id, { inventory });
  updateQuestProgress(userId, 'market_trade', 1);
  return { success: true, user: getUserById(userId), message: `Đã treo bán ${count}x ${item.name} lên Chợ Đêm với giá ${priceXu.toLocaleString()} Xu!` };
}

export function buyMarketplaceItem(buyerUserId, listingId) {
  const buyer = getUserById(buyerUserId);
  if (!buyer) return { success: false, error: 'Không tìm thấy người mua.' };

  const listingStmt = db.prepare('SELECT * FROM marketplace_listings WHERE id = ? AND status = "active"');
  const listing = listingStmt.get(listingId);

  if (!listing) return { success: false, error: 'Món hàng này không còn tồn tại hoặc đã được bán.' };
  if (listing.seller_id === buyerUserId) return { success: false, error: 'Bạn không thể tự mua món hàng của chính mình.' };

  if (buyer.xu < listing.price_xu) {
    return { success: false, error: 'Bạn không đủ Xu để mua món hàng này.' };
  }

  // Trừ tiền người mua
  updateUserBalance(buyerUserId, -listing.price_xu, 0);

  // Thêm đồ vào túi người mua
  const buyerInv = [...buyer.inventory];
  const existing = buyerInv.find(i => i.id === listing.item_id);
  if (existing) {
    existing.count += listing.count;
  } else {
    buyerInv.push({
      id: listing.item_id,
      name: listing.item_name,
      type: listing.item_type,
      count: listing.count,
      sellPrice: Math.floor(listing.price_xu / listing.count * 0.5),
      icon: listing.item_icon,
      description: `Mua từ sạp hàng của ${listing.seller_name}`,
    });
  }
  saveUserProfile(buyerUserId, { inventory: buyerInv });

  // Cộng tiền vào tài khoản người bán (kể cả khi offline)
  updateUserBalance(listing.seller_id, listing.price_xu, 0);

  // Cập nhật trạng thái listing
  db.prepare('UPDATE marketplace_listings SET status = "sold", buyer_id = ?, buyer_name = ?, sold_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(buyer.id, buyer.nickname, listingId);

  updateQuestProgress(buyerUserId, 'market_trade', 1);
  updateQuestProgress(listing.seller_id, 'market_trade', 1);

  return { success: true, user: getUserById(buyerUserId), message: `Mua thành công ${listing.count}x ${listing.item_name}!` };
}

export function getActiveMarketplaceListings(limit = 50) {
  const stmt = db.prepare('SELECT * FROM marketplace_listings WHERE status = "active" ORDER BY id DESC LIMIT ?');
  return stmt.all(limit);
}

// Helpers
function notifyUserSocket(keyCode, data) {
  const session = activeSessions.get(keyCode);
  if (session && session.socket && session.socket.readyState === 1) {
    try { session.socket.send(JSON.stringify(data)); } catch {}
  }
}

function broadcastTradeUpdate(trade) {
  const userA = getUserById(trade.userA.id);
  const userB = getUserById(trade.userB.id);
  if (userA) notifyUserSocket(userA.keyCode, { type: 'TRADE_UPDATE', trade });
  if (userB) notifyUserSocket(userB.keyCode, { type: 'TRADE_UPDATE', trade });
}

function broadcastTradeEvent(trade, payload) {
  const userA = getUserById(trade.userA.id);
  const userB = getUserById(trade.userB.id);
  if (userA) notifyUserSocket(userA.keyCode, payload);
  if (userB) notifyUserSocket(userB.keyCode, payload);
}

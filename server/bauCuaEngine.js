import { getDb } from './db.js';
import { getUserByToken, activeSessions } from './keyManager.js';

/**
 * Danh mục 6 Linh vật Bầu Cua
 */
export const MASCOTS = ['bau', 'cua', 'tom', 'ca', 'ga', 'nai'];

export const MASCOT_INFO = {
  bau: { id: 'bau', name: 'Bầu', icon: '🍐', color: 'from-amber-600 to-amber-800' },
  cua: { id: 'cua', name: 'Cua', icon: '🦀', color: 'from-rose-600 to-red-800' },
  tom: { id: 'tom', name: 'Tôm', icon: '🦐', color: 'from-orange-600 to-orange-800' },
  ca: { id: 'ca', name: 'Cá', icon: '🐟', color: 'from-sky-600 to-blue-800' },
  ga: { id: 'ga', name: 'Gà', icon: '🐓', color: 'from-yellow-600 to-yellow-800' },
  nai: { id: 'nai', name: 'Nai', icon: '🦌', color: 'from-emerald-700 to-green-900' },
};

/**
 * Trạng thái phòng chơi Bầu Cua Realtime
 */
class BauCuaRoom {
  constructor() {
    this.phase = 'BETTING'; // 'BETTING' (25s) -> 'SHAKING' (4s) -> 'PEEKING' (7s) -> 'PAYOUT' (5s)
    this.remainingSec = 25;
    this.roundId = Date.now();
    this.dice = ['bau', 'cua', 'tom'];
    
    // betsByUser: Map<userId, { [mascot]: amount, nickname: string }>
    this.betsByUser = new Map();
    // totalBets: { [mascot]: totalAmount }
    this.totalBets = { bau: 0, cua: 0, tom: 0, ca: 0, ga: 0, nai: 0 };
    this.history = [];
    this.broadcastCallback = null;
    this.timer = null;

    this.loadHistory();
  }

  setBroadcastCallback(fn) {
    this.broadcastCallback = fn;
  }

  loadHistory() {
    try {
      const db = getDb();
      const rows = db.prepare(`
        SELECT id, dice_1, dice_2, dice_3, created_at 
        FROM baucua_rounds 
        WHERE dice_1 IS NOT NULL 
        ORDER BY id DESC 
        LIMIT 12
      `).all();

      this.history = rows.map(r => ({
        id: r.id,
        dice: [r.dice_1, r.dice_2, r.dice_3],
        time: r.created_at,
      }));
    } catch (e) {
      console.error('[BauCua] Lỗi tải lịch sử:', e);
      this.history = [];
    }
  }

  startLoop() {
    if (this.timer) clearInterval(this.timer);

    this.timer = setInterval(() => {
      this.tick();
    }, 1000);
    console.log('[BauCua] 🎲 Realtime Game Loop đã khởi động (Chu kỳ 41s)');
  }

  tick() {
    this.remainingSec -= 1;

    if (this.remainingSec <= 0) {
      this.advancePhase();
    } else {
      // Broadcast nhịp đếm mỗi giây
      this.broadcastState();
    }
  }

  advancePhase() {
    if (this.phase === 'BETTING') {
      // Chuyển sang Lắc Đĩa (4 giây)
      this.phase = 'SHAKING';
      this.remainingSec = 4;

      // Random 3 viên xúc xắc
      const d1 = MASCOTS[Math.floor(Math.random() * MASCOTS.length)];
      const d2 = MASCOTS[Math.floor(Math.random() * MASCOTS.length)];
      const d3 = MASCOTS[Math.floor(Math.random() * MASCOTS.length)];
      this.dice = [d1, d2, d3];

      // Lưu round vào SQLite
      try {
        const db = getDb();
        const totalPot = Object.values(this.totalBets).reduce((a, b) => a + b, 0);
        const roundUuid = `BC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        db.prepare(`
          INSERT INTO baucua_rounds (round_uuid, dice_1, dice_2, dice_3, total_bets_xu, total_payout_xu, created_at)
          VALUES (?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
        `).run(roundUuid, d1, d2, d3, totalPot);
      } catch (e) {
        console.error('[BauCua] Lỗi ghi SQLite round:', e);
      }

    } else if (this.phase === 'SHAKING') {
      // Chuyển sang Nặn Bát (7 giây)
      this.phase = 'PEEKING';
      this.remainingSec = 7;

    } else if (this.phase === 'PEEKING') {
      // Chuyển sang Trả Thưởng & Mở Bát Toàn Phần (5 giây)
      this.phase = 'PAYOUT';
      this.remainingSec = 5;

      this.processPayouts();
      this.loadHistory();

    } else if (this.phase === 'PAYOUT') {
      // Reset vòng mới
      this.phase = 'BETTING';
      this.remainingSec = 25;
      this.roundId = Date.now();
      this.betsByUser.clear();
      this.totalBets = { bau: 0, cua: 0, tom: 0, ca: 0, ga: 0, nai: 0 };
    }

    this.broadcastState(true);
  }

  /**
   * Tính toán và trả thưởng cho toàn bộ người chơi đặt cược
   */
  processPayouts() {
    const db = getDb();
    const results = this.dice;
    let totalPayoutCalculated = 0;

    try {
      db.exec('BEGIN');

      for (const [userId, userBetInfo] of this.betsByUser.entries()) {
        let totalWinXu = 0;
        let totalBetXu = 0;

        for (const mascot of MASCOTS) {
          const betAmount = userBetInfo[mascot] || 0;
          if (betAmount > 0) {
            totalBetXu += betAmount;
            const matchCount = results.filter(d => d === mascot).length;
            if (matchCount > 0) {
              // Thắng: Trả lại tiền cược gốc + tiền thưởng (matchCount * cược)
              const winXu = betAmount + (betAmount * matchCount);
              totalWinXu += winXu;
            }
          }
        }

        totalPayoutCalculated += totalWinXu;

        // Cập nhật số dư người chơi và chỉ số
        if (totalWinXu > 0) {
          db.prepare(`
            UPDATE users 
            SET xu = xu + ?, 
                stats = json_set(
                  stats, 
                  '$.miniGamesPlayed', COALESCE(json_extract(stats, '$.miniGamesPlayed'), 0) + 1,
                  '$.miniGamesWon', COALESCE(json_extract(stats, '$.miniGamesWon'), 0) + 1,
                  '$.moneyEarned', COALESCE(json_extract(stats, '$.moneyEarned'), 0) + ?
                )
            WHERE id = ?
          `).run(totalWinXu, totalWinXu, userId);
        } else if (totalBetXu > 0) {
          db.prepare(`
            UPDATE users 
            SET stats = json_set(
                  stats, 
                  '$.miniGamesPlayed', COALESCE(json_extract(stats, '$.miniGamesPlayed'), 0) + 1
                )
            WHERE id = ?
          `).run(userId);
        }

        // Lưu bản ghi cược vào baucua_bets
        try {
          db.prepare(`
            INSERT INTO baucua_bets (round_id, user_id, user_name, choice, bet_amount, payout_amount, created_at)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          `).run(1, userId, userBetInfo.nickname || 'Người chơi', JSON.stringify(userBetInfo), totalBetXu, totalWinXu);
        } catch {}
      }

      db.exec('COMMIT');
    } catch (e) {
      try { db.exec('ROLLBACK'); } catch {}
      console.error('[BauCua] Lỗi transaction trả thưởng:', e);
    }
  }

  /**
   * Đặt cược của người chơi
   */
  placeBet(userId, mascot, amount) {
    if (this.phase !== 'BETTING') {
      return { success: false, error: 'Đã hết thời gian đặt cược!' };
    }
    if (!MASCOTS.includes(mascot)) {
      return { success: false, error: 'Linh vật cược không hợp lệ!' };
    }
    if (amount <= 0 || !Number.isInteger(amount)) {
      return { success: false, error: 'Số Xu cược không hợp lệ!' };
    }

    const db = getDb();
    const userRow = db.prepare('SELECT id, xu, nickname FROM users WHERE id = ?').get(userId);
    if (!userRow) {
      return { success: false, error: 'Không tìm thấy thông tin người chơi!' };
    }
    if (userRow.xu < amount) {
      return { success: false, error: `Số dư không đủ! Bạn có ${userRow.xu} Xu.` };
    }

    // Trừ Xu trong SQLite ngay lập tức
    db.prepare('UPDATE users SET xu = xu - ? WHERE id = ?').run(amount, userId);

    // Ghi nhận vào RAM Room
    if (!this.betsByUser.has(userId)) {
      this.betsByUser.set(userId, {
        bau: 0, cua: 0, tom: 0, ca: 0, ga: 0, nai: 0,
        nickname: userRow.nickname
      });
    }

    const userBets = this.betsByUser.get(userId);
    userBets[mascot] = (userBets[mascot] || 0) + amount;
    this.totalBets[mascot] = (this.totalBets[mascot] || 0) + amount;

    // Lấy số dư mới
    const updatedUser = db.prepare('SELECT id, xu FROM users WHERE id = ?').get(userId);

    this.broadcastState();

    return { 
      success: true, 
      newBalance: updatedUser.xu,
      mascot, 
      amount,
      myTotalBetOnMascot: userBets[mascot]
    };
  }

  /**
   * Xuất state gửi về client
   */
  getStateForClient(userId = null) {
    let myBets = { bau: 0, cua: 0, tom: 0, ca: 0, ga: 0, nai: 0 };
    if (userId && this.betsByUser.has(userId)) {
      myBets = { ...this.betsByUser.get(userId) };
      delete myBets.nickname;
    }

    return {
      type: 'BAUCUA_STATE',
      phase: this.phase,
      remainingSec: this.remainingSec,
      roundId: this.roundId,
      // Chỉ gửi xúc xắc khi đang ở giai đoạn PEEKING hoặc PAYOUT
      dice: (this.phase === 'PEEKING' || this.phase === 'PAYOUT') ? this.dice : null,
      totalBets: this.totalBets,
      myBets,
      history: this.history,
    };
  }

  broadcastState(isPhaseChange = false) {
    if (!this.broadcastCallback) return;

    // Gửi broadcast chung tới tất cả
    const generalPayload = {
      type: 'BAUCUA_STATE_SYNC',
      phase: this.phase,
      remainingSec: this.remainingSec,
      roundId: this.roundId,
      dice: (this.phase === 'PEEKING' || this.phase === 'PAYOUT') ? this.dice : null,
      totalBets: this.totalBets,
      history: this.history,
      isPhaseChange,
    };

    this.broadcastCallback(generalPayload);
  }
}

export const bauCuaRoom = new BauCuaRoom();

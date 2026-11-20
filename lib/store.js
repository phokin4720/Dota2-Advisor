// เก็บสถานะล่าสุดและรายชื่อหน้าเว็บที่รอรับข้อมูล (ใช้ globalThis เพื่อแชร์ข้าม route)
export const store = (globalThis.__dotaStore ??= { state: null, clients: new Set() });

export function slim(g) {
  const items = [];
  for (const group of ['items', 'neutral_items']) {
    for (const v of Object.values(g[group] || {})) {
      if (v && v.name && v.name !== 'empty') items.push(v.name.replace('item_', ''));
    }
  }
  return {
    hero: g.hero ? { id: g.hero.id, name: g.hero.name, level: g.hero.level, alive: g.hero.alive } : null,
    player: g.player ? { gold: g.player.gold, gpm: g.player.gpm, xpm: g.player.xpm, kills: g.player.kills, deaths: g.player.deaths, assists: g.player.assists } : null,
    map: g.map ? { clock: g.map.clock_time, state: g.map.game_state } : null,
    items,
  };
}

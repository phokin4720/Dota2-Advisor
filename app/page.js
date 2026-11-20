'use client';
import { useEffect, useMemo, useState } from 'react';
import { advise, EXTRA_ITEMS } from '../lib/advisor';

const API = 'https://api.opendota.com/api';
const CDN = 'https://cdn.cloudflare.steamstatic.com';
const mmss = (s) => `${s < 0 ? '-' : ''}${Math.floor(Math.abs(s) / 60)}:${String(Math.abs(s) % 60).padStart(2, '0')}`;

export default function Page() {
  const [g, setG] = useState(null);
  const [live, setLive] = useState(false);
  const [heroes, setHeroes] = useState([]);
  const [items, setItems] = useState({});
  const [ids, setIds] = useState({});
  const [enemies, setEnemies] = useState([]);
  const [q, setQ] = useState('');
  const [pop, setPop] = useState(null);
  const [matchups, setMatchups] = useState(null);

  useEffect(() => {
    const j = (p) => fetch(API + p).then((r) => r.json());
    j('/heroStats').then(setHeroes).catch(() => {});
    j('/constants/items').then(setItems).catch(() => {});
    j('/constants/item_ids').then(setIds).catch(() => {});
    const es = new EventSource('/api/stream');
    es.onopen = () => setLive(true);
    es.onerror = () => setLive(false);
    es.onmessage = (e) => setG(JSON.parse(e.data));
    return () => es.close();
  }, []);

  const heroId = g?.hero?.id;
  useEffect(() => {
    if (!heroId) return;
    fetch(`${API}/heroes/${heroId}/itemPopularity`).then((r) => r.json()).then(setPop).catch(() => setPop(null));
  }, [heroId]);

  useEffect(() => {
    if (!heroId) { setMatchups(null); return; }
    let active = true;
    setMatchups(null);
    fetch(`${API}/heroes/${heroId}/matchups`)
      .then((r) => r.json())
      .then((rows) => {
        if (active && Array.isArray(rows)) setMatchups(Object.fromEntries(rows.map((row) => [row.hero_id, row])));
      })
      .catch(() => { if (active) setMatchups({}); });
    return () => { active = false; };
  }, [heroId]);

  const owned = useMemo(() => new Set(g?.items || []), [g]);
  const gold = g?.player?.gold ?? 0;
  const clock = g?.map?.clock ?? 0;
  const picked = heroes.filter((h) => enemies.includes(h.id));
  const phase = clock < 600 ? 'early_game_items' : clock < 1800 ? 'mid_game_items' : 'late_game_items';
  const popAll = Object.entries(pop?.[phase] || {}).map(([id, c]) => ({ key: ids[id], c })).filter((x) => x.key);
  const maxC = Math.max(1, ...popAll.map((x) => x.c));
  const popShare = Object.fromEntries(popAll.map((x) => [x.key, x.c / maxC]));
  const recs = advise({ enemies: picked, owned, clock, popShare });
  const attackKeys = new Set([
    'armlet', 'battle_fury', 'butterfly', 'daedalus', 'desolator', 'diffusal_blade',
    'divine_rapier', 'harpoon', 'maelstrom', 'mjollnir', 'monkey_king_bar',
    'manta', 'radiance', 'silver_edge', 'bloodthorn', 'witch_blade', 'parasma',
    'revenants_brooch', 'skadi', 'satanic', 'starforge',
  ]);
  const popular = popAll
    .filter((x) => items[x.key] && items[x.key].cost >= 500 && !owned.has(x.key) && !attackKeys.has(x.key))
    .sort((a, b) => b.c - a.c).slice(0, 5);
  const attackItems = popAll
    .filter((x) => attackKeys.has(x.key) && items[x.key] && !owned.has(x.key))
    .sort((a, b) => b.c - a.c).slice(0, 4);

  const shown = heroes.filter((h) => !enemies.includes(h.id) && h.localized_name.toLowerCase().includes(q.toLowerCase())).slice(0, 60);
  const toggle = (id) => setEnemies((e) => (e.includes(id) ? e.filter((x) => x !== id) : e.length < 5 ? [...e, id] : e));
  const matchupRisks = (hero) => {
    const roles = new Set((hero.roles || []).map((role) => role.toLowerCase()));
    const risks = [];
    if (roles.has('disabler')) risks.push('มีสกิลหยุดคุณ ระวังเดินแยกหรือเปิดไฟต์ก่อนเพื่อน');
    if (roles.has('nuker')) risks.push('ทำดาเมจเวทได้แรง ระวังเลือดลดเร็วเมื่อต้องเจอหน้า');
    if (roles.has('initiator')) risks.push('เปิดไฟต์ได้ ระวังยืนรวมกันหรือโชว์ตำแหน่ง');
    if (roles.has('escape')) risks.push('หนีเก่ง เก็บสกิลหยุดไว้ใช้ตอนเข้าประชิด');
    if (roles.has('carry')) risks.push('ยิ่งปล่อยให้ฟาร์มนานยิ่งอันตราย กดดันก่อนเข้าเลทเกม');
    if (roles.has('durable')) risks.push('ฆ่ายาก เตรียมดาเมจต่อเนื่องหรือไอเท็มลดการฟื้นเลือด');
    return risks.length ? risks : ['ดูสกิลและไอเท็มของศัตรูประกอบ ข้อมูลบทบาทยังบอกจุดอ่อนเฉพาะตัวไม่ได้'];
  };

  const Item = ({ k, why }) => {
    const it = items[k]; if (!it) return null;
    const need = it.cost - gold;
    return (
      <div className="rec">
        <img src={CDN + it.img} alt="" />
        <div>
          <strong>{it.dname}</strong> <span className="tag">{it.cost} ทอง</span>
          <span className={'tag ' + (need <= 0 ? 'ok' : 'no')}>{need <= 0 ? 'ซื้อได้เลย' : `ขาดอีก ${need}`}</span>
          <p>{why}</p>
        </div>
      </div>
    );
  };

  const flat = (t) => t.toLowerCase().replace(/[^a-z]/g, '');
  const findItem = (key) =>
    items[key] || Object.values(items).find((x) => x.dname && flat(x.dname) === flat(key)) || EXTRA_ITEMS[key] || null;

  // Follow the 7.42 recipe tree to the first missing purchase. OpenDota's
  // item constants provide components for existing items; keep recipes for
  // the three 7.42 additions here until those constants include them.
  const recipes = {
    skypiercer: ['heavens_halberd', 'sange', 'talisman_of_evasion', 'recipe'],
    starforge: ['meteor_hammer', 'ultimate_orb', 'recipe'],
    bloodslinger: ['sage_mask', 'mantle', 'mantle', 'blood_grenade', 'recipe'],
  };
  const inventoryCounts = (g?.items || []).reduce((counts, key) => {
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
  const nextPart = (key, counts = { ...inventoryCounts }, depth = 0) => {
    if (depth > 8) return null;
    let parts = recipes[key] || findItem(key)?.components;
    if (!parts?.length) return null;
    for (const part of parts) {
      if (counts[part] > 0) {
        counts[part] -= 1;
        continue;
      }
      // Show the next incomplete component as a useful intermediate target.
      const subparts = recipes[part] || findItem(part)?.components;
      if (subparts?.length) {
        const next = nextPart(part, counts, depth + 1);
        if (next) return next;
      }
      return { key: part, item: findItem(part) };
    }
    return { key, item: findItem(key) };
  };

  const Counter = ({ r }) => {
    const it = findItem(r.key); if (!it) return null;
    const need = it.cost - gold;
    const part = nextPart(r.key);
    const partName = part?.item?.dname || part?.key?.replaceAll('_', ' ');
    const partCost = part?.item?.cost;
    return (
      <div className="rec">
        {it.img ? <img src={CDN + it.img} alt="" /> : <div className="ph" />}
        <div className="grow">
          <strong>{it.dname}</strong> <span className="tag">{it.cost} ทอง</span>
          <span className={'tag ' + (need <= 0 ? 'ok' : 'no')}>{need <= 0 ? 'ซื้อได้เลย' : `ขาดอีก ${need}`}</span>
          {partName && <p className="buildstep"><b>ชิ้นถัดไป:</b> {partName}{Number.isFinite(partCost) ? ` · ${partCost} ทอง${gold >= partCost ? ' · ทองพอแล้ว' : ` · ขาด ${partCost - gold}`}` : ''}</p>}
          <div className="meter" role="img" aria-label={`ความเหมาะสม ${r.score}%`}><i style={{ width: r.score + '%' }} /></div>
          <p><b>ช่วยยังไง:</b> {r.how}</p>
          <p>{r.why} · เป้าหมาย: {r.targets.join(', ')}</p>
        </div>
        <div className="pct">{r.score}%</div>
      </div>
    );
  };

  return (
    <main>
      <h1>Dota Advisor</h1>
      <p className="sub">แนะนำไอเทมจากข้อมูลในเกมแบบสด ใช้คู่กับจอที่สองหรือมือถือ</p>

      <div className="bar">
        <div><span><i className={'dot' + (live && g ? ' on' : '')} />{live && g ? 'เชื่อมต่อเกมแล้ว' : 'รอข้อมูลจากเกม'}</span><b>{g?.hero?.name?.replace('npc_dota_hero_', '') || '-'}</b></div>
        <div><span>เวลา</span><b>{g?.map ? mmss(clock) : '-'}</b></div>
        <div><span>เลเวล</span><b>{g?.hero?.level ?? '-'}</b></div>
        <div className="gold"><span>ทอง</span><b>{gold}</b></div>
        <div><span>GPM / XPM</span><b>{g?.player ? `${g.player.gpm} / ${g.player.xpm}` : '-'}</b></div>
        <div><span>K / D / A</span><b>{g?.player ? `${g.player.kills}/${g.player.deaths}/${g.player.assists}` : '-'}</b></div>
      </div>

      <div className="grid">
        <section className="box">
          <h2>ฮีโร่ศัตรู ({enemies.length}/5)</h2>
          <div className="chips">
            {picked.map((h) => (
              <button key={h.id} className="chip" onClick={() => toggle(h.id)} title="กดเพื่อเอาออก">
                <img src={CDN + h.img} alt="" />{h.localized_name}
              </button>
            ))}
          </div>
          <input placeholder="ค้นหาฮีโร่..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="ค้นหาฮีโร่" />
          <div className="list">
            {shown.map((h) => (
              <button key={h.id} className="hero" onClick={() => toggle(h.id)}>
                <img src={CDN + h.img} alt="" />
                <span>{h.localized_name}</span>
              </button>
            ))}
          </div>
          {picked.length > 0 && <div className="matchups">
            <h2>จุดที่คุณเสียเปรียบ / สิ่งที่ต้องระวัง</h2>
            <p className="note">ใช้สถิติเทียบกับฮีโร่คุณและประเมินจากบทบาท อาจไม่ตรงกับแพตช์ปัจจุบัน</p>
            {picked.map((h) => {
              const row = matchups?.[h.id];
              const games = row?.games_played || 0;
              const rate = games ? Math.round((row.wins / games) * 100) : null;
              return <div className="matchup" key={h.id}>
                <strong>{h.localized_name}</strong>
              {rate !== null && <span className={'tag ' + (games < 100 ? '' : rate < 48 ? 'no' : rate >= 52 ? 'ok' : '')}>
                  {games < 100 ? 'ข้อมูลยังน้อย' : rate < 48 ? 'คุณเสียเปรียบ' : rate >= 52 ? 'คุณได้เปรียบ' : 'สูสี'} · คุณชนะ {rate}% ({games} เกม)
                </span>}
                {matchups && !row && <span className="tag">ยังไม่มีข้อมูลสถิติ</span>}
                {!matchups && <span className="tag">กำลังโหลดสถิติ…</span>}
                <ul>{matchupRisks(h).map((risk) => <li key={risk}>{risk}</li>)}</ul>
              </div>;
            })}
          </div>}
        </section>

        <section className="box">
          <h2>ออกอะไรชนะทาง</h2>
          <p className="note">คะแนนเป็นการประเมินจากกฎและความนิยม ไม่ใช่อัตราชนะ</p>
          {!enemies.length && <p className="empty">เลือกฮีโร่ศัตรูทางซ้ายเพื่อรับคำแนะนำ</p>}
          {recs.map((r) => (<Counter key={r.key} r={r} />))}
          {enemies.length > 0 && !recs.length && <p className="empty">ยังไม่มีไอเทมที่ต้องรีบซื้อเพิ่ม</p>}
          {attackItems.length > 0 && (<>
            <h2 style={{ marginTop: 16 }}>ไอเท็มเพิ่มดาเมจ</h2>
            <p className="note">อิงจากไอเท็มที่ฮีโร่นี้นิยมออก เป็นบิลด์พื้นฐาน ไม่ได้ปรับตามศัตรู</p>
            {attackItems.map((p) => <Item key={p.key} k={p.key} why="เพิ่มพลังโจมตีตามบิลด์ฮีโร่" />)}
          </>)}
          {popular.length > 0 && (<>
            <h2 style={{ marginTop: 16 }}>ไอเท็มอื่นที่ฮีโร่นี้นิยมออก</h2>
            {popular.map((p) => (<Item key={p.key} k={p.key} why="เลือกซื้อบ่อยในแมตช์จริง" />))}
          </>)}
        </section>
      </div>
    </main>
  );
}

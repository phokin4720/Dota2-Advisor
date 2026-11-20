// กฎแนะนำไอเทมที่ "ชนะทาง" ทีมศัตรู  (ชื่อไอเทมตาม OpenDota ไม่มี prefix item_)
// score = ความเหมาะสม 0-99% คำนวณจากกฎ + จำนวนศัตรูที่โดนเล่นงาน + ความนิยมของไอเทมกับฮีโร่เรา
// ไม่ใช่อัตราชนะจริงทางสถิติ
// ตรวจกับ patch 7.42 แล้ว (จากโน้ตแพตช์ฉบับเต็ม) ไอเทมที่ไม่อยู่ในรายการเปลี่ยนถือว่าไม่เปลี่ยน
// ไอเทมใหม่ที่ OpenDota อาจยังไม่มีข้อมูล ใส่ชื่อ/ราคาสำรองไว้ใน EXTRA_ITEMS (ราคาจากโน้ตแพตช์)
export const EXTRA_ITEMS = {
  skypiercer: { dname: 'Skypiercer', cost: 6000 },
  starforge: { dname: 'Starforge', cost: 6000 },
  bloodslinger: { dname: 'Bloodslinger', cost: 925 },
};

export function advise({ enemies, owned, clock, popShare = {} }) {
  const out = [];
  if (!enemies.length) return out;
  const tag = (r) => enemies.filter((h) => (h.roles || []).some((role) => typeof role === 'string' && role.toLowerCase() === r.toLowerCase()));
  const dis = tag('Disabler'), nuk = tag('Nuker'), car = tag('Carry');
  const esc = tag('Escape'), ini = tag('Initiator'), dur = tag('Durable');
  const mel = enemies.filter((h) => h.attack_type === 'Melee');
  const nm = (l) => l.map((h) => h.localized_name);

  const add = (key, why, how, prio, targets) => {
    if (owned.has(key) || out.some((o) => o.key === key)) return;
    const list = targets.length ? nm(targets) : nm(enemies);
    const raw = prio * 7 + Math.min(list.length, 5) * 4 + (popShare[key] || 0) * 10;
    out.push({ key, why, how, targets: list, score: Math.min(98, Math.round(raw)) });
  };

  if (dis.length >= 2) add('black_king_bar',
    `มีตัวหยุดคุณ ${dis.length} ตัว`,
    'กดก่อนเข้าปะทะ เพื่อกันสตันและเวทส่วนใหญ่',
    dis.length >= 3 ? 10 : 7, dis);
  if (dis.length >= 2) add('sphere',
    'ศัตรูมีสกิลล็อกเป้าหมายเดี่ยว',
    'บล็อกสกิลที่เล็งเป้าคุณ 1 ครั้ง',
    5, dis);
  if (nuk.length >= 3) {
    add('pipe', `ศัตรูมีสายเวทย์ ${nuk.length} ตัว`,
      'เปิดตอนทีมเริ่มสู้ ช่วยลดดาเมจเวทให้เพื่อนใกล้เคียง', 7, nuk);
    add('glimmer_cape', 'ศัตรูมีตัวทำดาเมจเวทหลายตัว',
      'ใช้ช่วยเพื่อนที่กำลังโดนโจมตี ให้ล่องหนและรับเวทเบาลงชั่วคราว', 6, nuk);
  }
  if (car.length >= 2) add('ghost', `ศัตรูมีแครี่ ${car.length} ตัว`,
    'กดเมื่อโดนตัวโจมตีกายภาพ ตัวคุณจะกันการโจมตีได้ชั่วคราว แต่รับเวทแรงขึ้น', 6, car);
  if (mel.length >= 3) add('heavens_halberd', `มีตัวประชิด ${mel.length} ตัว`,
    'ปลดอาวุธศัตรู 1 ตัว 3 วินาที ระยะร่ายสั้น', 6, mel);
  if (mel.length >= 3 || car.length >= 3) add('crimson_guard', 'ศัตรูโจมตีกายภาพแรง',
    'กดตอนเริ่มไฟต์ เพื่อลดดาเมจกายภาพและเพิ่มเกราะให้ทีม', 6, car.length >= 3 ? car : mel);
  if (esc.length >= 2) {
    add('orchid', `มีตัวหนี ${esc.length} ตัว`,
      'ใบ้ก่อนศัตรูใช้สกิลหนี', 6, esc);
    add('nullifier', 'ศัตรูใช้บัฟหรือไอเทมหนี',
      'ลบบัฟและปิดไอเทมของศัตรูชั่วคราว', 5, esc);
  }
  if (dur.length >= 2) add('spirit_vessel', `ศัตรูอึด ${dur.length} ตัว`,
    'ช่วยลดการฟื้นเลือดของศัตรูที่อึดหรือมีเลือดเยอะ', 6, dur);
  if (ini.length >= 2) add('aeon_disk', `ศัตรูมีตัวเปิดไฟต์ ${ini.length} ตัว`,
    'ช่วยกันตายเมื่อโดนโจมตีจนเลือดเหลือน้อย', 6, ini);
  if (clock > 1800 && (car.length >= 2 || mel.length >= 3)) add('skypiercer', 'ช่วงเลทเกม ศัตรูพึ่งการตีกายภาพ',
    'ปลดอาวุธศัตรู 3 วินาที เหมาะกับตัวโจมตีแรง',
    5, car.length >= 2 ? car : mel);
  if (clock > 1500 && dur.length >= 2) add('starforge', `ศัตรูอึด ${dur.length} ตัว`,
    'ทำให้ศัตรูที่โดนสกิลหยุดเคลื่อนที่ช้าลงและเสียเลือดต่อ',
    5, dur);
  if (clock < 1200 && mel.length >= 3) add('bloodslinger', `ศัตรูสายประชิด ${mel.length} ตัว`,
    'ขว้างระเบิดเพื่อสโลว์ศัตรู ใช้ช่วยเพื่อนหนีหรือเริ่มโจมตี',
    3, mel);
  if (clock > 1800) {
    add('aeon_disk', 'ช่วงเลทเกมโดนบวกตายง่าย',
      'ช่วยให้รอดจากการโดนโจมตีหนักในไฟต์', 7, ini);
    add('refresher', 'ช่วงเลทเกม',
      'รีเซ็ตคูลดาวน์ เพื่อใช้สกิลสำคัญซ้ำอีกครั้ง', 3, []);
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 6);
}

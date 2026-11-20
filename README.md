# Dota Advisor

1. คัดลอก `gamestate_integration_advisor.cfg` ไปที่
   `.../steamapps/common/dota 2 beta/game/dota/cfg/gamestate_integration/`
   (สร้างโฟลเดอร์ `gamestate_integration` ถ้ายังไม่มี)
2. Steam > Dota 2 > Properties > Launch Options ใส่ `-gamestateintegration`
3. `npm install && npm run dev` แล้วเปิด http://localhost:3000
4. เข้าเกม เลือกฮีโร่ศัตรูในหน้าเว็บ (มือถือในวงเดียวกันเปิดผ่าน IP เครื่องได้)

## คำแนะนำไอเท็ม

- กฎแก้ทางเป็น heuristic จาก role และประเภทการโจมตีของฮีโร่ศัตรู ไม่ใช่อัตราชนะหรือคำแนะนำที่รู้สถานการณ์ทุกอย่างในเกม
- รายการแนะนำจะแสดงชิ้นส่วนที่ควรซื้อถัดไปจากของใน inventory และสูตรไอเท็มที่ OpenDota ให้มา
- สูตรของ Skypiercer, Starforge และ Bloodslinger ใส่สำรองตามแพตช์ 7.42 ใน `lib/advisor.js` เพราะข้อมูลไอเท็มจาก OpenDota อาจยังไม่อัปเดต
- รายละเอียดไอเท็มอ้างอิง [โน้ตแพตช์ 7.42 ของ Valve](https://www.dota2.com/patches/7.42) ควรทบทวนกฎอีกครั้งเมื่อมีแพตช์ย่อย

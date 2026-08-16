<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="plugins/anno/assets/logo-dark.svg">
    <img src="plugins/anno/assets/logo.svg" alt="Anno" width="240">
  </picture>
</p>

<p align="center">
  <a href="README.md">English</a> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a> · <a href="README.fr.md">Français</a> · <a href="README.es.md">Español</a> · <a href="README.de.md">Deutsch</a> · <a href="README.it.md">Italiano</a> · <a href="README.pt.md">Português</a> · <strong>ไทย</strong>
</p>

# Anno

Anno คือพื้นที่ทำงานสำหรับตรวจทาน HTML แบบ local-first สำหรับเอเจนต์เขียนโค้ด AI โดยจะเปิดสำเนาแยกของไฟล์ HTML ภายในเครื่องผ่านเบราว์เซอร์ รองรับการแก้ไขข้อความและรูปแบบโดยตรง การเพิ่มความคิดเห็นให้กับองค์ประกอบ การทำคำอธิบายประกอบแบบกำหนดพื้นที่ และการตรวจทานตามสไลด์ เมื่อเสร็จสิ้น Anno จะสร้าง handoff แบบถาวรเพื่อให้เอเจนต์รับช่วงต่อและสร้างไฟล์ HTML แบบ standalone ที่ผ่านการตรวจสอบแล้ว

รีโพซิทอรีนี้ประกอบด้วยเซิร์ฟเวอร์ MCP ที่ใช้ร่วมกันและ Skill ที่ไม่ผูกกับโฮสต์, manifest ปลั๊กอินแบบเนทีฟสำหรับโฮสต์ที่รองรับ และเทมเพลต MCP ที่คัดลอกไปใช้ได้ทันทีสำหรับ Cursor, Google Antigravity, Windsurf, GitHub Copilot และ Meta Muse Code การรองรับ DeepSeek Harness และ Muse Code ยังอยู่ในขั้นทดลอง

## คุณสมบัติเด่น

- ตัวแก้ไข HTTP ภายในเครื่องที่ผูกกับ `127.0.0.1` เท่านั้น
- ไม่เขียนทับไฟล์ต้นฉบับ
- แก้ไขข้อความ รูปแบบตัวอักษร สี ตำแหน่ง บันทึกประจำหน้า และคำอธิบายประกอบขององค์ประกอบหรือพื้นที่
- handoff ของเอเจนต์ที่ถาวรและทำซ้ำได้อย่างปลอดภัย
- เข้ากันได้กับเซสชัน `needs_codex` ที่มีอยู่
- ใช้ MCP และ `SKILL.md` ชุดเดียวกันในโฮสต์ที่รองรับ
- UI ภาษาจีนตัวย่อและภาษาอังกฤษ พร้อมธีมสว่างและมืด

## ความต้องการของระบบ

- Node.js 22 ขึ้นไป
- โฮสต์ที่รองรับเซิร์ฟเวอร์ MCP แบบ stdio ภายในเครื่องและเข้าถึงไฟล์ในเครื่องได้
- เบราว์เซอร์สำหรับตัวแก้ไขการตรวจทาน

## เครื่องมือเอเจนต์ที่รองรับ

Codex, Claude Code, WorkBuddy และ CodeBuddy ใช้ manifest ปลั๊กอินที่บรรจุมาให้ ส่วน Cursor, Google Antigravity, Windsurf, GitHub Copilot CLI/Chat และ Muse Code เชื่อมต่อกับเซิร์ฟเวอร์ MCP แบบ stdio ภายในเครื่องตัวเดียวกันผ่านเทมเพลตเฉพาะโฮสต์ DeepSeek Harness ใช้บริดจ์แบบเนทีฟที่ยังอยู่ในขั้นทดลอง

ดูการตั้งค่าที่คัดลอกไปใช้ได้ทันทีและข้อจำกัดของแต่ละโฮสต์ได้ใน [คู่มือการเชื่อมต่อเครื่องมือเอเจนต์](docs/agent-tools.md)

| เครื่องมือเอเจนต์ | วิธีเชื่อมต่อ | สถานะ |
| --- | --- | --- |
| Codex | ปลั๊กอินแบบเนทีฟ + MCP | รองรับ |
| Claude Code | ปลั๊กอินแบบเนทีฟ + MCP | รองรับ |
| WorkBuddy / CodeBuddy | ปลั๊กอินแบบเนทีฟ + MCP | รองรับ |
| Cursor | MCP แบบ stdio ภายในเครื่อง | รองรับ |
| Google Antigravity | MCP แบบ stdio ภายในเครื่อง | รองรับ |
| Windsurf | MCP แบบ stdio ภายในเครื่อง | รองรับ |
| GitHub Copilot CLI / Chat | MCP แบบ stdio ภายในเครื่อง | รองรับการใช้งานภายในเครื่อง |
| DeepSeek Harness | บริดจ์ Cordis-to-MCP | ทดลอง |
| Meta Muse Code | MCP แบบ stdio ภายในเครื่อง | ทดลอง |

## ติดตั้งใน Codex

```bash
codex plugin marketplace add philmingdao/anno --ref main
codex plugin add anno@anno
```

หากต้องการการติดตั้งที่ทำซ้ำได้ ให้แทนที่ `main` ด้วยแท็กรีลีส เช่น `v0.3.1`

## ติดตั้งใน Claude Code

```text
/plugin marketplace add philmingdao/anno
/plugin install anno@anno
```

## ติดตั้งใน WorkBuddy หรือ CodeBuddy

เพิ่ม `philmingdao/anno` เป็น marketplace ของปลั๊กอิน แล้วติดตั้ง `anno` ระหว่างการพัฒนาภายในเครื่องสามารถโหลด `plugins/anno` ผ่านตัวเลือกไดเรกทอรีปลั๊กอินของโฮสต์ได้

## ติดตั้งใน Cursor, Antigravity, Windsurf, Copilot หรือ Muse Code

เครื่องมือเหล่านี้ใช้เซิร์ฟเวอร์ MCP ภายในเครื่องตัวเดียวกัน ก่อนแพ็กเกจ npm จะเผยแพร่ ให้เตรียมเซิร์ฟเวอร์เพียงครั้งเดียว:

```bash
git clone https://github.com/philmingdao/anno.git
cd anno
npm install
npm run build
```

ในเทมเพลตที่เลือก ให้แทนที่ `/absolute/path/to/anno` ด้วยพาธสัมบูรณ์ของรีโพซิทอรีที่โคลน แล้วคัดลอกหรือรวมไฟล์ไปยังตำแหน่งต่อไปนี้:

| เครื่องมือเอเจนต์ | เทมเพลต | ตำแหน่งการตั้งค่า |
| --- | --- | --- |
| Cursor | [`cursor/mcp.json`](plugins/anno/integrations/cursor/mcp.json) | `.cursor/mcp.json` ของโปรเจกต์ หรือ `~/.cursor/mcp.json` |
| Google Antigravity | [`antigravity/mcp_config.json`](plugins/anno/integrations/antigravity/mcp_config.json) | `.agents/mcp_config.json` ของโปรเจกต์ หรือ `~/.gemini/config/mcp_config.json` |
| Windsurf | [`windsurf/mcp_config.json`](plugins/anno/integrations/windsurf/mcp_config.json) | รวมเข้ากับ `~/.codeium/windsurf/mcp_config.json` |
| GitHub Copilot CLI | [`github-copilot/mcp-config.json`](plugins/anno/integrations/github-copilot/mcp-config.json) | รวมเข้ากับ `~/.copilot/mcp-config.json` |
| GitHub Copilot Chat ใน VS Code | [`github-copilot/vscode-mcp.json`](plugins/anno/integrations/github-copilot/vscode-mcp.json) | `.vscode/mcp.json` ของโปรเจกต์ |
| Meta Muse Code | [`muse-code/mcp.json`](plugins/anno/integrations/muse-code/mcp.json) | นำเข้าผ่านตัวจัดการ MCP ของรุ่นที่ติดตั้ง; ทดลอง |

Copilot CLI สามารถตั้งค่าโดยตรงได้เช่นกัน:

```bash
copilot mcp add anno --env ANNO_HOST=copilot -- node /absolute/path/to/anno/plugins/anno/dist/index.js
```

หลังบันทึก ให้เริ่มเครื่องมือใหม่หรือรีเฟรชรายการเซิร์ฟเวอร์ MCP ตัว Coding Agent บนคลาวด์ของ GitHub ไม่สามารถเปิด URL แบบ loopback ของ Anno ในเบราว์เซอร์ผู้ใช้ได้ จึงควรใช้ Copilot ภายในเครื่อง ส่วน Muse Code ยังเป็นการรองรับแบบทดลองเพราะข้อกำหนดการตั้งค่า MCP สาธารณะยังไม่เสถียร

## ใช้เซิร์ฟเวอร์ MCP โดยตรง

หลังจากเผยแพร่แพ็กเกจ npm แล้ว ไคลเอนต์ MCP แบบ stdio ใด ๆ สามารถเรียกใช้ได้ดังนี้:

```bash
npx -y @philmingdao/anno
```

ก่อนเผยแพร่ ให้โคลนรีโพซิทอรี ติดตั้ง dependencies ทำการ build และตั้งค่าไคลเอนต์ MCP ให้ชี้ไปที่ `plugins/anno/dist/index.js`

## การพัฒนา

```bash
npm install
npm test
npm run pack:check
```

แพ็กเกจที่พร้อมเผยแพร่อยู่ใน `plugins/anno` โดยจะไม่ commit dependencies ที่สร้างขึ้นและเซสชันตรวจทานภายในเครื่อง

## ข้อมูลและความเป็นส่วนตัว

Anno ประมวลผล HTML และคำอธิบายประกอบภายในเครื่อง ตัวแก้ไขจะรับฟังเฉพาะ loopback และตรวจสอบส่วนหัว Host และ Origin โฮสต์ทั่วไปเก็บเซสชันไว้ที่ `~/.anno` ส่วน Codex บน macOS ใช้เส้นทางที่เข้ากันได้คือ `~/Library/Application Support/Codex/anno` สามารถกำหนดไดเรกทอรีอื่นผ่าน `ANNO_DATA_DIR`

Anno ไม่อัปโหลดไฟล์ที่ตรวจทาน โฮสต์ของเอเจนต์ที่เชื่อมต่ออาจประมวลผลร่างและคำอธิบายประกอบตามนโยบายข้อมูลของโฮสต์นั้น

## ความเข้ากันได้

ดูพฤติกรรมและข้อจำกัดเฉพาะโฮสต์ได้ใน [เอกสารความเข้ากันได้](docs/compatibility.md)

## ใบอนุญาต

MIT ฟอนต์ WDXL Lubrifont ที่รวมมาให้ยังคงอยู่ภายใต้ SIL Open Font License แยกต่างหากใน `plugins/anno/assets/OFL-WDXL-Lubrifont.txt`

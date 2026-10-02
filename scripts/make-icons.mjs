// Vygeneruje PNG ikony (kocka s piatimi bodkami) čisto v Node, bez závislostí.
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}

function inRoundRect(x, y, x0, y0, w, h, r) {
  const cx = Math.min(Math.max(x, x0 + r), x0 + w - r)
  const cy = Math.min(Math.max(y, y0 + r), y0 + h - r)
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r
}
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t)

function render(size, rounded) {
  const SS = 4
  const px = Buffer.alloc(size * size * 4)
  const pips = [[0.3, 0.3], [0.7, 0.3], [0.5, 0.5], [0.3, 0.7], [0.7, 0.7]]
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let acc = [0, 0, 0, 0]
    for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
      const u = (x + (sx + 0.5) / SS) / size, v = (y + (sy + 0.5) / SS) / size
      let col = [0, 0, 0, 0]
      if (!rounded || inRoundRect(u, v, 0, 0, 1, 1, 0.22)) col = [...mix([58, 36, 22], [20, 12, 7], (u + v) / 2), 255]
      if (inRoundRect(u, v, 0.22, 0.22, 0.56, 0.56, 0.12)) {
        col = [...mix([255, 210, 122], [245, 158, 11], (u + v) / 2), 255]
        for (const [px_, py] of pips) {
          const p = [0.22 + px_ * 0.56, 0.22 + py * 0.56]
          if ((u - p[0]) ** 2 + (v - p[1]) ** 2 <= 0.05 ** 2) col = [42, 26, 14, 255]
        }
      }
      acc = acc.map((a, i) => a + col[i])
    }
    const o = (y * size + x) * 4
    for (let i = 0; i < 4; i++) px[o + i] = Math.round(acc[i] / (SS * SS))
  }
  const raw = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++) px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ])
}

writeFileSync('public/icon-192.png', render(192, false))
writeFileSync('public/icon-512.png', render(512, false))
writeFileSync('public/apple-touch-icon.png', render(180, false))
console.log('Ikony vygenerované')

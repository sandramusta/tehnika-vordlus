// ============================================================
// STORAGE MIGRATSIOONISKRIPT
// Kopeerib kõik failid vanast Supabase Storage'ist uude
// - equipment-brochures (brošüürid)
// - equipment-images (seadmete pildid)
//
// Käivitamine: node migrate_storage.mjs
// ============================================================

import { createClient } from '@supabase/supabase-js'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'

// --- VANA andmebaas (Lovable Cloud) ---
const OLD_URL = 'https://qfxstzlqlfbivqnvccwd.supabase.co'
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmeHN0emxxbGZiaXZxbnZjY3dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjg1NDUsImV4cCI6MjA4MzkwNDU0NX0.XMTjd2Uc57P7xL2ZrMY7kYaknZLNJyyn4oaawM0kO2s'

// --- UUS andmebaas (sinu Supabase) ---
const NEW_URL = 'https://aguzuhzijumzgmdaghms.supabase.co'
const NEW_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFndXp1aHppanVtemdtZGFnaG1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzkxMjU5OSwiZXhwIjoyMDg5NDg4NTk5fQ.Yz99sa7XODxxjDUSQmfTOlFeCZqT0y085FRIZSyPN8c'

// ============================================================

const newDb = createClient(NEW_URL, NEW_SERVICE_ROLE_KEY)

let stats = { ok: 0, skip: 0, fail: 0 }

function log(msg)  { console.log(`  ✓ ${msg}`) }
function warn(msg) { console.warn(`  ⚠ ${msg}`) }
function err(msg)  { console.error(`  ✗ ${msg}`) }

// Eraldab Storage tee URL-ist
// nt. https://xxx.supabase.co/storage/v1/object/public/equipment-brochures/foo/bar.pdf
// → { bucket: 'equipment-brochures', path: 'foo/bar.pdf' }
function parseStorageUrl(url) {
  if (!url) return null
  try {
    const match = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/)
    if (!match) return null
    return { bucket: match[1], path: match[2] }
  } catch {
    return null
  }
}

// Laeb faili URL-ist ja laadib üles uude Storage'isse
async function migrateFile(oldUrl, bucket, newDb) {
  const parsed = parseStorageUrl(oldUrl)
  if (!parsed) { warn(`Ei suuda URL-i tõlkida: ${oldUrl}`); stats.skip++; return null }

  // Kontrolli, kas fail juba eksisteerib uues Storage'is
  const { data: existing } = await newDb.storage.from(parsed.bucket).list(
    dirname(parsed.path) === '.' ? '' : dirname(parsed.path),
    { search: parsed.path.split('/').pop() }
  )
  if (existing && existing.length > 0) {
    warn(`Juba olemas, jätan vahele: ${parsed.path}`)
    stats.skip++
    // Tagasta uus URL ilma uuesti üles laadimata
    const { data: { publicUrl } } = newDb.storage.from(parsed.bucket).getPublicUrl(parsed.path)
    return publicUrl
  }

  // Lae alla vanast Storage'ist
  let fileData
  try {
    const res = await fetch(oldUrl)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    fileData = await res.arrayBuffer()
  } catch (e) {
    err(`Allalaadimine ebaõnnestus (${parsed.path}): ${e.message}`)
    stats.fail++
    return null
  }

  // Tuvasta MIME tüüp faililaiendi järgi
  const ext = parsed.path.split('.').pop().toLowerCase()
  const mimeTypes = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg', jpeg: 'image/jpeg',
    png: 'image/png', webp: 'image/webp',
    gif: 'image/gif', svg: 'image/svg+xml',
  }
  const contentType = mimeTypes[ext] || 'application/octet-stream'

  // Lae üles uude Storage'isse
  const { error } = await newDb.storage
    .from(parsed.bucket)
    .upload(parsed.path, fileData, { contentType, upsert: true })

  if (error) {
    err(`Üleslaadimine ebaõnnestus (${parsed.path}): ${error.message}`)
    stats.fail++
    return null
  }

  // Tagasta uus avalik URL
  const { data: { publicUrl } } = newDb.storage.from(parsed.bucket).getPublicUrl(parsed.path)
  stats.ok++
  return publicUrl
}

// ============================================================
// PEAMINE
// ============================================================

async function migrate() {
  console.log('\n🚀 Alustan Storage migratsiooni...\n')

  // ----------------------------------------------------------
  // 1. Brošüürid (equipment_brochures.brochure_url)
  // ----------------------------------------------------------
  console.log('📄 Migreerin brošüüre...')

  const { data: brochures, error: bErr } = await newDb
    .from('equipment_brochures')
    .select('id, brochure_url, original_filename')

  if (bErr) { err(`Ei saa lugeda brošüüre: ${bErr.message}`); }
  else {
    for (const b of brochures || []) {
      if (!b.brochure_url || !b.brochure_url.includes(OLD_URL.replace('https://', ''))) {
        warn(`Jätan vahele (ei ole vana URL): ${b.original_filename}`)
        stats.skip++
        continue
      }

      process.stdout.write(`  → ${b.original_filename} ... `)
      const newUrl = await migrateFile(b.brochure_url, 'equipment-brochures', newDb)

      if (newUrl && newUrl !== b.brochure_url) {
        await newDb.from('equipment_brochures').update({ brochure_url: newUrl }).eq('id', b.id)
        console.log('✓')
      } else if (newUrl) {
        console.log('(juba olemas)')
      } else {
        console.log('✗')
      }
    }
  }

  // ----------------------------------------------------------
  // 2. Seadmete pildid (equipment.image_url)
  // ----------------------------------------------------------
  console.log('\n🖼️  Migreerin seadmete pilte...')

  const { data: equipment, error: eErr } = await newDb
    .from('equipment')
    .select('id, model_name, image_url, threshing_system_image_url')
    .or('image_url.not.is.null,threshing_system_image_url.not.is.null')

  if (eErr) { err(`Ei saa lugeda seadmeid: ${eErr.message}`); }
  else {
    for (const eq of equipment || []) {
      // Põhipilt
      if (eq.image_url && eq.image_url.includes(OLD_URL.replace('https://', ''))) {
        process.stdout.write(`  → ${eq.model_name} (pilt) ... `)
        const newUrl = await migrateFile(eq.image_url, 'equipment-images', newDb)
        if (newUrl && newUrl !== eq.image_url) {
          await newDb.from('equipment').update({ image_url: newUrl }).eq('id', eq.id)
          console.log('✓')
        } else if (newUrl) {
          console.log('(juba olemas)')
        } else {
          console.log('✗')
        }
      }

      // Dorsiilindi pilt
      if (eq.threshing_system_image_url && eq.threshing_system_image_url.includes(OLD_URL.replace('https://', ''))) {
        process.stdout.write(`  → ${eq.model_name} (dorsiilindi pilt) ... `)
        const newUrl = await migrateFile(eq.threshing_system_image_url, 'equipment-images', newDb)
        if (newUrl && newUrl !== eq.threshing_system_image_url) {
          await newDb.from('equipment').update({ threshing_system_image_url: newUrl }).eq('id', eq.id)
          console.log('✓')
        } else if (newUrl) {
          console.log('(juba olemas)')
        } else {
          console.log('✗')
        }
      }
    }
  }

  // ----------------------------------------------------------
  // 3. Kokkuvõte
  // ----------------------------------------------------------
  console.log(`
✅ Storage migratsioon lõpetatud!

   Edukalt üle kantud : ${stats.ok}
   Juba eksisteerisid : ${stats.skip}
   Ebaõnnestusid      : ${stats.fail}
`)
}

migrate().catch(e => { console.error('\n❌ Viga:', e.message); process.exit(1) })

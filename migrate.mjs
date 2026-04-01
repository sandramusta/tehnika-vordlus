// ============================================================
// ANDMETE MIGRATSIOONISKRIPT
// Kopeerib andmed vanast Supabase'ist uude
//
// Käivitamine:
//   node migrate.mjs
// ============================================================

import { createClient } from '@supabase/supabase-js'

// --- VANA andmebaas (Lovable Cloud) ---
const OLD_URL  = 'https://qfxstzlqlfbivqnvccwd.supabase.co'
const OLD_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmeHN0emxxbGZiaXZxbnZjY3dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMjg1NDUsImV4cCI6MjA4MzkwNDU0NX0.XMTjd2Uc57P7xL2ZrMY7kYaknZLNJyyn4oaawM0kO2s'

// --- UUS andmebaas (sinu Supabase) ---
const NEW_URL  = 'https://aguzuhzijumzgmdaghms.supabase.co'
const NEW_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFndXp1aHppanVtemdtZGFnaG1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzkxMjU5OSwiZXhwIjoyMDg5NDg4NTk5fQ.Yz99sa7XODxxjDUSQmfTOlFeCZqT0y085FRIZSyPN8c'

// ============================================================

const oldDb = createClient(OLD_URL, OLD_KEY)
const newDb = createClient(NEW_URL, NEW_SERVICE_ROLE_KEY)

function log(msg)  { console.log(`  ✓ ${msg}`) }
function warn(msg) { console.warn(`  ⚠ ${msg}`) }
function err(msg)  { console.error(`  ✗ ${msg}`) }

// Loe kõik read tabelist (käib läbi kõik lehed)
async function fetchAll(db, table, select = '*') {
  const pageSize = 1000
  let rows = []
  let from = 0
  while (true) {
    const { data, error } = await db.from(table).select(select).range(from, from + pageSize - 1)
    if (error) { warn(`Ei saanud lugeda tabelit '${table}': ${error.message}`); return [] }
    rows = rows.concat(data)
    if (data.length < pageSize) break
    from += pageSize
  }
  return rows
}

// ============================================================
// PEAMINE MIGRATSIOON
// ============================================================

async function migrate() {
  console.log('\n🚀 Alustan migratsiooni...\n')

  // ----------------------------------------------------------
  // 1. Loo ID-kaardistused viitetabelitele (UUID-id muutuvad)
  // ----------------------------------------------------------
  console.log('📋 Loen viitetabeleid...')

  const [oldTypes, newTypes] = await Promise.all([
    fetchAll(oldDb, 'equipment_types'),
    fetchAll(newDb, 'equipment_types'),
  ])
  const typeIdMap = {}
  for (const ot of oldTypes) {
    const nt = newTypes.find(t => t.name === ot.name)
    if (nt) typeIdMap[ot.id] = nt.id
  }
  log(`equipment_types kaardistatud (${Object.keys(typeIdMap).length} tk)`)

  const [oldBrands, newBrands] = await Promise.all([
    fetchAll(oldDb, 'brands'),
    fetchAll(newDb, 'brands'),
  ])
  const brandIdMap = {}
  for (const ob of oldBrands) {
    const nb = newBrands.find(b => b.name === ob.name)
    if (nb) brandIdMap[ob.id] = nb.id
    else warn(`Bränd '${ob.name}' ei leitud uues andmebaasis — lisatakse`)
  }
  // Lisa puuduvad brändid
  const missingBrands = oldBrands.filter(ob => !newBrands.find(nb => nb.name === ob.name))
  if (missingBrands.length > 0) {
    const { data: inserted } = await newDb.from('brands').insert(
      missingBrands.map(b => ({ name: b.name, is_primary: b.is_primary, logo_url: b.logo_url }))
    ).select()
    if (inserted) for (const b of inserted) {
      const ob = missingBrands.find(x => x.name === b.name)
      if (ob) brandIdMap[ob.id] = b.id
    }
    log(`Lisasin ${missingBrands.length} puuduvat brändi`)
  }

  const [oldClasses, newClasses] = await Promise.all([
    fetchAll(oldDb, 'power_classes'),
    fetchAll(newDb, 'power_classes'),
  ])
  const classIdMap = {}
  for (const oc of oldClasses) {
    const nc = newClasses.find(c => c.name === oc.name)
    if (nc) classIdMap[oc.id] = nc.id
  }
  log(`power_classes kaardistatud (${Object.keys(classIdMap).length} tk)`)

  // ----------------------------------------------------------
  // 2. Migreerib equipment (seadmed)
  // ----------------------------------------------------------
  console.log('\n🚜 Migreerin seadmeid...')
  const oldEquipment = await fetchAll(oldDb, 'equipment')
  const { data: existingEquipment } = await newDb.from('equipment').select('model_name, brand_id')

  const equipmentIdMap = {}

  for (const eq of oldEquipment) {
    const newBrandId = brandIdMap[eq.brand_id]
    const newTypeId  = typeIdMap[eq.equipment_type_id]
    if (!newBrandId || !newTypeId) {
      warn(`Jätan vahele: ${eq.model_name} (puuduv bränd/tüüp kaardistus)`)
      continue
    }

    // Kontrolli, kas juba olemas
    const alreadyExists = existingEquipment?.find(
      e => e.model_name === eq.model_name && e.brand_id === newBrandId
    )
    if (alreadyExists) {
      warn(`Juba olemas, jätan vahele: ${eq.model_name}`)
      continue
    }

    const { id: _oldId, created_at, updated_at, equipment_type_id, brand_id, power_class_id, ...rest } = eq
    const newRow = {
      ...rest,
      equipment_type_id: newTypeId,
      brand_id: newBrandId,
      power_class_id: power_class_id ? (classIdMap[power_class_id] ?? null) : null,
    }

    const { data: inserted, error } = await newDb.from('equipment').insert(newRow).select('id, model_name').single()
    if (error) { err(`${eq.model_name}: ${error.message}`); continue }
    equipmentIdMap[eq.id] = inserted.id
    log(`${eq.model_name}`)
  }

  // ----------------------------------------------------------
  // 3. competitive_arguments
  // ----------------------------------------------------------
  console.log('\n💬 Migreerin competitive_arguments...')
  const oldArgs = await fetchAll(oldDb, 'competitive_arguments')
  let argsOk = 0
  for (const a of oldArgs) {
    const { id: _id, created_at, competitor_brand_id, equipment_type_id, ...rest } = a
    const newBrandId = brandIdMap[competitor_brand_id]
    const newTypeId  = typeIdMap[equipment_type_id]
    if (!newBrandId || !newTypeId) { warn(`Jätan vahele argumendi (puuduv kaardistus)`); continue }
    const { error } = await newDb.from('competitive_arguments').insert({ ...rest, competitor_brand_id: newBrandId, equipment_type_id: newTypeId })
    if (error) err(`competitive_argument: ${error.message}`)
    else argsOk++
  }
  log(`${argsOk} argumenti migreeritud`)

  // ----------------------------------------------------------
  // 4. myths (kontrolli duplikaate nime järgi)
  // ----------------------------------------------------------
  console.log('\n📖 Migreerin müüte...')
  const [oldMyths, newMyths] = await Promise.all([
    fetchAll(oldDb, 'myths'),
    fetchAll(newDb, 'myths'),
  ])
  let mythsOk = 0
  for (const m of oldMyths) {
    if (newMyths.find(nm => nm.myth === m.myth)) { warn(`Müüt juba olemas, jätan vahele`); continue }
    const { id: _id, created_at, updated_at, ...rest } = m
    const { error } = await newDb.from('myths').insert(rest)
    if (error) err(`myth: ${error.message}`)
    else mythsOk++
  }
  log(`${mythsOk} müüti migreeritud`)

  // ----------------------------------------------------------
  // 5. spec_labels
  // ----------------------------------------------------------
  console.log('\n🏷️  Migreerin spec_labels...')
  const oldLabels = await fetchAll(oldDb, 'spec_labels')
  let labelsOk = 0
  const { data: existingLabels } = await newDb.from('spec_labels').select('spec_key')
  const existingKeys = new Set((existingLabels || []).map(l => l.spec_key))
  for (const l of oldLabels) {
    if (existingKeys.has(l.spec_key)) { warn(`spec_label '${l.spec_key}' juba olemas, jätan vahele`); continue }
    const { id: _id, created_at, updated_at, ...rest } = l
    const { error } = await newDb.from('spec_labels').insert(rest)
    if (error) err(`spec_label: ${error.message}`)
    else labelsOk++
  }
  log(`${labelsOk} silti migreeritud`)

  // ----------------------------------------------------------
  // 6. staff_users
  // ----------------------------------------------------------
  console.log('\n👥 Migreerin staff_users...')
  const oldStaff = await fetchAll(oldDb, 'staff_users')
  let staffOk = 0
  for (const s of oldStaff) {
    const { id: _id, created_at, ...rest } = s
    const { error } = await newDb.from('staff_users').upsert(rest, { onConflict: 'email' })
    if (error) err(`staff_user ${s.email}: ${error.message}`)
    else staffOk++
  }
  log(`${staffOk} töötajat migreeritud`)

  // ----------------------------------------------------------
  // 7. equipment_brochures (ainult kui equipment on migreeritud)
  // ----------------------------------------------------------
  console.log('\n📄 Migreerin brošüüre...')
  const oldBrochures = await fetchAll(oldDb, 'equipment_brochures')
  let brochuresOk = 0
  for (const b of oldBrochures) {
    const newEqId = equipmentIdMap[b.equipment_id]
    if (!newEqId) { warn(`Brošüüri seade pole migreeritud, jätan vahele`); continue }
    const { id: _id, created_at, updated_at, equipment_id, ...rest } = b
    const { error } = await newDb.from('equipment_brochures').insert({ ...rest, equipment_id: newEqId })
    if (error) err(`brochure: ${error.message}`)
    else brochuresOk++
  }
  log(`${brochuresOk} brošüüri migreeritud`)

  // ----------------------------------------------------------
  // 8. work_documentation
  // ----------------------------------------------------------
  console.log('\n📝 Migreerin töödokumentatsiooni...')
  const oldWork = await fetchAll(oldDb, 'work_documentation')
  let workOk = 0
  for (const w of oldWork) {
    const newEqId = equipmentIdMap[w.equipment_id]
    if (!newEqId) { warn(`Töödokumendi seade pole migreeritud, jätan vahele`); continue }
    const { id: _id, created_at, equipment_id, ...rest } = w
    const { error } = await newDb.from('work_documentation').insert({ ...rest, equipment_id: newEqId })
    if (error) err(`work_doc: ${error.message}`)
    else workOk++
  }
  log(`${workOk} töödokumenti migreeritud`)

  // ----------------------------------------------------------
  console.log('\n✅ Migratsioon lõpetatud!\n')
}

migrate().catch(e => { console.error('\n❌ Viga:', e.message); process.exit(1) })

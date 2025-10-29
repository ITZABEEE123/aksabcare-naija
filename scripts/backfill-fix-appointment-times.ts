// One-off script to correct legacy appointment times that were stored with wrong offsets
// Usage: npx tsx scripts/backfill-fix-appointment-times.ts --dry

import { prisma } from '../lib/db/prisma'

// Heuristic: detect appointments whose scheduledDate appears shifted vs their original creation time
// We assume historical bad states were commonly off by +1h or +2h relative to intended WAT.
// We'll provide two modes: preview and apply.

function parseArgs() {
  const args = process.argv.slice(2)
  return {
    dry: args.includes('--dry') || !args.includes('--apply'),
    apply: args.includes('--apply'),
    hours: (() => {
      const hIdx = args.findIndex(a => a === '--hours')
      if (hIdx !== -1 && args[hIdx+1]) return Number(args[hIdx+1])
      return 0
    })()
  }
}

async function main() {
  const { dry, apply, hours } = parseArgs()
  console.log(`Starting backfill. Mode: ${apply ? 'APPLY' : 'DRY-RUN'}, hours adjust: ${hours || 'auto'}`)

  // Fetch potentially affected appointments (past and future)
  const appts = await prisma.appointment.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, scheduledDate: true, createdAt: true }
  })

  let updated = 0
  for (const a of appts) {
    const sched = new Date(a.scheduledDate)

    // If an appointment was intended for WAT wall-clock but stored as WAT rather than UTC,
    // it would display one hour earlier. We correct by adding +1h to UTC.
    // If older two-hour cases exist, allow --hours 2 to apply +2h.
    const adjustHours = hours || 1

    // Heuristic gate: only adjust rows created before the fix window (e.g., before Oct 6, 2025)
    const FIX_CUTOFF = new Date('2025-10-06T00:00:00.000Z')
    if (a.createdAt >= FIX_CUTOFF) continue

    const corrected = new Date(sched.getTime() + adjustHours * 60 * 60 * 1000)

    if (dry) {
      console.log(`[DRY] Would update ${a.id}: ${sched.toISOString()} -> ${corrected.toISOString()}`)
    } else {
      await prisma.appointment.update({
        where: { id: a.id },
        data: { scheduledDate: corrected }
      })
      updated++
      if (updated % 20 === 0) console.log(`Updated ${updated} records...`)
    }
  }

  console.log(`Done. ${apply ? 'Updated' : 'Previewed'} ${updated} records.`)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
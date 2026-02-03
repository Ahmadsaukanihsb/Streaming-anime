/* eslint-disable no-console */
const mongoose = require('mongoose');
const path = require('path');

// Load env from server/.env if present
try {
  // eslint-disable-next-line global-require
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch {
  // ignore
}

const AnimeInteraction = require('../models/AnimeInteraction');
const Notification = require('../models/Notification');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/animestream';

const DRY_RUN = process.argv.includes('--dry-run');
const CLEAR_AFTER = process.argv.includes('--clear');
const LIMIT = parseInt(process.env.MIGRATE_LIMIT || '0', 10); // 0 = no limit

const allowedTypes = new Set([
  'like_discussion',
  'like_reply',
  'reply',
  'mention',
  'new_episode',
  'system',
  'anime',
  'episode'
]);

function normalizeType(type) {
  return allowedTypes.has(type) ? type : 'system';
}

function makeKey(n) {
  const created = n.createdAt ? new Date(n.createdAt).toISOString() : '';
  return [
    n.type || '',
    n.message || '',
    n.animeId || '',
    created
  ].join('||');
}

async function migrate() {
  console.log('[Migrate] Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('[Migrate] Connected.');

  let processed = 0;
  let insertedTotal = 0;
  let clearedTotal = 0;

  const cursor = AnimeInteraction.collection.find({
    notifications: { $exists: true, $ne: [] }
  });

  for await (const interaction of cursor) {
    if (LIMIT > 0 && processed >= LIMIT) {
      break;
    }

    const userId = interaction.userId;
    const legacy = interaction.notifications || [];
    if (legacy.length === 0) {
      continue;
    }

    processed += 1;

    const existing = await Notification.find({ userId })
      .select('type message animeId createdAt')
      .lean();
    const existingKeys = new Set(existing.map(makeKey));

    const toInsert = [];
    for (const n of legacy) {
      const doc = {
        userId,
        type: normalizeType(n.type),
        message: n.message || n.title || 'Notifikasi',
        animeId: n.animeId || undefined,
        isRead: !!n.read,
        createdAt: n.createdAt || new Date()
      };

      const key = makeKey(doc);
      if (!existingKeys.has(key)) {
        existingKeys.add(key);
        toInsert.push(doc);
      }
    }

    if (toInsert.length > 0) {
      if (DRY_RUN) {
        console.log(`[Migrate] User ${userId}: would insert ${toInsert.length}`);
      } else {
        await Notification.insertMany(toInsert, { ordered: false });
        insertedTotal += toInsert.length;
        console.log(`[Migrate] User ${userId}: inserted ${toInsert.length}`);
      }
    }

    if (CLEAR_AFTER && !DRY_RUN) {
      await AnimeInteraction.collection.updateOne(
        { _id: interaction._id },
        { $set: { notifications: [] } }
      );
      clearedTotal += 1;
      console.log(`[Migrate] User ${userId}: cleared legacy notifications`);
    }
  }

  console.log('[Migrate] Done.');
  console.log(`[Migrate] Users processed: ${processed}`);
  console.log(`[Migrate] Notifications inserted: ${insertedTotal}`);
  if (CLEAR_AFTER && !DRY_RUN) {
    console.log(`[Migrate] Interactions cleared: ${clearedTotal}`);
  }

  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('[Migrate] Failed:', err);
  process.exitCode = 1;
});

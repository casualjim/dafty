import { randomUUIDv7 } from "bun";
import { Database } from "bun:sqlite";

// Initialize SQLite database
const db = new Database("slipstream.db", { create: true });

// Create layout_state table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS layout_state (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'default',
    context_key TEXT NOT NULL,
    settings TEXT NOT NULL DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create unique index on user_id + context_key combination
db.run(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_user_context ON layout_state(user_id, context_key)
`);

// Helper function to hash URL paths for context keys
export const hashPath = (path: string): string => {
  const hash = new Bun.CryptoHasher("sha256").update(path).digest("hex");
  return hash.substring(0, 16); // Use first 16 chars for readability
};

// Insert default state for root path if no records exist
const count = db.query("SELECT COUNT(*) as count FROM layout_state").get() as { count: number };
if (count.count === 0) {
  const rootKey = hashPath('/');
  const defaultSettings = {
    left_sidebar_open: true,
    right_sidebar_open: true,
    left_width: 320,
    right_width: 320,
    theme: 'system'
  };
  db.run(`
    INSERT INTO layout_state (id, user_id, context_key, settings)
    VALUES (?, 'default', ?, ?)
  `, [randomUUIDv7(), rootKey, JSON.stringify(defaultSettings)]);
}

export interface LayoutSettings {
  left_sidebar_open?: boolean;
  right_sidebar_open?: boolean;
  left_width?: number;
  right_width?: number;
  theme?: string;
  [key: string]: any; // Allow arbitrary settings without migration
}

export interface LayoutState {
  id: string;
  user_id: string;
  context_key: string;
  settings: LayoutSettings;
  created_at: string;
  updated_at: string;
}

interface LayoutStateRow {
  id: string;
  user_id: string;
  context_key: string;
  settings: string;
  created_at: string;
  updated_at: string;
}

const parseLayoutState = (row: LayoutStateRow): LayoutState => ({
  ...row,
  settings: JSON.parse(row.settings)
});

export const getLayoutState = (
  contextKey: string,
  userId: string = 'default'
): LayoutState | null => {
  const query = db.query("SELECT * FROM layout_state WHERE user_id = ? AND context_key = ?");
  const row = query.get(userId, contextKey) as LayoutStateRow | null;
  return row ? parseLayoutState(row) : null;
};

export const updateLayoutState = (
  contextKey: string,
  updates: LayoutSettings,
  userId: string = 'default'
): LayoutState | null => {
  const currentState = getLayoutState(contextKey, userId);
  
  if (!currentState) {
    // Insert new state
    const defaultSettings: LayoutSettings = {
      left_sidebar_open: true,
      right_sidebar_open: true,
      left_width: 320,
      right_width: 320,
      theme: 'system',
      ...updates
    };
    
    const stmt = db.prepare(`
      INSERT INTO layout_state (id, user_id, context_key, settings)
      VALUES (?, ?, ?, ?)
    `);
    
    stmt.run(
      randomUUIDv7(),
      userId,
      contextKey,
      JSON.stringify(defaultSettings)
    );
    
    return getLayoutState(contextKey, userId);
  }
  
  // Merge updates with existing settings
  const mergedSettings = {
    ...currentState.settings,
    ...updates
  };
  
  const stmt = db.prepare(`
    UPDATE layout_state 
    SET settings = ?, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ? AND context_key = ?
  `);
  
  stmt.run(JSON.stringify(mergedSettings), userId, contextKey);
  
  return getLayoutState(contextKey, userId);
};

export default db;

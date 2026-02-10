type UserRecord = {
  phone: string;
  username: string;
  email?: string;
};

const storeKey = "__nearbite_user_store__";

function getStore(): Map<string, UserRecord> {
  const globalState = globalThis as typeof globalThis & {
    [storeKey]?: Map<string, UserRecord>;
  };

  if (!globalState[storeKey]) {
    globalState[storeKey] = new Map<string, UserRecord>();
  }

  return globalState[storeKey] as Map<string, UserRecord>;
}

export function userExists(phone: string): boolean {
  return getStore().has(phone);
}

export function createUser(record: UserRecord): void {
  getStore().set(record.phone, record);
}

import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';

/** Runs `query` every time the screen gains focus. Pass a memoized (useCallback) query. */
export function useDbQuery<T>(query: (db: SQLiteDatabase) => Promise<T>) {
  const db = useSQLiteContext();
  const [data, setData] = useState<T | undefined>(undefined);

  const reload = useCallback(async () => {
    setData(await query(db));
  }, [db, query]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  return { data, reload };
}

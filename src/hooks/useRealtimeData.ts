import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export function useRealtimeData<T extends { id: string }>(tableName: string, filter: { column: string; value: string } | null = null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dataRef = useRef<T[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let query = supabase.from(tableName).select('*');
        if (filter && filter.value) {
          query = query.ilike(filter.column, `%${filter.value}%`);
        }
        const { data: initialData, error: initialError } = await query;

        if (initialError) {
          throw initialError;
        }

        const initialDataArray = initialData || [];
        setData(initialDataArray);
        dataRef.current = initialDataArray;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const channel = supabase.channel(`public:${tableName}`);

    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tableName },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newData = [...dataRef.current, payload.new as T];
            dataRef.current = newData;
            setData(newData);
          } else if (payload.eventType === 'UPDATE') {
            const updatedData = dataRef.current.map((item) =>
              item.id === payload.new.id ? (payload.new as T) : item
            );
            dataRef.current = updatedData;
            setData(updatedData);
          } else if (payload.eventType === 'DELETE') {
            const filteredData = dataRef.current.filter(
              (item) => item.id !== payload.old.id
            );
            dataRef.current = filteredData;
            setData(filteredData);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableName, filter]);

  return { data, loading, error };
}

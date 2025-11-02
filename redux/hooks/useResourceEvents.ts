import { nanoid } from '@reduxjs/toolkit';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { ResourceEvent } from '../slices/resourceEventsSlice';
import { addEvent, bulkAddEvents } from '../slices/resourceEventsSlice';
import type { RootState } from '../store';

export function useResourceEvents() {
  const dispatch = useDispatch();
  const events = useSelector((s: RootState) => s.resourceEvents.events);

  // createEvent expects an object matching ResourceEvent without 'id'
  const createEvent = useCallback((p: Omit<ResourceEvent, 'id'>) => {
    const e: ResourceEvent = { id: nanoid(), ...p };
    dispatch(addEvent(e));
    return e;
  }, [dispatch]);

  // addEventsBulk expects an array of ResourceEvent-like objects without 'id'
  const addEventsBulk = useCallback((list: Omit<ResourceEvent, 'id'>[]) => {
    const mapped: ResourceEvent[] = list.map(l => ({ id: nanoid(), ...l }));
    dispatch(bulkAddEvents(mapped));
    return mapped;
  }, [dispatch]);

  const getEventsBetween = useCallback((resource: string, fromIso: string, toIso: string): ResourceEvent[] => {
    const from = new Date(fromIso);
    const to = new Date(toIso);
    return events.filter(e => e.resource === resource && new Date(e.date) >= from && new Date(e.date) <= to);
  }, [events]);

  return { events, createEvent, addEventsBulk, getEventsBetween };
}
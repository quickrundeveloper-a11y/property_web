import { v4 as uuidv4 } from 'uuid';

export const getGuestId = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  let id = localStorage.getItem('guest_view_id');
  if (!id) {
    id = `guest_${Date.now()}_${uuidv4()}`;
    localStorage.setItem('guest_view_id', id);
  }
  return id;
};

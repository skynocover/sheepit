import { createRoute } from 'honox/factory';
import { generateId } from '../../../lib/id';

export const POST = createRoute(async (c) => {
  c.set('session', { id: generateId() });
  return c.redirect('/');
});

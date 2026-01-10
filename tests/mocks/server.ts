import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
// Vitest/Vite supports JSON imports via resolveJsonModule
import rule34Posts from '../fixtures/rule34-posts.json';

// Define handlers
export const handlers = [
  // Intercept GET requests to Rule34 API
  http.get('https://api.rule34.xxx/index.php', () => {
    // Always return the fixture data
    // Future: Add pagination logic here if needed (check request.url for query params)
    return HttpResponse.json(rule34Posts);
  }),
];

// Setup server
export const server = setupServer(...handlers);

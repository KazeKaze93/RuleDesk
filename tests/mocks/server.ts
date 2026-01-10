import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
// Vitest/Vite supports JSON imports via resolveJsonModule
import rule34Posts from '../fixtures/rule34-posts.json';

// Define handlers
export const handlers = [
  // Intercept GET requests to Rule34 API
  http.get('https://api.rule34.xxx/index.php', ({ request }) => {
    const url = new URL(request.url);
    // Check if json param exists (for potential future pagination logic)
    url.searchParams.get('json');
    
    // You can add logic here to return empty arrays for pagination end, etc.
    // For now, always return the fixture
    return HttpResponse.json(rule34Posts);
  }),
];

// Setup server
export const server = setupServer(...handlers);

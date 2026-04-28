export const parseCredentialsFromText = (
  text: string
): { userId?: string; apiKey?: string } => {
  const result: { userId?: string; apiKey?: string } = {};

  const userIdMatch = text.match(/[?&]user_id=([^&\s]+)/i);
  if (userIdMatch) {
    result.userId = decodeURIComponent(userIdMatch[1]);
  }

  const apiKeyMatch = text.match(/[?&]api_key=([^&\s]+)/i);
  if (apiKeyMatch) {
    result.apiKey = decodeURIComponent(apiKeyMatch[1]);
  }

  return result;
};

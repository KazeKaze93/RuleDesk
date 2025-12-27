# Rule34.xxx API Reference

## 📑 Table of Contents

- [API Keys](#api-keys)
- [API Terms of Service](#api-terms-of-service)
- [Endpoints](#endpoints)
  - [Posts](#posts)
  - [Deleted Images](#deleted-images)
  - [Comments](#comments)
  - [Tags](#tags)
  - [Autocomplete](#autocomplete)
- [Best Practices and Cautions](#best-practices-and-cautions)

---

This document provides an unofficial technical overview of the public Rule34.xxx API for developers integrating the API into desktop clients or applications.

**📖 Related Documentation:**
- [API Documentation](./api.md) - RuleDesk IPC API reference
- [Architecture Documentation](./architecture.md) - External API integration
- [Glossary](./glossary.md) - Key terms (API Key, Rate Limiting, etc.)

## API Keys

### Requesting an API Key

**URL:** https://rule34.xxx/index.php?page=account&s=options

Navigate to the account options page to request an API key. You will receive:

- `user_id`: Your user ID
- `api_key`: Your API key for authentication

### API Limits

API limits may be changed at any time without notice. If your application requires higher limits, you can request an unlimited key. This is only applicable for large public projects.

**Requesting Higher Limits:**

- For urgent requests from large sites/apps: Create a ticket on Discord or send a site mail to staff
- Staff contact forum: https://rule34.xxx/index.php?page=forum&s=view&id=4240

**Important:** Rule34.xxx reserves the right to disable or deny any API key at their discretion.

## API Terms of Service

When using the Rule34.xxx API or serving content from their CDN, you must comply with the following terms:

1. **No Advertisements or Paywalls:** You must not display any advertisements or run paywalls. This applies to all bots, apps, and websites using the API or CDN content.

2. **Single API Key Rule:** Do not use or request more than one API key. Using multiple keys will result in suspension of your key or account.

3. **Key Suspension:** Violation of these terms may result in immediate suspension of your API key or account.

## Endpoints

### Posts

#### List Posts

**URL:** `https://api.rule34.xxx/index.php?page=dapi&s=post&q=index`

**Method:** GET

**Parameters:**

| Parameter | Type    | Description                   | Constraints                                                        |
| --------- | ------- | ----------------------------- | ------------------------------------------------------------------ |
| `limit`   | integer | Number of posts to retrieve   | Hard limit: 1000 posts per request                                 |
| `pid`     | integer | Page number                   | -                                                                  |
| `tags`    | string  | Tag combination to search for | Any tag combination that works on the website, including meta-tags |
| `cid`     | integer | Change ID of the post         | Unix timestamp (may have duplicates if updated simultaneously)     |
| `id`      | integer | Post ID                       | -                                                                  |
| `json`    | integer | Response format               | Set to `1` for JSON, omit for XML                                  |

**Notes:**

- Default response format is XML unless `json=1` is specified
- Tag combinations follow the same rules as the website search
- See the cheatsheet for information on meta-tags

**Example:**

```
https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&tags=tag1+tag2&limit=100&json=1
```

### Deleted Images

#### List Deleted Images

**URL:** `https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&deleted=show`

**Method:** GET

**Parameters:**

| Parameter | Type    | Description     | Constraints                          |
| --------- | ------- | --------------- | ------------------------------------ |
| `last_id` | integer | Numerical value | Returns everything above this number |

**Notes:**

- This endpoint requires the `deleted=show` parameter in the URL
- Use `last_id` to paginate through deleted images

**Example:**

```
https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&deleted=show&last_id=12345
```

### Comments

#### List Comments

**URL:** `https://api.rule34.xxx/index.php?page=dapi&s=comment&q=index`

**Method:** GET

**Parameters:**

| Parameter | Type    | Description    | Constraints                                 |
| --------- | ------- | -------------- | ------------------------------------------- |
| `post_id` | integer | Post ID number | The ID of the post to retrieve comments for |

**Example:**

```
https://api.rule34.xxx/index.php?page=dapi&s=comment&q=index&post_id=123456
```

### Tags

#### List Tags

**URL:** `https://api.rule34.xxx/index.php?page=dapi&s=tag&q=index`

**Method:** GET

**Parameters:**

| Parameter | Type    | Description                | Constraints                                                  |
| --------- | ------- | -------------------------- | ------------------------------------------------------------ |
| `id`      | integer | Tag ID in the database     | Useful to retrieve a specific tag if you already know the ID |
| `limit`   | integer | Number of tags to retrieve | Default limit: 100 tags per request                          |

**Example:**

```
https://api.rule34.xxx/index.php?page=dapi&s=tag&q=index&limit=500
```

### Autocomplete

#### Tag Autocomplete

**URL:** `https://api.rule34.xxx/autocomplete.php?q=`

**Method:** GET

**Parameters:**

| Parameter | Type   | Description  | Constraints                        |
| --------- | ------ | ------------ | ---------------------------------- |
| `q`       | string | Search query | Enter any letter or incomplete tag |

**Notes:**

- This is not an official endpoint, but it is available for use
- Some implementations may use the autocomplete from the main site; use this endpoint instead
- Returns suggestions based on partial tag input

**Example:**

```
https://api.rule34.xxx/autocomplete.php?q=char
```

## Best Practices and Cautions

### Rate Limiting

- Implement exponential backoff for rate limit errors
- Respect API limits and avoid aggressive polling
- Monitor your request frequency to prevent IP or key bans
- Consider caching responses to reduce API calls

### Caching

- Cache tag lists and autocomplete results (they change infrequently)
- Cache post metadata to reduce redundant requests
- Implement appropriate cache invalidation strategies
- Be mindful of cache size and memory usage

### Terms of Service Compliance

- **Never display advertisements** when using the API or serving CDN content
- **Never implement paywalls** for content accessed via the API
- **Use only one API key** per application or project
- Review and comply with all ToS requirements before deployment

### Key Management

- Store API keys securely (use Electron secure storage or similar)
- Never commit API keys to version control
- Monitor for key suspension notifications
- Have a plan for handling key revocation

### Error Handling

- Implement proper error handling for network failures
- Handle rate limit responses gracefully
- Log errors for debugging without exposing sensitive information
- Provide user-friendly error messages

### Performance Considerations

- Use pagination (`pid` parameter) for large result sets
- Respect the 1000 post limit per request
- Consider parallel requests for independent data (with rate limiting)
- Optimize tag queries to reduce response size

### Security

- Validate all user input before constructing API requests
- Sanitize tag strings to prevent injection attacks
- Use HTTPS for all API requests
- Implement request timeout handling

### Development Recommendations

- Test with small limits first before scaling up
- Monitor API response times and adjust polling intervals accordingly
- Implement retry logic with exponential backoff
- Use JSON format (`json=1`) for easier parsing in modern applications
- Document your API usage patterns for troubleshooting



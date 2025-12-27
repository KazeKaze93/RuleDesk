# Documentation Index

Welcome to the RuleDesk documentation. This index provides a structured navigation guide to all documentation resources.

## 📚 Documentation Structure

### Getting Started

**Start here if you're new to RuleDesk:**

1. **[README.md](../README.md)** - Main entry point with overview, features, and quick start guide
2. **[Glossary](./glossary.md)** - Key terms and concepts used throughout the documentation

### User Guides

**For end users:**

- **[User Guide](./user-guide.md)** - Complete guide for end users (start here!)
  - [Installation](./user-guide.md#installation) - How to install RuleDesk
  - [First Launch](./user-guide.md#first-launch) - Getting started
  - [Basic Usage](./user-guide.md#basic-usage) - Adding artists, syncing, viewing posts
  - [Features](./user-guide.md#features) - Search, favorites, downloads, filters
  - [Troubleshooting](./user-guide.md#troubleshooting) - Common problems and solutions
- **[README.md - Quick Start](../README.md#-quick-start)** - Quick reference for developers
- **[README.md - Features](../README.md#-features)** - Complete feature list

### Developer Documentation

**For contributors and developers:**

#### Architecture & Design

- **[Architecture Documentation](./architecture.md)** - System architecture, design patterns, and component structure
  - [Process Separation](./architecture.md#process-separation) - Main vs Renderer process
  - [Security Architecture](./architecture.md#security-architecture) - Security layers and context isolation
  - [Data Flow](./architecture.md#data-flow) - Reading, writing, and synchronization flows
  - [Component Architecture](./architecture.md#component-architecture) - React component hierarchy

#### API Reference

- **[API Documentation](./api.md)** - Complete IPC API reference
  - [IPC Bridge Interface](./api.md#ipc-bridge-interface) - Type definitions
  - [API Methods](./api.md#api-methods) - All available IPC methods
  - [Event Listeners](./api.md#event-listeners) - Real-time event subscriptions
  - [Error Handling](./api.md#error-handling) - Error handling patterns

#### Database

- **[Database Documentation](./database.md)** - Database schema, operations, and best practices
  - [Schema](./database.md#schema) - Table definitions and relationships
  - [Database Architecture](./database.md#database-architecture) - Client architecture and initialization
  - [Migrations](./database.md#migrations) - Migration generation and execution
  - [Backup and Recovery](./database.md#backup-and-recovery) - Backup/restore procedures

#### Development

- **[Development Guide](./development.md)** - Development setup, build process, and workflows
  - [Initial Setup](./development.md#initial-setup) - Prerequisites and installation
  - [Development Scripts](./development.md#development-scripts) - Available npm scripts
  - [Development Workflow](./development.md#development-workflow) - Making changes and adding features
  - [Debugging](./development.md#debugging) - Debugging techniques

#### Contributing

- **[Contributing Guide](./contributing.md)** - Guidelines for contributors
  - [Development Principles](./contributing.md#development-principles) - KISS, YAGNI, SOLID, DRY
  - [Code Standards](./contributing.md#code-standards) - TypeScript, React, error handling
  - [Pull Request Process](./contributing.md#pull-request-process) - PR guidelines

### External API Reference

- **[Rule34 API Reference](./rule34-api-reference.md)** - Unofficial Rule34.xxx API documentation
  - [API Keys](./rule34-api-reference.md#api-keys) - Requesting and managing API keys
  - [Endpoints](./rule34-api-reference.md#endpoints) - Available API endpoints
  - [Best Practices](./rule34-api-reference.md#best-practices-and-cautions) - Rate limiting, caching, security

### Planning & Roadmap

- **[Roadmap](./roadmap.md)** - Development roadmap and planned features
  - [Active Roadmap](./roadmap.md#-active-roadmap-priority-tasks) - Current priority tasks
  - [Milestones](./roadmap.md#-milestones) - MVP and future phases
  - [Technical Improvements](./roadmap.md#-technical-improvements-from-audit) - Planned technical enhancements

---

## 🗺️ Navigation Guide

### By Role

#### I'm a User
1. Start with [README.md](../README.md) for overview and quick start
2. Check [Glossary](./glossary.md) for unfamiliar terms
3. Read [README.md - Settings](../README.md#-settings) for configuration
4. See [README.md - Sync & Background](../README.md#-sync--background) for synchronization

#### I'm a Developer
1. Read [Development Guide](./development.md) for setup
2. Study [Architecture Documentation](./architecture.md) for system design
3. Reference [API Documentation](./api.md) for IPC methods
4. Review [Database Documentation](./database.md) for schema and operations
5. Follow [Contributing Guide](./contributing.md) for code standards

#### I'm Contributing
1. Read [Contributing Guide](./contributing.md) for guidelines
2. Review [Development Guide](./development.md) for workflows
3. Check [Roadmap](./roadmap.md) for planned features
4. Study [Architecture Documentation](./architecture.md) for design patterns

### By Topic

#### Understanding the System
- [Architecture Overview](./architecture.md#overview) - High-level system design
- [Process Separation](./architecture.md#process-separation) - Main vs Renderer
- [Security Architecture](./architecture.md#security-architecture) - Security layers
- [Database Architecture](./database.md#database-architecture) - Database design

#### Working with the Code
- [Development Setup](./development.md#initial-setup) - Getting started
- [Project Structure](./development.md#project-structure) - Code organization
- [Adding Features](./development.md#2-adding-new-features) - Feature development
- [Code Standards](./contributing.md#code-standards) - Coding guidelines

#### Using the API
- [IPC Bridge Interface](./api.md#ipc-bridge-interface) - Type definitions
- [API Methods](./api.md#api-methods) - Available methods
- [Event Listeners](./api.md#event-listeners) - Real-time events
- [Error Handling](./api.md#error-handling) - Error patterns

#### Database Operations
- [Schema](./database.md#schema) - Table definitions
- [Available Methods](./database.md#available-methods-via-drizzle-orm) - Query examples
- [Migrations](./database.md#migrations) - Schema changes
- [Backup and Recovery](./database.md#backup-and-recovery) - Data protection

---

## 🔗 Quick Links

### Essential Reading
- [Quick Start Guide](../README.md#-quick-start) - Get started in 5 minutes
- [Architecture Overview](./architecture.md#overview) - Understand the system
- [API Reference](./api.md) - Complete IPC API documentation
- [Glossary](./glossary.md) - Key terms and concepts

### Common Tasks
- [Adding an IPC Method](./contributing.md#adding-a-new-ipc-method) - Extend IPC API
- [Adding a Database Table](./contributing.md#adding-a-new-database-table) - Schema changes
- [Creating Migrations](./development.md#database-scripts) - Database migrations
- [Debugging](./development.md#debugging) - Debugging techniques

### Reference
- [Type Definitions](./api.md#type-definitions) - TypeScript interfaces
- [Database Schema](./database.md#schema) - Table structures
- [IPC Channels](./api.md#implementation-details) - Channel constants
- [External API](./rule34-api-reference.md) - Rule34.xxx API reference

---

## 📖 Document Relationships

```
README.md (Entry Point)
├── Quick Start → Development Guide
├── Features → Glossary
├── Architecture → Architecture Documentation
└── Documentation → This Index

Architecture Documentation
├── Security → Contributing Guide (Security section)
├── Database → Database Documentation
└── IPC → API Documentation

API Documentation
├── Implementation → Architecture Documentation
└── External API → Rule34 API Reference

Database Documentation
├── Schema → Architecture Documentation
└── Migrations → Development Guide

Development Guide
├── Setup → Contributing Guide
└── Workflow → Architecture Documentation

Contributing Guide
└── Standards → Development Guide

Roadmap
└── All documents (references features and improvements)
```

---

## 🆘 Need Help?

1. **Check the Glossary** - [Glossary](./glossary.md) defines all key terms
2. **Search Documentation** - Use your editor's search to find specific topics
3. **Review Examples** - Each document includes code examples
4. **Check Roadmap** - [Roadmap](./roadmap.md) shows planned features and improvements

---

## 📝 Documentation Maintenance

This documentation is maintained alongside the codebase. When making changes:

1. **Update relevant docs** - Keep documentation in sync with code changes
2. **Add cross-references** - Link related sections using markdown links
3. **Update glossary** - Add new terms to [Glossary](./glossary.md)
4. **Check links** - Verify all internal links work correctly

---

**Last Updated:** See git history for latest changes.


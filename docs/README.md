# GitHub Copilot Enterprise Dashboard - Documentation

Welcome to the comprehensive documentation for the GitHub Copilot Enterprise Dashboard.

## 📚 Documentation Index

### Getting Started
- **[Getting Started Guide](./getting-started.md)** - Quick start, installation, and first-time setup
- **[Deployment Guide](./deployment.md)** - How to deploy and host the dashboard

### Core Documentation
- **[Architecture](./architecture.md)** - System architecture, data flow, and design patterns (with Mermaid diagrams)
- **[Data Schema](./data-schema.md)** - NDJSON schema reference and data structure
- **[Configuration](./configuration.md)** - Customization options and CONFIG object reference

### Development
- **[Development Guide](./development.md)** - Development workflow, adding features, and best practices
- **[API Reference](./api-reference.md)** - Internal functions, utilities, and component reference
- **[Troubleshooting](./troubleshooting.md)** - Common issues, performance tips, and solutions

## 🚀 Quick Links

- **Repository:** [github.com/kinncj/GitHub-Copilot-Enterprise-Dashboard](https://github.com/kinncj/GitHub-Copilot-Enterprise-Dashboard)
- **Issues:** [GitHub Issues](https://github.com/kinncj/GitHub-Copilot-Enterprise-Dashboard/issues)
- **License:** See repository LICENSE file

## 📖 About This Documentation

This documentation covers:
- Architecture and design decisions
- Data processing pipeline
- Chart implementations
- Performance optimization strategies
- Extension and customization guides
- Complete API reference

All diagrams are created using [Mermaid](https://mermaid.js.org/) for version control friendliness and easy maintenance.

## 🎯 Project Overview

The GitHub Copilot Enterprise Dashboard is a production-ready, zero-dependency analytics tool for visualizing GitHub Copilot usage data. Key features:

- **Zero Dependencies** - Single HTML file, no build process required
- **Client-Side Only** - 100% browser-based processing, no backend needed
- **Enterprise Ready** - Handles large datasets (100MB+) with chunked parsing
- **Rich Visualizations** - 9 interactive charts powered by Chart.js
- **Smart Insights** - Automated detection of power users, efficiency metrics, and anomalies
- **Privacy First** - All data processing happens in the browser

## 🔧 Tech Stack

- **HTML5** - Semantic structure
- **Tailwind CSS** - Utility-first styling (via CDN)
- **Chart.js v4** - Interactive visualizations (via CDN)
- **Lucide Icons** - Icon library (via CDN)
- **Vanilla JavaScript (ES6+)** - No frameworks, just modern JS

## 📋 Documentation Conventions

Throughout this documentation:
- `Code blocks` represent code, functions, or configuration values
- **Bold text** highlights important concepts
- *Italic text* indicates file paths or UI elements
- Line numbers reference the main `index.html` file
- Mermaid diagrams illustrate architecture and flows

## 🤝 Contributing

See the main repository for contribution guidelines. When updating documentation:
1. Keep diagrams in Mermaid format
2. Update relevant sections when code changes
3. Test code examples before committing
4. Follow the existing documentation structure

## 📝 License

See the repository's LICENSE file for licensing information.

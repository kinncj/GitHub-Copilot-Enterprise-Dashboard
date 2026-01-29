# GitHub Copilot Enterprise Dashboard

## Deployment

This project is deployed via **GitHub Pages**. To deploy, push changes to the `main` branch and ensure your repository is configured for GitHub Pages in the repository settings.

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPLv3)**.

Copyright © 2026 Kinn Coelho Juliao <kinncj@protonmail.com>

A production-ready, zero-dependency analytics dashboard for visualizing GitHub Copilot Enterprise usage data.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)
[![Browser Support](https://img.shields.io/badge/browsers-Chrome%20%7C%20Firefox%20%7C%20Safari%20%7C%20Edge-brightgreen.svg)](docs/getting-started.md#browser-requirements)
[![No Dependencies](https://img.shields.io/badge/dependencies-zero-success.svg)](docs/architecture.md)
[![GitHub Pages](https://img.shields.io/badge/demo-live-success.svg)](https://kinncj.github.io/GitHub-Copilot-Enterprise-Dashboard/)

![Dashboard Preview](https://via.placeholder.com/1200x600/0f172a/6366f1?text=Dashboard+Preview)

## 🌐 Live Demo

**Try it now:** [https://kinncj.github.io/GitHub-Copilot-Enterprise-Dashboard/](https://kinncj.github.io/GitHub-Copilot-Enterprise-Dashboard/)

**Documentation:** [https://kinncj.github.io/GitHub-Copilot-Enterprise-Dashboard/docs/](https://kinncj.github.io/GitHub-Copilot-Enterprise-Dashboard/docs/)

## ✨ Features

- **Zero Dependencies** - Single HTML file, no build process required
- **100% Client-Side** - All data processing happens in your browser
- **Privacy First** - No data leaves your machine
- **Rich Visualizations** - 9 interactive charts powered by Chart.js
- **Smart Insights** - Automated detection of power users and efficiency metrics
- **Enterprise Ready** - Handles large datasets (100MB+) with chunked parsing
- **Responsive Design** - Works on desktop, tablet, and mobile

## 🚀 Quick Start

1. **Download the dashboard:**
   ```bash
   git clone https://github.com/kinncj/GitHub-Copilot-Enterprise-Dashboard.git
   cd GitHub-Copilot-Enterprise-Dashboard
   ```

2. **Open in browser:**
   ```bash
   open index.html
   # or double-click index.html
   ```

3. **Upload your data:**
   - Export NDJSON data from GitHub Enterprise Copilot Analytics
   - Drag and drop the file onto the dashboard upload zone
   - Explore your analytics!

See [Getting Started Guide](docs/getting-started.md) for detailed instructions.

## 📊 What You Can Analyze

### Key Metrics
- Total code generations and acceptance rates
- Active users and coding time
- Lines of code added, deleted, and net changes
- Chat activity and feature usage

### Visualizations
- **Activity Timeline** - Daily trends of generations, acceptances, and chat
- **Acceptance Rate Trends** - Track code quality over time
- **Top Users** - Identify power users and high-efficiency developers
- **IDE Distribution** - See which IDEs your team prefers
- **Language Breakdown** - Understand your tech stack usage
- **Feature Usage** - Monitor which Copilot features are most popular
- **Efficiency Matrix** - Scatter plot of volume vs. quality
- **Model Distribution** - Track AI model usage

### Automated Insights
- ⭐ Power Users (top 10% by activity)
- ✅ High Efficiency Users (>70% acceptance rate)
- ⚠️ Low Acceptance Alerts (<20% acceptance rate)
- 🚨 Quota Exceeded Days (unusual activity spikes)
- 📈 Week-over-Week Trends
- ❌ Zero Acceptance Days (potential issues)

## 🎯 Use Cases

- **Engineering Managers** - Track team adoption and productivity
- **Developer Experience Teams** - Optimize Copilot effectiveness
- **Security Teams** - Monitor usage patterns and compliance
- **Finance Teams** - Justify Copilot investment with data
- **Individual Contributors** - Personal productivity insights

## 📚 Documentation

- **[Getting Started](docs/getting-started.md)** - Installation and first-time setup
- **[Architecture](docs/architecture.md)** - System design with Mermaid diagrams
- **[Data Schema](docs/data-schema.md)** - NDJSON format reference
- **[Configuration](docs/configuration.md)** - Customization options
- **[Development Guide](docs/development.md)** - Extend and customize
- **[API Reference](docs/api-reference.md)** - Function documentation
- **[Deployment Guide](docs/deployment.md)** - Host on various platforms
- **[Troubleshooting](docs/troubleshooting.md)** - Common issues and solutions

## 🛠️ Tech Stack

- **HTML5** - Semantic structure
- **Tailwind CSS** - Utility-first styling (via CDN)
- **Chart.js v4** - Interactive visualizations (via CDN)
- **Lucide Icons** - Beautiful icons (via CDN)
- **Vanilla JavaScript (ES6+)** - No frameworks needed

## 🔒 Security & Privacy

**All data processing is client-side:**
- ✅ No backend servers
- ✅ No data transmission
- ✅ No external API calls (except CDN for libraries)
- ✅ No analytics tracking
- ✅ Safe for sensitive enterprise data

**Perfect for air-gapped environments:**
- Can be run completely offline after initial CDN dependency load
- Self-host dependencies for full offline capability

## 📦 Deployment Options

Deploy anywhere static files are served:

- **Cloud Platforms:** AWS S3, Azure Blob Storage, Google Cloud Storage
- **CDN:** Netlify, Vercel, Cloudflare Pages
- **Web Servers:** Apache, Nginx, IIS
- **Enterprise:** SharePoint, Confluence, internal web servers
- **Containers:** Docker, Kubernetes

See [Deployment Guide](docs/deployment.md) for detailed instructions.

## 🎨 Customization

Everything is configurable via the `CONFIG` object:

```javascript
const CONFIG = {
    DAILY_GENERATION_QUOTA: 500,        // Alert threshold
    LOW_ACCEPTANCE_THRESHOLD: 0.20,     // 20% warning
    HIGH_ACCEPTANCE_THRESHOLD: 0.70,    // 70% excellence
    POWER_USER_PERCENTILE: 0.90,        // Top 10%
    CHART_ANIMATION_DURATION: 750,      // Animation speed
    MAX_TOP_USERS_SHOWN: 15,            // Chart limits
    // ... and more
};
```

See [Configuration Guide](docs/configuration.md) for all options.

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Before contributing:**
- Read the [Development Guide](docs/development.md)
- Check existing issues and PRs
- Follow the existing code style
- Update documentation as needed

## 🐛 Issues & Support

- **Bug Reports:** [GitHub Issues](https://github.com/kinncj/GitHub-Copilot-Enterprise-Dashboard/issues)
- **Feature Requests:** [GitHub Discussions](https://github.com/kinncj/GitHub-Copilot-Enterprise-Dashboard/discussions)
- **Documentation:** [docs/](docs/)

## 📝 License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0) - see the [LICENSE](LICENSE) file for details.

**Copyright © 2024 Kinn Coelho Juliao**

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

If you modify this software and make it available over a network, you must make the source code available under the same license.

## 🙏 Acknowledgments

- **Chart.js** - Beautiful charts
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide** - Icon library
- **GitHub** - For GitHub Copilot Enterprise

## 📈 Project Stats

- **Single File:** ~3,000 lines of code
- **Zero Build Tools:** No npm, webpack, or bundlers needed
- **9 Charts:** Comprehensive analytics
- **100% Browser-Based:** Privacy-first architecture

## 🗺️ Roadmap

Future enhancements:

- [ ] Dark/Light theme toggle
- [ ] Comparison mode (compare two time periods)
- [ ] Data persistence (localStorage)
- [ ] PDF report export
- [ ] Team vs. individual comparisons
- [ ] Custom dashboard layouts
- [ ] Advanced filtering options
- [ ] API endpoint integration (optional)

## 📧 Contact

**Repository:** [github.com/kinncj/GitHub-Copilot-Enterprise-Dashboard](https://github.com/kinncj/GitHub-Copilot-Enterprise-Dashboard)

**Issues:** [GitHub Issues](https://github.com/kinncj/GitHub-Copilot-Enterprise-Dashboard/issues)

---

**Made with ❤️ for the developer community**

*Visualize your Copilot usage. Optimize your productivity.*

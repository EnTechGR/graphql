# GraphQL Profile Dashboard

A modern, interactive profile dashboard that visualizes student progress and achievements using GraphQL, SVG charts, and the Zone01 platform API.

## 🎯 Project Overview

This project is a personal profile page that fetches and displays user data from the Zone01 GraphQL API. It features:
- Secure JWT-based authentication
- Real-time data visualization with custom SVG charts
- Interactive statistics and progress tracking
- Responsive design with modern UI/UX

## ✨ Features

### Authentication
- ✅ Login with username/email and password
- ✅ JWT token management
- ✅ Secure session handling
- ✅ Logout functionality

### Profile Information
- 👤 User identification (login, ID, campus)
- 📊 Total XP earned
- 🎯 Audit ratio (up/down audits)
- 📈 Projects completed count

### Data Visualization (SVG Charts)
1. **Project XP Bar Chart** - Top 10 projects by XP earned
2. **Audit Ratio Donut Chart** - Visual representation of audit ratio
3. **Pass/Fail Ratio Donut Chart** - Success rate visualization
4. **Skills Radar Chart** - Technical skills distribution
5. **Progress Trend Chart** - Grade progression over time (amCharts)
6. **Cumulative XP Chart** - XP accumulation over time (Zino style)

### Additional Features
- 🏆 Top 10 skills display with progress bars
- 📋 Recent progress table
- 🎨 Modern, responsive UI design
- 🔄 Real-time data fetching

## 📁 Project Structure

```
graphql-profile-project/
├── docs/
│   ├── index.html              # Login page
│   ├── profile.html            # Main profile dashboard
│   ├── css/
│   │   ├── login.css          # Login page styles
│   │   └── styles.css         # Profile page styles
│   └── js/
│       ├── auth.js            # Authentication logic
│       ├── graphql.js         # GraphQL queries and API calls
│       ├── config.js          # Configuration constants
│       ├── graphUtils.js      # SVG utility functions
│       ├── main.js            # Main application entry point
│       ├── statsRendering.js  # Statistics rendering functions
│       ├── charting.js        # Main charting module (re-exports)
│       ├── charting-project-xp.js    # Project XP bar chart
│       ├── charting-ratios.js        # Donut charts (audit & pass/fail)
│       ├── charting-progress.js      # Progress trend chart
│       ├── charting-skills.js        # Skills radar chart
│       └── charting-xp-zino.js       # Cumulative XP over time chart
├── server.go                   # Go proxy server
├── go.mod                      # Go module file
└── README.md                   # This file
```

## 🚀 Setup Instructions

### Prerequisites
- Go 1.25.0 or higher
- Modern web browser
- Access to Zone01 platform credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd graphql-profile-project
   ```

2. **Configure the domain**
   
   Update the `TARGET_DOMAIN` in `server.go` to match your school domain:
   ```go
   const TARGET_DOMAIN = "platform.zone01.gr"  // Change to your domain
   ```

3. **Start the Go proxy server**
   ```bash
   go run server.go
   ```

4. **Access the application**
   
   Open your browser and navigate to:
   ```
   http://localhost:8080
   ```

## 💻 Usage

### Logging In
1. Navigate to `http://localhost:8080`
2. Enter your Zone01 credentials:
   - Username or Email
   - Password
3. Click "Sign In"

### Viewing Your Profile
After successful login, you'll be redirected to your profile dashboard where you can:
- View your key statistics
- Explore interactive charts
- Check your top skills
- Review recent progress

### Logging Out
Click the "Logout" button in the top-right corner to end your session.

## 🔧 Technical Details

### Architecture

#### Frontend
- **Vanilla JavaScript** with ES6 modules
- **SVG** for custom chart rendering
- **amCharts 5** for advanced progress visualization
- **No framework dependencies** for core functionality

#### Backend
- **Go proxy server** to handle CORS and API requests
- Forwards requests to Zone01 GraphQL API
- Serves static files

### GraphQL Queries

The application uses the following GraphQL queries:

#### 1. User Information
```graphql
query {
  user {
    id
    login
    campus
    createdAt
    attrs
  }
}
```

#### 2. XP Transactions
```graphql
query {
  transaction(
    where: {
      type: { _eq: "xp" }
      _or: [
        { object: { type: { _eq: "project" } } }
        { object: { type: { _eq: "module" } } }
        { object: { type: { _eq: "piscine" } } }
      ]
    }
    order_by: { createdAt: desc }
  ) {
    id
    amount
    createdAt
    object {
      name
      type
    }
  }
}
```

#### 3. Audit Ratio
```graphql
query {
  user {
    id
    login
    auditRatio
    totalUp
    totalDown
  }
}
```

#### 4. Results (Pass/Fail)
```graphql
query {
  result(order_by: { createdAt: desc }) {
    id
    grade
    type
    path
    createdAt
    object {
      name
      type
    }
  }
}
```

#### 5. Progress by User ID
```graphql
query ($userId: Int!) {
  progress(
    where: { userId: { _eq: $userId } }
    order_by: { createdAt: desc }
  ) {
    id
    grade
    createdAt
    path
    object {
      name
      type
    }
  }
}
```

#### 6. Skills Radar
```graphql
query ($userId: Int!) {
  user: user_by_pk(id: $userId) {
    id
    login
    transactions(
      order_by: [{ type: asc }]
      where: {
        userId: { _eq: $userId }
        type: { _like: "skill_%" }
      }
    ) {
      type
      amount
    }
  }
}
```

### Authentication Flow

1. User submits credentials via the login form
2. Credentials are Base64-encoded and sent to the signin endpoint
3. Server returns a JWT token
4. Token is stored in localStorage
5. All subsequent GraphQL requests include the JWT in the Authorization header
6. Token is validated on each request

### Chart Modules

The charting functionality is organized into specialized modules:

- **charting-project-xp.js**: Bar chart for project XP visualization
- **charting-ratios.js**: Donut charts for audit and pass/fail ratios
- **charting-progress.js**: amCharts-based progress trend visualization
- **charting-skills.js**: Radar chart for skills distribution
- **charting-xp-zino.js**: Cumulative XP over time chart

Each module is self-contained and can be used independently.

## 🌐 Hosting

The application can be hosted on various platforms:

### Recommended Hosting Platforms
- **GitHub Pages** - Free static hosting
- **Netlify** - Automatic deployments from Git
- **Vercel** - Optimized for modern web apps
- **Render** - Full-stack hosting with backend support

### Deployment Steps (GitHub Pages Example)

1. Push your code to GitHub
2. Go to repository Settings → Pages
3. Select branch and folder (usually `main` and `/docs`)
4. Save and wait for deployment

**Note**: When hosting, ensure the Go server is deployed separately or configure your hosting to proxy API requests.

## 🔐 Security Considerations

- JWT tokens are stored in localStorage (consider more secure alternatives for production)
- Proxy server handles CORS to prevent direct API exposure
- All API requests require valid authentication
- No sensitive credentials are stored in code

## 🎨 UI/UX Features

- **Responsive Design**: Works on desktop and mobile devices
- **Animated Background**: Gradient animation on login page
- **Interactive Charts**: Hover effects and tooltips
- **Modern Card Layout**: Clean, organized information display
- **Color-Coded Data**: Visual indicators for success/failure
- **Smooth Transitions**: Polished user experience

## 📊 Data Visualization Details

### SVG Charts
All charts except the progress trend are built with pure SVG:
- **Scalable**: Vector graphics scale without quality loss
- **Customizable**: Full control over styling and animations
- **Performant**: Lightweight and fast rendering
- **Interactive**: Built-in support for hover and click events

### amCharts Integration
The progress trend chart uses amCharts 5 for:
- Advanced date axis handling
- Smooth animations
- Pan and zoom functionality
- Professional tooltips

## 🐛 Troubleshooting

### Common Issues

**Issue**: "No JWT found, redirecting to login"
- **Solution**: Ensure you're logged in. Check if JWT exists in localStorage.

**Issue**: "Authentication failed (401)"
- **Solution**: Your session has expired. Log in again.

**Issue**: "GraphQL errors"
- **Solution**: Check your internet connection and verify the GraphQL endpoint is accessible.

**Issue**: Charts not displaying
- **Solution**: Ensure amCharts scripts are loaded. Check browser console for errors.

**Issue**: CORS errors
- **Solution**: Use the Go proxy server instead of direct API access.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is part of the Zone01 curriculum and follows the school's guidelines.

## 👥 Credits

- **GraphQL API**: Zone01 Platform
- **Chart Library**: amCharts 5
- **Icons & Emojis**: Native Unicode
- **Design Inspiration**: Modern dashboard UIs

## 🔗 Resources

- [GraphQL Documentation](https://graphql.org/learn/)
- [SVG Tutorial](https://developer.mozilla.org/en-US/docs/Web/SVG)
- [JWT Introduction](https://jwt.io/introduction)
- [amCharts 5 Documentation](https://www.amcharts.com/docs/v5/)
- [Zone01 Platform](https://zone01.gr)

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the Zone01 documentation
3. Contact your campus administrators

---

**Made with ❤️ for Zone01 Students**
# Contributing to CHLEAR CRM

Thank you for your interest in contributing to CHLEAR CRM! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- Git
- npm or yarn

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/chlearCRM.git
   cd chlearCRM
   ```

2. **Install Dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Backend environment
   cp backend/.env.example backend/.env
   # Edit backend/.env with your database credentials
   ```

4. **Database Setup**
   ```bash
   cd backend
   npm run migrate
   npm run seed
   ```

5. **Start Development Servers**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

## 📋 Development Guidelines

### Code Style

#### Backend (Node.js/Express)
- Use ES6+ features
- Follow RESTful API conventions
- Use async/await instead of callbacks
- Implement proper error handling
- Add JSDoc comments for functions
- Use meaningful variable and function names

#### Frontend (React)
- Use functional components with hooks
- Follow React best practices
- Use TypeScript for type safety (when applicable)
- Implement proper error boundaries
- Use semantic HTML
- Follow accessibility guidelines

### Git Workflow

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Write clean, readable code
   - Add tests for new functionality
   - Update documentation if needed

3. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add user authentication system"
   ```

4. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add user profile management
fix: resolve login validation issue
docs: update API documentation
refactor: improve database query performance
```

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
```

### Frontend Testing
```bash
cd frontend
npm run lint          # Run ESLint
npm run build         # Test build process
```

### Test Coverage
- Aim for at least 80% test coverage
- Write unit tests for business logic
- Write integration tests for API endpoints
- Test error scenarios and edge cases

## 📝 Documentation

### API Documentation
- Update API documentation for new endpoints
- Include request/response examples
- Document error codes and messages

### Code Documentation
- Add JSDoc comments for functions
- Include inline comments for complex logic
- Update README.md for new features

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Environment Information**
   - OS and version
   - Node.js version
   - Database version
   - Browser (for frontend issues)

2. **Steps to Reproduce**
   - Clear, numbered steps
   - Expected vs actual behavior
   - Screenshots if applicable

3. **Error Information**
   - Console logs
   - Stack traces
   - Network requests (if applicable)

## ✨ Feature Requests

When requesting features, please include:

1. **Problem Description**
   - What problem does this solve?
   - Who would benefit from this feature?

2. **Proposed Solution**
   - How should this feature work?
   - Any design considerations?

3. **Implementation Notes**
   - Backend changes needed
   - Frontend changes needed
   - Database changes required

## 🔍 Code Review Process

### For Contributors
1. Ensure your code follows the style guidelines
2. Add tests for new functionality
3. Update documentation
4. Request review from maintainers

### For Reviewers
1. Check code quality and style
2. Verify tests are adequate
3. Test the functionality manually
4. Provide constructive feedback

## 📦 Release Process

1. **Version Bumping**
   - Update version in package.json files
   - Update CHANGELOG.md
   - Create release notes

2. **Testing**
   - Run full test suite
   - Test in staging environment
   - Verify all features work correctly

3. **Deployment**
   - Tag the release
   - Deploy to production
   - Monitor for issues

## 🆘 Getting Help

- **Documentation**: Check the README.md and inline documentation
- **Issues**: Search existing issues or create a new one
- **Discussions**: Use GitHub Discussions for questions
- **Code Review**: Ask questions in pull request comments

## 📄 License

By contributing to CHLEAR CRM, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project documentation

Thank you for contributing to CHLEAR CRM! 🚀

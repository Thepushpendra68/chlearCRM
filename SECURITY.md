# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security bugs seriously. We appreciate your efforts to responsibly disclose your findings, and will make every effort to acknowledge your contributions.

### How to Report a Security Vulnerability

Please do **NOT** report security vulnerabilities through public GitHub issues.

Instead, please report them via email to: [security@chlearcrm.com](mailto:security@chlearcrm.com)

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

Please include the following information in your report:

- Type of issue (e.g. buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### What to Expect

After you submit a report, we will:

1. Confirm receipt of your vulnerability report within 48 hours
2. Provide regular updates on our progress
3. Credit you in our security advisory (unless you prefer to remain anonymous)

## Security Best Practices

### For Users

- Always use the latest version of CHLEAR CRM
- Keep your database credentials secure
- Use strong passwords and enable two-factor authentication where possible
- Regularly backup your data
- Monitor access logs for suspicious activity

### For Developers

- Follow secure coding practices
- Validate all user inputs
- Use parameterized queries to prevent SQL injection
- Implement proper authentication and authorization
- Keep dependencies updated
- Use HTTPS in production
- Implement rate limiting
- Log security-relevant events

## Security Features

CHLEAR CRM includes the following security features:

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs with 12 salt rounds
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Server-side validation with express-validator
- **CORS Protection**: Configured for specific origins
- **Security Headers**: Helmet.js for security headers
- **SQL Injection Prevention**: Parameterized queries with Knex.js
- **XSS Protection**: Input sanitization and output encoding

## Security Updates

Security updates will be released as soon as possible after a vulnerability is discovered and patched. We will:

- Release security patches for the current stable version
- Provide detailed information about the vulnerability and fix
- Credit security researchers who responsibly disclose vulnerabilities

## Contact

For security-related questions or concerns, please contact us at [security@chlearcrm.com](mailto:security@chlearcrm.com).

## Acknowledgments

We would like to thank the following security researchers who have helped improve CHLEAR CRM's security:

- [Your name here] - For responsibly disclosing security vulnerabilities

Thank you for helping keep CHLEAR CRM and its users safe!

# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of TribalMingle seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Where to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to:
- **Security Team**: security@tribalmingle.com
- **Emergency Contact**: emergency@tribalmingle.com

### What to Include

Please include the following information in your report:
- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### Response Timeline

- **Initial Response**: Within 24 hours
- **Status Update**: Every 3 business days
- **Resolution Target**: Critical issues within 7 days, High within 14 days, Medium within 30 days

### Disclosure Policy

- We ask that you give us reasonable time to investigate and fix the issue before public disclosure
- We will coordinate with you on the disclosure timeline
- We will credit you in the security advisory (if desired)

## Security Update Process

1. **Vulnerability Identified**: Through responsible disclosure or internal detection
2. **Assessment**: Security team assesses severity and impact
3. **Patch Development**: Engineering team develops and tests fix
4. **Notification**: Notify affected users (if applicable)
5. **Release**: Deploy patch to production within SLA
6. **Advisory**: Publish security advisory with CVE (if applicable)

## Security Measures

### Application Security
- **Authentication**: Multi-factor authentication for sensitive operations
- **Authorization**: Role-based access control (RBAC) with attribute-based policies
- **Encryption**: TLS 1.3 for data in transit, AES-256 for data at rest
- **Session Management**: Secure session tokens with httpOnly and secure flags
- **Input Validation**: Comprehensive validation and sanitization
- **Output Encoding**: Context-aware output encoding to prevent XSS
- **CSRF Protection**: Token-based CSRF protection on all state-changing operations

### Infrastructure Security
- **Network Security**: Firewall rules, DDoS protection via Cloudflare
- **Access Control**: Principle of least privilege for all systems
- **Monitoring**: 24/7 security monitoring and alerting
- **Logging**: Comprehensive audit logging of all sensitive operations
- **Backups**: Encrypted daily backups with 30-day retention
- **Patch Management**: Regular security updates within 24 hours for critical vulnerabilities

### Data Protection
- **Privacy**: GDPR and CCPA compliant data handling
- **Encryption**: End-to-end encryption for sensitive data
- **Data Minimization**: Collect only necessary data
- **Access Logging**: All data access logged and auditable
- **Data Retention**: Automated retention policies and secure deletion

## Security Best Practices for Contributors

### Code Review
- All code must be reviewed by at least one other developer
- Security-sensitive changes require security team review
- Automated security scanning in CI/CD pipeline

### Dependencies
- Keep dependencies up to date
- Review security advisories before updating
- Use `npm audit` before every commit
- No dependencies with known high-severity vulnerabilities

### Secrets Management
- Never commit secrets to source control
- Use environment variables for configuration
- Rotate secrets every 90 days
- Use secret management service (e.g., AWS Secrets Manager)

### Secure Coding
- Follow OWASP Top 10 guidelines
- Use parameterized queries (no SQL injection)
- Validate and sanitize all inputs
- Encode all outputs
- Use secure random number generation
- Implement proper error handling (no information disclosure)

## Compliance

TribalMingle is compliant with:
- **GDPR**: General Data Protection Regulation
- **CCPA**: California Consumer Privacy Act
- **PCI DSS**: Payment Card Industry Data Security Standard (Level 2)
- **SOC 2 Type II**: In progress

## Contact

For security questions or concerns:
- **Email**: security@tribalmingle.com
- **PGP Key**: Available at https://tribalmingle.com/security/pgp-key.txt

## Hall of Fame

We recognize and thank the following security researchers for responsible disclosure:

(List will be updated as vulnerabilities are reported and fixed)

---

Last Updated: November 24, 2025

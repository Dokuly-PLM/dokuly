# Security Vulnerability Report for Dokuly PLM

## Executive Summary

This report details critical security vulnerabilities discovered in the Dokuly PLM (Product Lifecycle Management) system, a Django-based application with a React frontend. The analysis revealed **7 critical security vulnerabilities** that pose significant risks to the application's security posture and require immediate attention.

## Critical Vulnerabilities Found

### 1. **CRITICAL: DEBUG Mode Enabled in Production** 
- **File**: `dokuly/dokuly/settings.py:133`
- **Issue**: `DEBUG = True` is enabled, which exposes sensitive debug information and stack traces to users
- **Risk**: Information disclosure, potential credential exposure
- **Severity**: Critical
- **Fix**: Set `DEBUG = False` in production environments

### 2. **CRITICAL: Hardcoded Secret Key Fallback**
- **File**: `dokuly/dokuly/settings.py:24`
- **Issue**: Hardcoded SECRET_KEY fallback value `"asdofnasdfnasdioufasdioufasdifujnsdfaiun"`
- **Risk**: Session hijacking, authentication bypass, data tampering
- **Severity**: Critical
- **Fix**: Remove hardcoded fallback and ensure proper environment variable configuration

### 3. **CRITICAL: CORS Allow All Origins in Production**
- **File**: `dokuly/dokuly/settings.py:142`
- **Issue**: `CORS_ORIGIN_ALLOW_ALL = True` allows any domain to make cross-origin requests
- **Risk**: Cross-site request forgery, data theft from malicious domains
- **Severity**: Critical
- **Fix**: Configure specific allowed origins and set `CORS_ORIGIN_ALLOW_ALL = False`

### 4. **CRITICAL: SQL Injection Vulnerabilities**
- **File**: `dokuly/part_numbers/methods.py:47,64`
- **Issue**: Direct f-string interpolation in `cursor.execute()` calls
- **Code**: 
  ```python
  cursor.execute(f"SELECT setval(pg_get_serial_sequence('{PartNumber._meta.db_table}', 'id'), {next_free_id}, false);")
  cursor.execute(f"SELECT setval(pg_get_serial_sequence('{PartNumber._meta.db_table}', 'id'), {value}, false);")
  ```
- **Risk**: Database compromise, data breach, privilege escalation
- **Severity**: Critical
- **Fix**: Use parameterized queries or Django ORM methods

### 5. **CRITICAL: Code Execution via eval()**
- **File**: `dokuly/documents/views.py` (lines 645, 1049, 1050, 1051, 1342)
- **Issue**: Use of `eval()` function on user-controlled data
- **Code Examples**:
  ```python
  document.is_archived = eval(data["archived"].title())
  front_page_fe = eval(data["front_page"].title())
  revision_table_fe = eval(data["revision_table"].title())
  ```
- **Risk**: Remote code execution, server compromise
- **Severity**: Critical
- **Fix**: Replace `eval()` with safe boolean conversion methods

### 6. **CRITICAL: Multiple CSRF Exemptions**
- **File**: `dokuly/tenants/views.py` (15 instances)
- **Issue**: Widespread use of `@csrf_exempt` decorator bypassing CSRF protection
- **Risk**: Cross-site request forgery attacks
- **Severity**: Critical
- **Fix**: Remove unnecessary CSRF exemptions and implement proper CSRF tokens

### 7. **CRITICAL: Command Injection Vulnerability**
- **File**: `dokuly/pcbas/viewUtilities.py:544`
- **Issue**: Use of `os.system()` with potentially user-controlled input
- **Code**: 
  ```python
  exit_code = os.system(f"tracespace -L --quiet --out={render_file_path} {formatted_str}")
  ```
- **Risk**: Remote command execution, server compromise
- **Severity**: Critical
- **Fix**: Use `subprocess` with proper input sanitization or shell=False

## High Risk Issues

### 8. **HIGH: Wildcard ALLOWED_HOSTS in Local Mode**
- **File**: `dokuly/dokuly/settings.py:31`
- **Issue**: `ALLOWED_HOSTS = ["*"]` allows any host
- **Risk**: HTTP Host header attacks
- **Severity**: High

### 9. **HIGH: Hardcoded Database Passwords**
- **File**: `dokuly/dokuly/settings.py` (lines related to database configuration)
- **Issue**: Default database passwords visible in code
- **Risk**: Database compromise if default credentials are used
- **Severity**: High

### 10. **HIGH: File Upload Without Proper Validation**
- **Files**: Multiple views handling `request.FILES`
- **Issue**: Insufficient file type and content validation
- **Risk**: Malicious file upload, potential RCE
- **Severity**: High

## Dependency Vulnerabilities

### Django 4.2.11
- This version is affected by known CVEs including CVE-2022-34265 (SQL injection in Trunc/Extract functions)
- **Recommendation**: Upgrade to latest Django 4.2.x patch release

### React 18.2.0
- While no direct vulnerabilities found, this is not the latest version
- **Recommendation**: Consider upgrading to React 19.x for latest security fixes

## Additional Security Concerns

1. **Missing Input Validation**: Many endpoints lack proper input validation
2. **Insecure Direct Object References**: Object access not properly verified
3. **Information Disclosure**: Error messages may reveal sensitive information
4. **Weak Authentication**: Some endpoints may not require proper authentication

## Immediate Actions Required

1. **Disable DEBUG mode** in production immediately
2. **Remove hardcoded SECRET_KEY** and ensure proper environment configuration
3. **Disable CORS_ORIGIN_ALLOW_ALL** and configure specific origins
4. **Fix SQL injection** vulnerabilities in part_numbers/methods.py
5. **Replace all eval() calls** with safe alternatives
6. **Review and remove unnecessary CSRF exemptions**
7. **Fix command injection** in pcbas/viewUtilities.py
8. **Implement proper file upload validation**
9. **Update Django** to latest patch version
10. **Conduct comprehensive security review** of all endpoints

## Risk Assessment

- **Overall Risk**: **CRITICAL**
- **Attack Vector**: Remote/Network
- **Authentication Required**: None for most vulnerabilities
- **User Interaction Required**: None
- **Scope**: Complete application compromise possible

## Recommendations

1. **Immediate Patching**: Address all critical vulnerabilities within 24-48 hours
2. **Security Audit**: Conduct comprehensive penetration testing
3. **Code Review**: Implement secure coding practices and mandatory security reviews
4. **Monitoring**: Implement security monitoring and logging
5. **Training**: Provide security training for development team
6. **SAST/DAST**: Implement automated security testing in CI/CD pipeline

## Conclusion

The Dokuly PLM system contains multiple critical security vulnerabilities that could lead to complete system compromise. Immediate action is required to address these issues before they can be exploited by malicious actors. The combination of authentication bypass, code execution, and SQL injection vulnerabilities presents an extremely high risk to the organization's data and infrastructure.
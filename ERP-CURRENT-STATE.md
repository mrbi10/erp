\# ERP System – Current State Documentation



\## Overview

This document describes the \*\*current behavior\*\* of a solo-built college ERP system.  

The system covers authentication, role-based access, attendance, exams, placement training, mess management, announcements, and supporting infrastructure.



All information below reflects \*\*existing behavior only\*\*.  

No future features or assumptions are included.



\---



\## Authentication \& Login



\### Current Behavior

\- Users can log in using:

&#x20; - Register number

&#x20; - Register number with domain

&#x20; - Role-based username

\- Valid credentials result in successful login.

\- Incorrect password shows an error message.

\- Empty username or password triggers validation errors.

\- CAPTCHA validation is enforced:

&#x20; - Invalid CAPTCHA shows an error.

&#x20; - Expired CAPTCHA requires refresh.

\- Password visibility toggle works as expected.

\- Multiple failed login attempts do \*\*not\*\* lock the account.



\---



\## Forgot Password



\### Current Behavior

\- Submitting a registered email sends a reset link.

\- Submitting an unregistered email shows an error.

\- Opening a valid reset link loads the reset page.

\- Opening an expired reset link shows an expiry message.

\- Reusing a reset token is blocked.

\- Weak passwords are rejected.

\- Strong passwords update successfully.



\---



\## Post-Login UI \& Route Protection



\### Current Behavior

\- Logged-in user name is displayed in the UI.

\- Sidebar appears after successful login.

\- Direct URL access without authentication redirects to login.

\- Role-based route protection is enforced:

&#x20; - Students cannot access admin routes.



\---



\## Role-Based Visibility Rules



\### Current Behavior

\- \*\*Student\*\*

&#x20; - Sees only student-specific menus.

&#x20; - Sees only own data.

\- \*\*Class Advisor (CA)\*\*

&#x20; - Sees only assigned `dept\_id` and `class\_id`.

&#x20; - Can access only assigned class students.

\- \*\*Staff\*\*

&#x20; - Sees only assigned `class\_id`.

\- \*\*HOD\*\*

&#x20; - Sees staff and students under assigned `dept\_id`.

\- \*\*Principal\*\*

&#x20; - Has access to all departments, classes, staff, and students.



\---



\## Dashboard



\### Current Behavior

\- Student dashboard loads personal data correctly.

\- CA dashboard shows class summary matching database values.

\- Principal dashboard displays institution-level aggregated statistics.



\---



\## Attendance Management



\### Current Behavior

\- CA can select only assigned classes.

\- Access to unassigned classes is blocked.

\- Attendance marking options:

&#x20; - Mark all present

&#x20; - Mark absentees

&#x20; - Manual marking

\- Same-day attendance updates are allowed.

\- Previous-day attendance updates are blocked.

\- Students can view their own attendance.

\- HOD can view department-wise attendance with filtering.



\---



\## Late Arrival Management



\### Current Behavior

\- Security scans barcode for staff or students.

\- Barcode scan auto-fills register input.

\- Late entry is saved with timestamp.

\- Late arrivals can be viewed by date.

\- Both staff and student in/out records are visible based on filter.



\---



\## Mess Management



\### Current Behavior

\- Attendance data auto-generates mess count.

\- Manual override of count is allowed.

\- Final count is persisted.

\- Bills can be generated for a selected date range.

\- Payment confirmation is saved.



\---



\## Announcements



\### Current Behavior

\- Principal can create announcements visible to all.

\- HOD can create department-specific announcements.

\- CA can create class-specific announcements.

\- Students cannot create announcements.

\- Lower roles cannot edit higher-role announcements.

\- Higher roles can delete lower-role announcements.



\---



\## Placement Training – Courses



\### Current Behavior

\- Trainer can create, edit, and delete courses.

\- Courses can be assigned to specific departments and classes.



\---



\## Placement Training – Tests



\### Current Behavior

\- Trainer can create tests.

\- Tests can be assigned to classes.

\- Published tests become visible to students.

\- Editing a published test is blocked.

\- Publish window can be reset.



\---



\## Online Examination System



\### Current Behavior

\- Test starts in fullscreen mode.

\- Exiting fullscreen triggers a warning.

\- Tab switching is detected and logged.

\- Multiple violations cause auto termination of the test.

\- Copy and paste actions are blocked.

\- Test auto-submits on time expiry.

\- Manual submission is supported.



\---



\## Results \& Analytics



\### Current Behavior

\- Students can view their own results and result history.

\- CA can view class-level results.

\- HOD can view department-level results.

\- Principal can view institution-level analytics with charts.



\---



\## Session Security



\### Current Behavior

\- JWT expiry logs the user out.

\- API access without token returns 401.

\- Invalid token results in unauthorized response.

\- Refresh after logout redirects to login.



\---



\## API Validation



\### Current Behavior

\- `/api/login` with valid payload returns 200 OK.

\- `/api/login` with invalid payload returns 400.

\- Attendance API access by student is denied.

\- Late entry API access by non-security role is denied.

\- Mess API access by non-principal role is denied.

\- Placement training results API:

&#x20; - Students receive only their own data.



\---



\## UI Validation



\### Current Behavior

\- Sidebar collapse and expand works correctly.

\- Page refresh retains active session.

\- Broken API responses show error messages.



\---



\## Data Integrity



\### Current Behavior

\- Duplicate attendance submissions are prevented.

\- Duplicate late entries are saved only once.

\- Duplicate test submissions are blocked.



\---



\## Performance



\### Current Behavior

\- Dashboard loads under load with acceptable response time.

\- Attendance loading for large classes performs acceptably.



\---



\## Audit \& Logging



\### Current Behavior

\- Critical actions are logged.

\- Login attempts are recorded.

\- Exam malpractice events are logged.



\---



\## Compatibility



\### Current Behavior

\- Works correctly in Chrome.

\- Works correctly in Edge.

\- Mobile browser UI is responsive.



\---



\## Fail Safety



\### Current Behavior

\- Server restart during session logs user out safely.

\- Server restart during exam auto-submits the test.



\---



\## Subject Management



\### Current Behavior

\- Subjects can be managed with:

&#x20; - Subject code

&#x20; - Subject name

&#x20; - Regulation

&#x20; - Department

&#x20; - Class

&#x20; - Periods per week

\- Subject records can be edited or deleted.



\---



\## Marks Management



\### Current Behavior

\- Marks can be entered and viewed for:

&#x20; - IAT 1

&#x20; - IAT 2

&#x20; - Model exam

&#x20; - Final exam



\---



\## Open Questions / Unclear Areas



\- None explicitly identified from the provided notes.






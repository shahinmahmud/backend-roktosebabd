# Rokto Sheba Donor Authentication API Testing

## Base URL

```
http://localhost:8000/api/v1
```

## 1. Donor Registration

```bash
POST /donor-auth/register
Content-Type: multipart/form-data

{
  "name": "আহমেদ হাসান",
  "phone": "01712345678",
  "city": "ঢাকা",
  "location": "ধানমন্ডি",
  "address": "বাড়ি ১২৩, রোড ৫, ধানমন্ডি",
  "bloodGroup": "A+",
  "gender": "Male",
  "religion": "Islam",
  "dateOfBirth": "1995-01-15",
  "password": "password123",
  "email": "ahmed@example.com",
  "profession": "Software Engineer",
  "weight": 70,
  "height": 175,
  "emergencyContact": {
    "name": "ফাতিমা হাসান",
    "phone": "01712345679",
    "relation": "স্ত্রী"
  }
}
```

## 2. Donor Login

```bash
POST /donor-auth/login
Content-Type: application/json

{
  "phone": "01712345678",
  "password": "password123"
}
```

## 3. Get Current Donor Profile

```bash
GET /donor-auth/profile
Authorization: Bearer <access_token>
```

## 4. Update Donor Profile

```bash
PATCH /donor-auth/profile
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

{
  "name": "আহমেদ হাসান উপডেট",
  "email": "newemail@example.com",
  "profession": "Senior Software Engineer",
  "weight": 72
}
```

## 5. Change Password

```bash
POST /donor-auth/change-password
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "oldPassword": "password123",
  "newPassword": "newpassword123"
}
```

## 6. Check Donation Eligibility

```bash
GET /donor-auth/check-eligibility
Authorization: Bearer <access_token>
```

## 7. Get Donation History

```bash
GET /donor-auth/donation-history
Authorization: Bearer <access_token>
```

## 8. Donor Logout

```bash
POST /donor-auth/logout
Authorization: Bearer <access_token>
```

## 9. Refresh Access Token

```bash
POST /donor-auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "<refresh_token>"
}
```

## Public Routes (Limited Information)

### 10. Get Public Donors List

```bash
GET /donors?page=1&limit=10&bloodGroup=A+&city=ঢাকা

# Response: Only shows public fields
{
  "statusCode": 200,
  "data": {
    "donors": [
      {
        "_id": "...",
        "name": "আহমেদ হাসান",
        "gender": "Male",
        "religion": "Islam",
        "profession": "Software Engineer",
        "address": "বাড়ি ১২৩, রোড ৫, ধানমন্ডি",
        "bloodGroup": "A+",
        "city": "ঢাকা",
        "location": "ধানমন্ডি",
        "profilePhoto": "...",
        "totalDonations": 5,
        "lastDonationDate": "2024-03-15"
      }
    ],
    "totalPages": 10,
    "currentPage": 1,
    "total": 95
  }
}
```

### 11. Get Public Donor Details

```bash
GET /donors/{id}

# Response: Only shows public fields
{
  "statusCode": 200,
  "data": {
    "name": "আহমেদ হাসান",
    "gender": "Male",
    "religion": "Islam",
    "profession": "Software Engineer",
    "address": "বাড়ি ১২৩, রোড ৫, ধানমন্ডি",
    "bloodGroup": "A+",
    "city": "ঢাকা",
    "location": "ধানমন্ডি",
    "profilePhoto": "...",
    "totalDonations": 5,
    "lastDonationDate": "2024-03-15"
  }
}
```

## Admin Routes (Complete Information)

### 12. Get All Donors (Admin Only)

```bash
GET /donors/admin/all?page=1&limit=10&accountStatus=ACTIVE&search=আহমেদ
Authorization: Bearer <admin_access_token>

# Response: Complete information + statistics
{
  "statusCode": 200,
  "data": {
    "donors": [
      {
        "_id": "...",
        "name": "আহমেদ হাসান",
        "phone": "01712345678",
        "email": "ahmed@example.com",
        "city": "ঢাকা",
        "location": "ধানমন্ডি",
        "address": "বাড়ি ১২৩, রোড ৫, ধানমন্ডি",
        "bloodGroup": "A+",
        "gender": "Male",
        "religion": "Islam",
        "dateOfBirth": "1995-01-15",
        "profession": "Software Engineer",
        "weight": 70,
        "height": 175,
        "nationalId": "1234567890123",
        "accountStatus": "ACTIVE",
        "eligibilityStatus": "ELIGIBLE",
        "registrationDate": "2024-01-01",
        "lastLoginDate": "2024-06-28",
        "totalDonations": 5,
        "lastDonationDate": "2024-03-15",
        "nextEligibleDate": "2024-06-13",
        "donationHistory": [...],
        "emergencyContact": {...},
        "privacySettings": {...}
      }
    ],
    "totalPages": 10,
    "currentPage": 1,
    "total": 95,
    "statistics": {
      "totalDonors": 1250,
      "activeDonors": 980,
      "pendingDonors": 45,
      "eligibleDonors": 850,
      "totalDonations": 4500
    }
  }
}
```

### 13. Get Complete Donor Details (Admin Only)

```bash
GET /donors/admin/{id}
Authorization: Bearer <admin_access_token>

# Response: All donor information including medical history, donation records, etc.
```

### 14. Add Donor Manually (Admin)

```bash
POST /donors
Content-Type: multipart/form-data

{
  "name": "Manual Entry Donor",
  "phone": "01712345680",
  "city": "চট্টগ্রাম",
  "location": "আগ্রাবাদ",
  "address": "বাড়ি ৪৫৬, আগ্রাবাদ",
  "bloodGroup": "B+",
  "gender": "Female",
  "religion": "Islam",
  "dateOfBirth": "1990-05-20"
}
```

### 12. Approve Donor (Medical Staff)

```bash
PUT /donors/{donorId}/approve
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "eligibilityStatus": "ELIGIBLE",
  "notes": "Medical screening completed successfully"
}
```

### 13. Update Donation Record (Medical Staff)

```bash
PUT /donors/{id}/update-donation
Authorization: Bearer <user_access_token>
Content-Type: application/json

{
  "lastDonationDate": "2024-06-28",
  "location": "ঢাকা মেডিকেল কলেজ",
  "bloodBank": "DMCH Blood Bank",
  "units": 1,
  "notes": "Successful donation, no complications"
}
```

## Response Format

### Success Response

```json
{
  "statusCode": 200,
  "data": { ... },
  "message": "Operation successful",
  "success": true
}
```

### Error Response

```json
{
    "statusCode": 400,
    "data": null,
    "message": "Error message",
    "success": false,
    "errors": [],
    "stack": "..."
}
```

## Important Notes

1. **Access Token**: Include in Authorization header as `Bearer <token>`
2. **Refresh Token**: Used to get new access token when expired
3. **Account Status**: New donors have "PENDING" status until approved
4. **Eligibility**: Checked automatically based on age, weight, last donation date
5. **File Upload**: Profile photos uploaded to Cloudinary
6. **Validation**: Phone numbers validated for BD format, age between 18-65
7. **Security**: Passwords hashed with bcrypt, JWT tokens for authentication

# 🚀 Custom Fields Management - Quick Start Guide

## ⚡ 5-Minute Setup

### Step 1: Run Database Migration (2 minutes)

1. Open your Supabase dashboard
2. Go to SQL Editor
3. Copy and paste the entire contents of:
   ```
   migrations/20251029_custom_field_definitions.sql
   ```
4. Click **Run**
5. Verify success message

### Step 2: Restart Your Application (1 minute)

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### Step 3: Access Custom Fields (1 minute)

1. Log in to your CRM
2. Look for **"Custom Fields"** in the sidebar (below Reports)
3. Click to open the Custom Fields management page

### Step 4: Create Your First Custom Field (1 minute)

1. Click **"Create Custom Field"** button
2. Fill in:
   - Field Name: `budget_range`
   - Field Label: `Budget Range`
   - Entity Type: `Lead`
   - Data Type: `Select`
3. Click **"Add"** under Options and add:
   - `< $10,000`
   - `$10,000 - $50,000`
   - `$50,000 - $100,000`
   - `> $100,000`
4. Check **"Required"** and **"Searchable"**
5. Click **"Create Field"**

**Done!** ✅ You've created your first custom field!

---

## 🎯 What to Do Next

### Test the System

1. **View your field** in the Custom Fields list
2. **Click Edit** to modify it
3. **Click the chart icon** to view usage statistics
4. **Create a few more fields** to get comfortable

### Common Fields to Create

**For Leads:**
```
1. company_size (Select: 1-10, 11-50, 51-200, 200+)
2. timeline (Select: Immediate, 1-3 months, 3-6 months, 6+ months)
3. interested_products (Multi-Select: Product A, Product B, Product C)
4. budget (Currency)
5. newsletter_signup (Boolean)
```

**For Contacts:**
```
1. preferred_contact_method (Select: Email, Phone, Text)
2. best_time_to_call (Select: Morning, Afternoon, Evening)
3. linkedin_profile (URL)
4. birthday (Date)
```

**For Companies:**
```
1. industry (Select: Technology, Finance, Healthcare, etc.)
2. annual_revenue (Currency)
3. employee_count (Number)
4. website (URL)
```

---

## 📖 Learn More

**Full Documentation:**
- `docs/CUSTOM_FIELDS_MANAGEMENT_GUIDE.md` - Complete guide with examples

**Implementation Details:**
- `CUSTOM_FIELDS_SYSTEM_IMPLEMENTATION.md` - Technical overview

**Database Schema:**
- `migrations/20251029_custom_field_definitions.sql` - Database structure

---

## 🆘 Troubleshooting

### "Custom Fields menu not showing"
- Check your user role (must be Manager, Company Admin, or Super Admin)
- Refresh the page
- Clear browser cache

### "Cannot create field"
- Verify field name is lowercase with underscores only
- Ensure field name is unique within the entity type
- For Select/Multi-Select, add at least one option

### "Database error"
- Verify migration SQL ran successfully
- Check Supabase logs for errors
- Ensure all tables were created

### "API errors"
- Verify backend is running
- Check backend console for errors
- Verify routes are registered in `app.js`

---

## 💡 Pro Tips

1. **Start Simple**
   - Create 2-3 essential fields first
   - Test them thoroughly
   - Add more as needed

2. **Use Descriptive Names**
   - Good: `budget_range`, `company_size`
   - Bad: `field1`, `cf_001`

3. **Add Help Text**
   - Explain what each field is for
   - Give examples when helpful

4. **Check Usage Stats**
   - Regularly review which fields are used
   - Delete or deactivate unused fields

5. **Test with API**
   - Ensure API lead capture respects field definitions
   - Test validation rules work correctly

---

## ✅ Quick Reference

### Data Types Cheat Sheet

| Type | Best For | Example |
|------|----------|---------|
| Text | Short text | Name, Code |
| Text Area | Long text | Description, Notes |
| Number | Integers | Count, Quantity |
| Decimal | Decimals | Rating, Percentage |
| Boolean | Yes/No | Consent, Flag |
| Date | Dates | Deadline, Birthday |
| Select | Single choice | Status, Category |
| Multi-Select | Multiple choices | Tags, Features |
| Email | Email addresses | Secondary email |
| Phone | Phone numbers | Mobile, Office |
| URL | Websites | LinkedIn, Portfolio |
| Currency | Money | Budget, Revenue |

### Keyboard Shortcuts

- `Ctrl/Cmd + F` - Focus search
- `Escape` - Close modals
- `Enter` - Submit forms (when in input)

### API Endpoints

```
GET    /api/custom-fields              List all
POST   /api/custom-fields              Create new
GET    /api/custom-fields/:id          Get one
PUT    /api/custom-fields/:id          Update
DELETE /api/custom-fields/:id          Delete
GET    /api/custom-fields/:id/usage    Usage stats
```

---

## 🎉 You're Ready!

Start creating custom fields to capture exactly the data your business needs!

**Questions?** Check the full documentation in `docs/CUSTOM_FIELDS_MANAGEMENT_GUIDE.md`

---

**Last Updated:** October 29, 2024


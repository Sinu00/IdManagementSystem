## 🏗️ System Architecture

### **Purpose & Domain**
This is an **Iqama (Saudi Arabia ID) management system** for tracking individuals associated with companies, managing their renewal dates, payments, and compliance status. It's built for immigration/labor consulting firms managing multiple clients and their employees' legal documentation.

### **Tech Stack**
- **Backend**: Node.js, Express.js, MongoDB with Mongoose
- **Frontend**: React with Material-UI, Multi-language support (Arabic/English)
- **Authentication**: JWT-based with role-based access control

---

## 🗄️ Data Models & Business Logic

### **Core Entities**

1. **MainPerson** - Primary business entities (Mosa, Nasser, Munif)
2. **Company** - Businesses owned by MainPersons
3. **Individual** - Employees/workers with Iqama numbers
4. **User** - System users with different access levels
5. **Income/Expense** - Financial tracking
6. **Notifications** - Admin approval workflow

### **Key Business Rules**

**Payment System**:
- Default Iqama price: SAR 5000 (configurable)
- Tracks payment history and pending amounts
- Company payments: CR, Qiwa, Muqeem, EFA, Saudi amounts
- Payment status: none_paid → partially_paid → fully_paid

**Expiry Management**:
- **Red Cards**: Expired IDs
- **Orange Cards**: Expiring within 30 days  
- **Green Cards**: Valid for >30 days

---

## 🔐 Authentication & Authorization

### **User Roles**
1. **Admin Users** (isAdmin: true)
   - Full CRUD operations
   - Can approve notifications
   - Access to all features

2. **Regular Users** (isAdmin: false)
   - Create requests that need admin approval
   - Limited to assigned MainPersons

### **Access Control**
- **allowedMainPersons**: Array of MainPerson IDs user can access
- **hasIncomeAccess**: Controls financial data access
- Special handling for "Nasser" (ID: 67d09798726e5a47c4caf071) with separate routes

---

## 🔄 Workflow System

### **Admin Approval Process**
When regular users perform operations, they create **notifications** that admins must approve:

**Individual Operations** (`NotifyAdmin`):
- **ADD**: New individual registration
- **RENEW**: Extend Iqama expiry date
- **PAYMENT**: Process pending payments

**Company Operations** (`NotifyCompanyAdmin`):
- **ADD**: New company creation
- **PAYMENT**: Company fee payments (CR, Qiwa, etc.)

### **Approval Flow**
1. Regular user submits request → Creates notification
2. Admin reviews in AdminNotifications page
3. Admin approves/rejects
4. System creates/updates actual records + generates income entries

---

## 📱 Frontend Features

### **Main Pages**
- **Home**: Dashboard with MainPerson cards and stats
- **CompanyList**: Company management per MainPerson
- **IndividualList**: Employee/worker management per Company
- **ExpiredIds/ExpiringSoonIds**: Compliance tracking
- **IncomeExpense**: Financial tracking
- **AdminNotifications**: Approval workflow
- **UserManagement**: User administration
- **BulkMigration**: Data import functionality

### **Special Features**
- **Multi-language**: Arabic/English with RTL support
- **PDF Generation**: Print ID cards and reports
- **Real-time filtering**: Search, sort, filter data
- **Responsive design**: Mobile-friendly interface
- **Payment tracking**: Individual and company financials

---

## 🎯 Key Business Flows

### **1. Individual Management**
```
Add Individual → Payment Processing → Expiry Tracking → Renewal Process
```

### **2. Company Management**
```
Create Company → CR Registration → Qiwa/Muqeem/EFA Payments → Status Tracking
```

### **3. Financial Tracking**
```
Payments → Income Records → Expense Tracking → Balance Calculations
```

### **4. Compliance Management**
```
Monitor Expiry Dates → Generate Alerts → Process Renewals → Update Status
```

---

## 🔧 Technical Features

### **Backend**
- RESTful API with Express.js
- MongoDB aggregation for statistics
- Transaction support for complex operations
- JWT middleware for authentication
- Separate routes for Nasser's operations

### **Frontend**
- Context API for state management
- Lazy loading for performance
- Material-UI components
- PDF generation with jsPDF
- Internationalization (i18n)

### **Special Considerations**
- **Nasser Segregation**: Special MainPerson with isolated data
- **Payment Status Automation**: Auto-calculates based on amounts
- **Notification System**: Approval workflow for non-admin operations
- **Bulk Operations**: Mass data migration capabilities

This system effectively manages the complex workflows of immigration/labor consulting, providing role-based access, approval workflows, and comprehensive tracking of both compliance and financial aspects.
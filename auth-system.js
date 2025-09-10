/**
 * Role-Based Authorization System
 * Hierarchical permissions: Admin > Dean > Department Manager > Faculty > User
 */

class AuthorizationSystem {
    constructor() {
        this.roles = {
            SUPER_ADMIN: {
                level: 100,
                name: 'Super Administrator',
                permissions: ['*'], // All permissions
                description: 'Full system access'
            },
            ADMIN: {
                level: 90,
                name: 'Administrator',
                permissions: [
                    'view_all_budgets',
                    'modify_all_budgets',
                    'create_departments',
                    'manage_users',
                    'view_system_reports',
                    'budget_transfers',
                    'approve_large_expenses',
                    'system_configuration'
                ],
                description: 'School-wide administrative access'
            },
            DEAN: {
                level: 80,
                name: 'Dean',
                permissions: [
                    'view_cross_departmental',
                    'approve_department_budgets',
                    'view_dean_reports',
                    'manage_department_heads',
                    'budget_oversight',
                    'enrollment_planning'
                ],
                description: 'Cross-departmental oversight'
            },
            DEPARTMENT_MANAGER: {
                level: 70,
                name: 'Department Manager',
                permissions: [
                    'view_department_budget',
                    'modify_department_budget',
                    'manage_faculty',
                    'course_scheduling',
                    'resource_allocation',
                    'department_reports'
                ],
                description: 'Department-level management'
            },
            FACULTY: {
                level: 60,
                name: 'Faculty',
                permissions: [
                    'view_own_courses',
                    'request_resources',
                    'view_class_budgets',
                    'submit_expense_requests'
                ],
                description: 'Teaching staff access'
            },
            USER: {
                level: 50,
                name: 'User',
                permissions: [
                    'view_basic_info',
                    'view_own_data'
                ],
                description: 'Basic user access'
            }
        };

        this.departments = {
            MATHEMATICS: 'Mathematics',
            SCIENCE: 'Science', 
            ENGLISH: 'English Language Arts',
            HISTORY: 'Social Studies',
            ARTS: 'Fine Arts',
            SPORTS: 'Physical Education',
            ADMINISTRATION: 'Administration'
        };
    }

    /**
     * Check if user has specific permission
     */
    hasPermission(userRole, permission, userDepartment = null, targetDepartment = null) {
        const role = this.roles[userRole];
        if (!role) return false;

        // Super admin has all permissions
        if (role.permissions.includes('*')) return true;

        // Check direct permission
        if (role.permissions.includes(permission)) {
            // For department-specific permissions, check department access
            if (targetDepartment && userDepartment) {
                return this.hasDepartmentAccess(userRole, userDepartment, targetDepartment);
            }
            return true;
        }

        return false;
    }

    /**
     * Check department access based on role hierarchy
     */
    hasDepartmentAccess(userRole, userDepartment, targetDepartment) {
        const role = this.roles[userRole];
        
        // Admin and Dean can access all departments
        if (['SUPER_ADMIN', 'ADMIN', 'DEAN'].includes(userRole)) {
            return true;
        }

        // Department managers and faculty can only access their own department
        if (['DEPARTMENT_MANAGER', 'FACULTY'].includes(userRole)) {
            return userDepartment === targetDepartment;
        }

        return false;
    }

    /**
     * Get user's accessible departments
     */
    getAccessibleDepartments(userRole, userDepartment) {
        if (['SUPER_ADMIN', 'ADMIN', 'DEAN'].includes(userRole)) {
            return Object.keys(this.departments);
        }

        if (['DEPARTMENT_MANAGER', 'FACULTY'].includes(userRole) && userDepartment) {
            return [userDepartment];
        }

        return [];
    }

    /**
     * Check if user can perform action on target user
     */
    canManageUser(managerRole, managerLevel, targetRole, targetLevel) {
        const manager = this.roles[managerRole];
        const target = this.roles[targetRole];

        if (!manager || !target) return false;

        // Can only manage users with lower role level
        return manager.level > target.level;
    }

    /**
     * Get role hierarchy for display
     */
    getRoleHierarchy() {
        return Object.entries(this.roles)
            .sort(([,a], [,b]) => b.level - a.level)
            .map(([key, role]) => ({
                key,
                ...role
            }));
    }

    /**
     * Validate budget operation permissions
     */
    canPerformBudgetOperation(userRole, operation, amount, userDepartment, targetDepartment) {
        const thresholds = {
            SMALL: 1000,
            MEDIUM: 10000,
            LARGE: 50000,
            CRITICAL: 100000
        };

        const getAmountCategory = (amt) => {
            if (amt >= thresholds.CRITICAL) return 'CRITICAL';
            if (amt >= thresholds.LARGE) return 'LARGE';
            if (amt >= thresholds.MEDIUM) return 'MEDIUM';
            return 'SMALL';
        };

        const category = getAmountCategory(amount);
        const role = this.roles[userRole];

        switch (operation) {
            case 'APPROVE_EXPENSE':
                if (category === 'CRITICAL') return ['SUPER_ADMIN', 'ADMIN'].includes(userRole);
                if (category === 'LARGE') return role.level >= 80; // Dean and above
                if (category === 'MEDIUM') return role.level >= 70; // Department Manager and above
                return role.level >= 60; // Faculty and above for small expenses

            case 'BUDGET_TRANSFER':
                if (userDepartment !== targetDepartment) {
                    return role.level >= 80; // Cross-department transfers need Dean+
                }
                return role.level >= 70; // Same department needs Department Manager+

            case 'VIEW_BUDGET':
                return this.hasDepartmentAccess(userRole, userDepartment, targetDepartment);

            case 'MODIFY_BUDGET':
                return this.hasDepartmentAccess(userRole, userDepartment, targetDepartment) && 
                       role.level >= 70;

            default:
                return false;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthorizationSystem;
} else {
    window.AuthorizationSystem = AuthorizationSystem;
}

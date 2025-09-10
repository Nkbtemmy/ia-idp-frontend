/**
 * High School Budget Management Engine
 * Advanced financial modeling and resource allocation system
 */

class BudgetEngine {
    constructor() {
        this.currentYear = new Date().getFullYear();
        this.academicYear = `${this.currentYear}-${this.currentYear + 1}`;
        
        // Base cost structures (per academic year)
        this.costStructures = {
            instructor: {
                FULL_TIME: { baseSalary: 65000, benefits: 0.28, maxStudents: 150 },
                PART_TIME: { baseSalary: 35000, benefits: 0.15, maxStudents: 75 },
                SUBSTITUTE: { hourlyRate: 45, benefits: 0.08, maxStudents: 30 },
                SPECIALIST: { baseSalary: 75000, benefits: 0.32, maxStudents: 100 }
            },
            facility: {
                CLASSROOM: { maintenanceCost: 8000, capacity: 30, utilizationTarget: 0.85 },
                LAB: { maintenanceCost: 15000, capacity: 24, utilizationTarget: 0.75 },
                GYMNASIUM: { maintenanceCost: 25000, capacity: 100, utilizationTarget: 0.70 },
                LIBRARY: { maintenanceCost: 12000, capacity: 50, utilizationTarget: 0.60 },
                AUDITORIUM: { maintenanceCost: 20000, capacity: 200, utilizationTarget: 0.40 }
            },
            equipment: {
                BASIC: { costPerStudent: 150, depreciationYears: 5 },
                TECHNOLOGY: { costPerStudent: 400, depreciationYears: 3 },
                LABORATORY: { costPerStudent: 600, depreciationYears: 7 },
                SPORTS: { costPerStudent: 200, depreciationYears: 4 },
                ARTS: { costPerStudent: 300, depreciationYears: 6 }
            }
        };

        // Department configurations
        this.departmentConfigs = {
            MATHEMATICS: {
                instructorTypes: ['FULL_TIME', 'PART_TIME'],
                facilityTypes: ['CLASSROOM', 'LAB'],
                equipmentTypes: ['BASIC', 'TECHNOLOGY'],
                classSize: { min: 15, max: 28, optimal: 22 },
                creditsPerCourse: 1.0,
                coursesPerYear: 4
            },
            SCIENCE: {
                instructorTypes: ['FULL_TIME', 'SPECIALIST'],
                facilityTypes: ['CLASSROOM', 'LAB'],
                equipmentTypes: ['BASIC', 'TECHNOLOGY', 'LABORATORY'],
                classSize: { min: 12, max: 24, optimal: 18 },
                creditsPerCourse: 1.0,
                coursesPerYear: 4
            },
            ENGLISH: {
                instructorTypes: ['FULL_TIME', 'PART_TIME'],
                facilityTypes: ['CLASSROOM', 'LIBRARY'],
                equipmentTypes: ['BASIC', 'TECHNOLOGY'],
                classSize: { min: 18, max: 30, optimal: 24 },
                creditsPerCourse: 1.0,
                coursesPerYear: 4
            },
            HISTORY: {
                instructorTypes: ['FULL_TIME', 'PART_TIME'],
                facilityTypes: ['CLASSROOM', 'LIBRARY'],
                equipmentTypes: ['BASIC', 'TECHNOLOGY'],
                classSize: { min: 20, max: 32, optimal: 26 },
                creditsPerCourse: 1.0,
                coursesPerYear: 4
            },
            ARTS: {
                instructorTypes: ['FULL_TIME', 'SPECIALIST'],
                facilityTypes: ['CLASSROOM'],
                equipmentTypes: ['BASIC', 'ARTS'],
                classSize: { min: 10, max: 20, optimal: 15 },
                creditsPerCourse: 0.5,
                coursesPerYear: 2
            },
            SPORTS: {
                instructorTypes: ['FULL_TIME', 'PART_TIME'],
                facilityTypes: ['GYMNASIUM'],
                equipmentTypes: ['BASIC', 'SPORTS'],
                classSize: { min: 15, max: 35, optimal: 25 },
                creditsPerCourse: 0.5,
                coursesPerYear: 2
            }
        };
    }

    /**
     * Calculate optimal resource allocation based on enrollment projections
     */
    calculateOptimalAllocation(enrollmentData, budgetConstraints) {
        const allocations = {};
        
        for (const [department, enrollment] of Object.entries(enrollmentData)) {
            const config = this.departmentConfigs[department];
            if (!config) continue;

            const allocation = this.optimizeDepartmentAllocation(
                department, 
                enrollment, 
                config, 
                budgetConstraints[department] || 0
            );
            
            allocations[department] = allocation;
        }

        return this.balanceAllocations(allocations, budgetConstraints);
    }

    /**
     * Optimize allocation for a single department
     */
    optimizeDepartmentAllocation(department, enrollment, config, budget) {
        // Calculate required sections based on enrollment and optimal class size
        const sectionsNeeded = Math.ceil(enrollment / config.classSize.optimal);
        const actualClassSize = Math.ceil(enrollment / sectionsNeeded);
        
        // Calculate instructor requirements
        const instructorAllocation = this.calculateInstructorNeeds(
            sectionsNeeded, 
            config.instructorTypes,
            config.coursesPerYear
        );

        // Calculate facility requirements
        const facilityAllocation = this.calculateFacilityNeeds(
            sectionsNeeded,
            config.facilityTypes,
            actualClassSize
        );

        // Calculate equipment costs
        const equipmentAllocation = this.calculateEquipmentCosts(
            enrollment,
            config.equipmentTypes
        );

        // Calculate total costs
        const costs = this.calculateTotalCosts(
            instructorAllocation,
            facilityAllocation,
            equipmentAllocation
        );

        // Calculate efficiency metrics
        const metrics = this.calculateEfficiencyMetrics(
            enrollment,
            sectionsNeeded,
            actualClassSize,
            costs,
            config
        );

        return {
            department,
            enrollment,
            sectionsNeeded,
            actualClassSize,
            instructors: instructorAllocation,
            facilities: facilityAllocation,
            equipment: equipmentAllocation,
            costs,
            metrics,
            budgetUtilization: budget > 0 ? costs.total / budget : 0
        };
    }

    /**
     * Calculate instructor staffing needs
     */
    calculateInstructorNeeds(sections, instructorTypes, coursesPerYear) {
        const allocation = {};
        const totalWorkload = sections * coursesPerYear;
        
        // Prioritize full-time instructors for efficiency
        const fullTimeCapacity = this.costStructures.instructor.FULL_TIME.maxStudents / 25; // sections per instructor
        const fullTimeNeeded = Math.floor(totalWorkload / (fullTimeCapacity * coursesPerYear));
        const remainingWorkload = totalWorkload - (fullTimeNeeded * fullTimeCapacity * coursesPerYear);
        
        allocation.FULL_TIME = fullTimeNeeded;
        
        if (remainingWorkload > 0 && instructorTypes.includes('PART_TIME')) {
            const partTimeCapacity = this.costStructures.instructor.PART_TIME.maxStudents / 25;
            allocation.PART_TIME = Math.ceil(remainingWorkload / (partTimeCapacity * coursesPerYear));
        }

        if (instructorTypes.includes('SPECIALIST')) {
            // Specialists for specialized courses (20% of workload)
            allocation.SPECIALIST = Math.ceil(totalWorkload * 0.2 / (coursesPerYear * 2));
        }

        return allocation;
    }

    /**
     * Calculate facility requirements
     */
    calculateFacilityNeeds(sections, facilityTypes, classSize) {
        const allocation = {};
        
        for (const facilityType of facilityTypes) {
            const facilityConfig = this.costStructures.facility[facilityType];
            const utilizationRate = facilityConfig.utilizationTarget;
            
            // Calculate required facilities based on capacity and utilization
            const effectiveCapacity = facilityConfig.capacity * utilizationRate;
            const facilitiesNeeded = Math.ceil((sections * classSize) / effectiveCapacity);
            
            allocation[facilityType] = {
                count: facilitiesNeeded,
                utilization: Math.min((sections * classSize) / (facilitiesNeeded * facilityConfig.capacity), 1),
                capacity: facilitiesNeeded * facilityConfig.capacity
            };
        }

        return allocation;
    }

    /**
     * Calculate equipment costs
     */
    calculateEquipmentCosts(enrollment, equipmentTypes) {
        const allocation = {};
        
        for (const equipmentType of equipmentTypes) {
            const equipmentConfig = this.costStructures.equipment[equipmentType];
            const annualCost = (equipmentConfig.costPerStudent * enrollment) / equipmentConfig.depreciationYears;
            
            allocation[equipmentType] = {
                totalCost: equipmentConfig.costPerStudent * enrollment,
                annualCost,
                depreciationYears: equipmentConfig.depreciationYears,
                costPerStudent: equipmentConfig.costPerStudent
            };
        }

        return allocation;
    }

    /**
     * Calculate total costs for department allocation
     */
    calculateTotalCosts(instructors, facilities, equipment) {
        let instructorCosts = 0;
        let facilityCosts = 0;
        let equipmentCosts = 0;

        // Calculate instructor costs
        for (const [type, count] of Object.entries(instructors)) {
            const config = this.costStructures.instructor[type];
            if (config.baseSalary) {
                instructorCosts += count * config.baseSalary * (1 + config.benefits);
            } else if (config.hourlyRate) {
                // Assume 1000 hours per year for hourly instructors
                instructorCosts += count * config.hourlyRate * 1000 * (1 + config.benefits);
            }
        }

        // Calculate facility costs
        for (const [type, data] of Object.entries(facilities)) {
            const config = this.costStructures.facility[type];
            facilityCosts += data.count * config.maintenanceCost;
        }

        // Calculate equipment costs
        for (const [type, data] of Object.entries(equipment)) {
            equipmentCosts += data.annualCost;
        }

        return {
            instructors: instructorCosts,
            facilities: facilityCosts,
            equipment: equipmentCosts,
            total: instructorCosts + facilityCosts + equipmentCosts
        };
    }

    /**
     * Calculate efficiency metrics
     */
    calculateEfficiencyMetrics(enrollment, sections, classSize, costs, config) {
        const totalCredits = enrollment * config.creditsPerCourse * config.coursesPerYear;
        
        return {
            costPerStudent: costs.total / enrollment,
            costPerCreditHour: costs.total / totalCredits,
            studentInstructorRatio: enrollment / Object.values(costs.instructors || {}).reduce((a, b) => a + b, 1),
            classUtilization: classSize / config.classSize.optimal,
            budgetEfficiency: this.calculateBudgetEfficiency(costs, enrollment),
            facilityUtilization: this.calculateAverageFacilityUtilization(sections, classSize, config)
        };
    }

    /**
     * Calculate budget efficiency score (0-100)
     */
    calculateBudgetEfficiency(costs, enrollment) {
        const industryBenchmark = 12000; // Industry average cost per student
        const efficiency = Math.max(0, 100 - ((costs.total / enrollment - industryBenchmark) / industryBenchmark * 100));
        return Math.min(100, Math.max(0, efficiency));
    }

    /**
     * Calculate average facility utilization
     */
    calculateAverageFacilityUtilization(sections, classSize, config) {
        let totalUtilization = 0;
        let facilityCount = 0;

        for (const facilityType of config.facilityTypes) {
            const facilityConfig = this.costStructures.facility[facilityType];
            const utilization = (sections * classSize) / (Math.ceil(sections) * facilityConfig.capacity);
            totalUtilization += Math.min(utilization, 1);
            facilityCount++;
        }

        return facilityCount > 0 ? totalUtilization / facilityCount : 0;
    }

    /**
     * Balance allocations across departments within budget constraints
     */
    balanceAllocations(allocations, budgetConstraints) {
        const totalBudget = Object.values(budgetConstraints).reduce((sum, budget) => sum + budget, 0);
        const totalCost = Object.values(allocations).reduce((sum, alloc) => sum + alloc.costs.total, 0);

        if (totalCost <= totalBudget) {
            return allocations; // Within budget, no adjustment needed
        }

        // Apply proportional budget cuts
        const scaleFactor = totalBudget / totalCost;
        
        for (const [department, allocation] of Object.entries(allocations)) {
            allocation.costs.total *= scaleFactor;
            allocation.costs.instructors *= scaleFactor;
            allocation.costs.facilities *= scaleFactor;
            allocation.costs.equipment *= scaleFactor;
            allocation.budgetConstrained = true;
            allocation.scaleFactor = scaleFactor;
        }

        return allocations;
    }

    /**
     * Generate budget variance report
     */
    generateVarianceReport(actualSpending, budgetedAmounts) {
        const report = {
            totalBudget: 0,
            totalSpent: 0,
            totalVariance: 0,
            departments: {}
        };

        for (const [department, budgeted] of Object.entries(budgetedAmounts)) {
            const actual = actualSpending[department] || 0;
            const variance = actual - budgeted;
            const variancePercent = budgeted > 0 ? (variance / budgeted) * 100 : 0;

            report.departments[department] = {
                budgeted,
                actual,
                variance,
                variancePercent,
                status: this.getVarianceStatus(variancePercent)
            };

            report.totalBudget += budgeted;
            report.totalSpent += actual;
        }

        report.totalVariance = report.totalSpent - report.totalBudget;
        report.totalVariancePercent = report.totalBudget > 0 ? (report.totalVariance / report.totalBudget) * 100 : 0;

        return report;
    }

    /**
     * Get variance status based on percentage
     */
    getVarianceStatus(variancePercent) {
        if (variancePercent > 10) return 'OVER_BUDGET';
        if (variancePercent > 5) return 'WARNING';
        if (variancePercent < -10) return 'UNDER_UTILIZED';
        return 'ON_TRACK';
    }

    /**
     * Calculate enrollment projections based on historical data
     */
    calculateEnrollmentProjections(historicalData, growthFactors = {}) {
        const projections = {};
        
        for (const [department, history] of Object.entries(historicalData)) {
            const growthRate = growthFactors[department] || this.calculateTrendGrowthRate(history);
            const baseEnrollment = history[history.length - 1] || 0;
            
            projections[department] = {
                current: baseEnrollment,
                projected: Math.round(baseEnrollment * (1 + growthRate)),
                growthRate,
                confidence: this.calculateProjectionConfidence(history)
            };
        }

        return projections;
    }

    /**
     * Calculate trend-based growth rate
     */
    calculateTrendGrowthRate(history) {
        if (history.length < 2) return 0;
        
        const recentYears = history.slice(-3); // Use last 3 years
        let totalGrowth = 0;
        
        for (let i = 1; i < recentYears.length; i++) {
            if (recentYears[i - 1] > 0) {
                totalGrowth += (recentYears[i] - recentYears[i - 1]) / recentYears[i - 1];
            }
        }
        
        return totalGrowth / (recentYears.length - 1);
    }

    /**
     * Calculate projection confidence based on data stability
     */
    calculateProjectionConfidence(history) {
        if (history.length < 3) return 0.5;
        
        const mean = history.reduce((sum, val) => sum + val, 0) / history.length;
        const variance = history.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / history.length;
        const coefficient = Math.sqrt(variance) / mean;
        
        // Lower coefficient of variation = higher confidence
        return Math.max(0.1, Math.min(1.0, 1 - coefficient));
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BudgetEngine;
} else {
    window.BudgetEngine = BudgetEngine;
}

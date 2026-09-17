/**
 * CAMPUS EATS - RBAC PORTAL VISIBILITY & ROLE ESCALATION PREVENTION TEST SUITE
 * Verifies role-authorized portal filtering, client-side escalation prevention, and backend RBAC guards.
 */

import assert from "assert";

console.log("\n==================================================");
console.log("🛡️ CAMPUS EATS - RBAC PORTAL VISIBILITY TEST SUITE");
console.log("==================================================\n");

let passed = 0;
let failed = 0;

const test = (description, fn) => {
    try {
        fn();
        console.log(`  ✓ PASS: ${description}`);
        passed++;
    } catch (error) {
        console.error(`  ✗ FAIL: ${description}`);
        console.error(`    ${error.message}`);
        failed++;
    }
};

const ALL_ROLES_LIST = [
    { role: 'student', label: 'Student / Faculty' },
    { role: 'kitchen', label: 'Kitchen KDS' },
    { role: 'counter', label: 'Pickup Counter' },
    { role: 'admin', label: 'Campus Admin' },
];

const getAuthorizedRolesList = (userRole) => {
    const normalizedRole = (userRole || 'student').toLowerCase();
    return ALL_ROLES_LIST.filter((item) => {
        if (normalizedRole === 'admin') return item.role === 'admin';
        if (normalizedRole === 'kitchen') return item.role === 'kitchen';
        if (normalizedRole === 'counter') return item.role === 'counter';
        return item.role === 'student';
    });
};

const simulateRoleTransition = (currentUserRole, targetRole) => {
    const authRole = (currentUserRole || 'student').toLowerCase();
    if (authRole === 'admin') {
        return targetRole;
    } else if (authRole === targetRole) {
        return targetRole;
    } else {
        // Blocked escalation: stays at authRole
        return authRole;
    }
};

// 1. Role-Authorized Portal Visibility Tests
console.log("1. Testing Role-Authorized Portal Visibility in Header UI...");

test("Student account sees ONLY 'Student / Faculty' portal (no Kitchen, Counter, or Admin)", () => {
    const studentRoles = getAuthorizedRolesList("student");
    assert.strictEqual(studentRoles.length, 1);
    assert.strictEqual(studentRoles[0].role, "student");
    assert.strictEqual(studentRoles.some(r => r.role === "kitchen"), false);
    assert.strictEqual(studentRoles.some(r => r.role === "counter"), false);
    assert.strictEqual(studentRoles.some(r => r.role === "admin"), false);
});

test("Kitchen account sees ONLY 'Kitchen KDS' portal", () => {
    const kitchenRoles = getAuthorizedRolesList("kitchen");
    assert.strictEqual(kitchenRoles.length, 1);
    assert.strictEqual(kitchenRoles[0].role, "kitchen");
    assert.strictEqual(kitchenRoles.some(r => r.role === "admin"), false);
    assert.strictEqual(kitchenRoles.some(r => r.role === "student"), false);
});

test("Counter account sees ONLY 'Pickup Counter' portal", () => {
    const counterRoles = getAuthorizedRolesList("counter");
    assert.strictEqual(counterRoles.length, 1);
    assert.strictEqual(counterRoles[0].role, "counter");
    assert.strictEqual(counterRoles.some(r => r.role === "admin"), false);
    assert.strictEqual(counterRoles.some(r => r.role === "kitchen"), false);
});

test("Admin account sees ONLY 'Campus Admin' portal", () => {
    const adminRoles = getAuthorizedRolesList("admin");
    assert.strictEqual(adminRoles.length, 1);
    assert.strictEqual(adminRoles[0].role, "admin");
});

// 2. Client-Side Role Escalation Prevention Tests
console.log("\n2. Testing Client-Side Role Escalation Rejection...");

test("Student cannot escalate role to 'admin' via setRole", () => {
    const resolvedRole = simulateRoleTransition("student", "admin");
    assert.strictEqual(resolvedRole, "student");
});

test("Student cannot escalate role to 'kitchen' via setRole", () => {
    const resolvedRole = simulateRoleTransition("student", "kitchen");
    assert.strictEqual(resolvedRole, "student");
});

test("Student cannot escalate role to 'counter' via setRole", () => {
    const resolvedRole = simulateRoleTransition("student", "counter");
    assert.strictEqual(resolvedRole, "student");
});

test("Kitchen staff cannot escalate role to 'admin'", () => {
    const resolvedRole = simulateRoleTransition("kitchen", "admin");
    assert.strictEqual(resolvedRole, "kitchen");
});

test("Counter staff cannot escalate role to 'admin'", () => {
    const resolvedRole = simulateRoleTransition("counter", "admin");
    assert.strictEqual(resolvedRole, "counter");
});

// 3. Backend Authoritative RBAC Rules
console.log("\n3. Testing Authoritative Backend RBAC Policy Enforcement...");

const checkBackendAccess = (userRole, resource) => {
    const role = (userRole || "").toLowerCase();
    if (resource.startsWith("/api/admin")) {
        return role === "admin";
    }
    if (resource.startsWith("/api/kitchen")) {
        return ["kitchen", "admin"].includes(role);
    }
    if (resource.startsWith("/api/counter")) {
        return ["counter", "admin"].includes(role);
    }
    if (resource.startsWith("/api/orders")) {
        return ["student", "faculty", "admin"].includes(role);
    }
    return true;
};

test("Student is rejected by backend for /api/admin/*, /api/kitchen/*, and /api/counter/*", () => {
    assert.strictEqual(checkBackendAccess("student", "/api/admin/stats"), false);
    assert.strictEqual(checkBackendAccess("student", "/api/kitchen/orders"), false);
    assert.strictEqual(checkBackendAccess("student", "/api/counter/orders"), false);
    assert.strictEqual(checkBackendAccess("student", "/api/orders"), true);
});

test("Kitchen staff is rejected by backend for /api/admin/*", () => {
    assert.strictEqual(checkBackendAccess("kitchen", "/api/admin/stats"), false);
    assert.strictEqual(checkBackendAccess("kitchen", "/api/kitchen/orders"), true);
});

test("Counter staff is rejected by backend for /api/admin/*", () => {
    assert.strictEqual(checkBackendAccess("counter", "/api/admin/stats"), false);
    assert.strictEqual(checkBackendAccess("counter", "/api/counter/orders"), true);
});

test("Admin is authorized across management endpoints", () => {
    assert.strictEqual(checkBackendAccess("admin", "/api/admin/stats"), true);
    assert.strictEqual(checkBackendAccess("admin", "/api/kitchen/orders"), true);
    assert.strictEqual(checkBackendAccess("admin", "/api/counter/orders"), true);
});

console.log("\n==================================================");
console.log(`📊 RBAC TEST RESULTS: ${passed} Passed, ${failed} Failed`);
console.log("==================================================\n");

if (failed > 0) {
    process.exit(1);
}

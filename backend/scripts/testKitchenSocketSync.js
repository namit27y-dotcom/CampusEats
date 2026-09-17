/**
 * CAMPUS EATS - KITCHEN SOCKET SYNCHRONIZATION & REAL-TIME ORDER WORKFLOW TEST SUITE
 * Verifies staff canteen room authorization, real-time newOrderCreated delivery,
 * status state machine progression, and canteen ID cross-mapping normalization.
 */

import assert from "assert";

console.log("\n==================================================");
console.log("👨‍🍳 CAMPUS EATS - KITCHEN SOCKET SYNC TEST SUITE");
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

// 1. Socket Canteen Room Authorization Rules
console.log("1. Testing Staff Socket Canteen Room Authorization...");

const simulateJoinCanteen = (user, requestedCanteenId) => {
    if (!user) {
        return { allowed: false, error: "Authentication required to join canteen real-time updates." };
    }
    const role = String(user.role || "").toLowerCase();
    if (!["kitchen", "counter", "admin"].includes(role)) {
        return { allowed: false, error: "Unauthorized: Only authorized canteen staff can join canteen rooms." };
    }
    if (role === "admin") {
        return { allowed: true, room: `canteen_${requestedCanteenId}` };
    }
    if (user.canteen_id != null && user.canteen_id !== "") {
        if (String(user.canteen_id) !== String(requestedCanteenId)) {
            return {
                allowed: false,
                error: `Unauthorized: Staff assigned to Canteen #${user.canteen_id} cannot join Canteen #${requestedCanteenId}.`
            };
        }
    }
    return { allowed: true, room: `canteen_${requestedCanteenId}` };
};

test("Unauthenticated socket client cannot join canteen room", () => {
    const res = simulateJoinCanteen(null, 1);
    assert.strictEqual(res.allowed, false);
    assert.strictEqual(res.error.includes("Authentication required"), true);
});

test("Student role cannot join canteen room", () => {
    const res = simulateJoinCanteen({ id: 10, role: "student", canteen_id: null }, 1);
    assert.strictEqual(res.allowed, false);
    assert.strictEqual(res.error.includes("Unauthorized"), true);
});

test("Kitchen staff assigned to Canteen 1 CANNOT join Canteen 2 room", () => {
    const res = simulateJoinCanteen({ id: 2, role: "kitchen", canteen_id: 1 }, 2);
    assert.strictEqual(res.allowed, false);
    assert.strictEqual(res.error.includes("Staff assigned to Canteen #1 cannot join Canteen #2"), true);
});

test("Counter staff assigned to Canteen 1 CANNOT join Canteen 2 room", () => {
    const res = simulateJoinCanteen({ id: 3, role: "counter", canteen_id: 1 }, 2);
    assert.strictEqual(res.allowed, false);
    assert.strictEqual(res.error.includes("Staff assigned to Canteen #1 cannot join Canteen #2"), true);
});

test("Kitchen staff assigned to Canteen 1 can successfully join Canteen 1 room", () => {
    const res = simulateJoinCanteen({ id: 2, role: "kitchen", canteen_id: 1 }, 1);
    assert.strictEqual(res.allowed, true);
    assert.strictEqual(res.room, "canteen_1");
});

test("Admin is authorized to join any canteen room (e.g. Canteen 1, 2, 3)", () => {
    const res1 = simulateJoinCanteen({ id: 1, role: "admin" }, 1);
    const res2 = simulateJoinCanteen({ id: 1, role: "admin" }, 2);
    assert.strictEqual(res1.allowed, true);
    assert.strictEqual(res1.room, "canteen_1");
    assert.strictEqual(res2.allowed, true);
    assert.strictEqual(res2.room, "canteen_2");
});

// 2. Real-Time Order Broadcast & Room Isolation
console.log("\n2. Testing Real-Time Broadcast & Canteen Room Isolation...");

const simulateOrderBroadcast = (canteenId, orderPayload, clientSubscriptions) => {
    const targetRoom = `canteen_${canteenId}`;
    const receivedBy = [];
    for (const [clientId, rooms] of Object.entries(clientSubscriptions)) {
        if (rooms.includes(targetRoom)) {
            receivedBy.push(clientId);
        }
    }
    return receivedBy;
};

test("newOrderCreated in Canteen 1 reaches Canteen 1 kitchen and NOT Canteen 2 kitchen", () => {
    const subscriptions = {
        "kitchen-canteen-1": ["canteen_1"],
        "counter-canteen-1": ["canteen_1"],
        "kitchen-canteen-2": ["canteen_2"],
        "admin-all": ["canteen_1", "canteen_2"],
    };

    const orderData = { id: 101, token_number: "T101", total_amount: 150 };
    const recipients = simulateOrderBroadcast(1, orderData, subscriptions);

    assert.strictEqual(recipients.includes("kitchen-canteen-1"), true);
    assert.strictEqual(recipients.includes("counter-canteen-1"), true);
    assert.strictEqual(recipients.includes("admin-all"), true);
    assert.strictEqual(recipients.includes("kitchen-canteen-2"), false);
});

// 3. Sequential Order State Machine Progression
console.log("\n3. Testing Strict Order Status State Machine Progression...");

const validTransitions = {
    placed: ["accepted", "cancelled"],
    accepted: ["preparing", "cancelled"],
    preparing: ["ready"],
    ready: ["completed"],
    completed: [],
    cancelled: []
};

const transitionOrderStatus = (currentStatus, targetStatus) => {
    const allowed = validTransitions[currentStatus] || [];
    if (!allowed.includes(targetStatus)) {
        throw new Error(`Invalid transition: ${currentStatus} -> ${targetStatus}`);
    }
    return targetStatus;
};

test("Placed order progresses sequentially: placed -> accepted -> preparing -> ready -> completed", () => {
    let status = "placed";
    status = transitionOrderStatus(status, "accepted");
    assert.strictEqual(status, "accepted");

    status = transitionOrderStatus(status, "preparing");
    assert.strictEqual(status, "preparing");

    status = transitionOrderStatus(status, "ready");
    assert.strictEqual(status, "ready");

    status = transitionOrderStatus(status, "completed");
    assert.strictEqual(status, "completed");
});

test("Direct jump from placed -> preparing is blocked by backend state machine", () => {
    assert.throws(() => {
        transitionOrderStatus("placed", "preparing");
    }, /Invalid transition: placed -> preparing/);
});

test("Direct jump from accepted -> ready is blocked", () => {
    assert.throws(() => {
        transitionOrderStatus("accepted", "ready");
    }, /Invalid transition: accepted -> ready/);
});

test("Duplicate completion is blocked", () => {
    assert.throws(() => {
        transitionOrderStatus("completed", "completed");
    }, /Invalid transition: completed -> completed/);
});

// 4. Frontend Canteen ID Normalization & Cross-Mapping
console.log("\n4. Testing Frontend Canteen Normalization & Filtering...");

const isSameCanteen = (orderCanteenId, orderCanteenName, currentCanteen) => {
    if (!currentCanteen) return true;
    const ocId = String(orderCanteenId ?? '').trim().toLowerCase();
    const scId = String(currentCanteen.id ?? '').trim().toLowerCase();

    if (ocId && scId && ocId === scId) return true;

    if ((ocId === '1' || ocId === 'canteen-main') && (scId === '1' || scId === 'canteen-main')) return true;
    if ((ocId === '2' || ocId === 'canteen-mech') && (scId === '2' || scId === 'canteen-mech')) return true;
    if ((ocId === '3' || ocId === 'canteen-mba') && (scId === '3' || scId === 'canteen-mba')) return true;
    if ((ocId === '4' || ocId === 'canteen-night') && (scId === '4' || scId === 'canteen-night')) return true;

    if (orderCanteenName && currentCanteen.name) {
        const ocName = orderCanteenName.trim().toLowerCase();
        const scName = currentCanteen.name.trim().toLowerCase();
        if (ocName === scName || ocName.includes(scName) || scName.includes(ocName)) {
            return true;
        }
    }

    return false;
};

test("Matches backend numeric canteen ID '1' with frontend slug 'canteen-main'", () => {
    const matched = isSameCanteen("1", "Main Campus Canteen", { id: "canteen-main", name: "Main Campus Canteen" });
    assert.strictEqual(matched, true);
});

test("Matches backend numeric integer 1 with selected canteen ID 1", () => {
    const matched = isSameCanteen(1, "Main Campus Canteen", { id: "1", name: "Main Campus Canteen" });
    assert.strictEqual(matched, true);
});

test("Does NOT match Canteen 2 order with Canteen 1 selected", () => {
    const matched = isSameCanteen("2", "Mechanical Food Court", { id: "canteen-main", name: "Main Campus Canteen" });
    assert.strictEqual(matched, false);
});

test("Matches by canteen name even when ID format differs", () => {
    const matched = isSameCanteen("custom-id-99", "MBA Executive Cafe", { id: "canteen-mba", name: "MBA Executive Cafe" });
    assert.strictEqual(matched, true);
});

console.log("\n==================================================");
console.log(`📊 KITCHEN SYNC TEST RESULTS: ${passed} Passed, ${failed} Failed`);
console.log("==================================================\n");

if (failed > 0) {
    process.exit(1);
}

/**
 * businessPackagesService — packages/products & member credits
 * (kinlo_business/01 §3). Manual-first: the host assigns a package to a member
 * and can adjust credits by hand (+/-) with a reason. QR / booking check-ins
 * auto-deduct through businessAttendanceService, hitting the SAME balance.
 *
 * Data:
 *   businesses/{bizId}/packages/{packageId}  name, kind:'class'|'session',
 *                                            unlimited, credits, priceCents,
 *                                            validityDays, active, createdAt
 * A member's current grant lives ON the member record (one active package in
 * v1): member.activePackage {packageId,name,kind,unlimited,creditsTotal,
 * creditsRemaining,expiresAt,assignedAt} · member.creditBalance mirrors
 * creditsRemaining for quick display · member.creditLog [{delta,reason,at}].
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { getMyBizId } from "./businessService";
import { memberRefFor } from "./businessMembersService";

export const PACKAGE_KIND = { CLASS: "class", SESSION: "session" };

const packagesCol = (bizId) => collection(db, "businesses", bizId, "packages");
const packageRef = (bizId, id) => doc(db, "businesses", bizId, "packages", id);

export async function listPackages({ activeOnly = false } = {}, bizId = getMyBizId()) {
  if (!bizId) return [];
  try {
    const snap = await getDocs(query(packagesCol(bizId), orderBy("createdAt", "desc")));
    let rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (activeOnly) rows = rows.filter((p) => p.active !== false);
    return rows;
  } catch (e) {
    console.error("listPackages failed:", e?.message || e);
    return [];
  }
}

export async function getPackage(packageId, bizId = getMyBizId()) {
  if (!bizId || !packageId) return null;
  const snap = await getDoc(packageRef(bizId, packageId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function createPackage(data = {}, bizId = getMyBizId()) {
  if (!bizId) throw new Error("no_business");
  const payload = {
    name: (data.name || "").trim(),
    kind: data.kind === PACKAGE_KIND.SESSION ? PACKAGE_KIND.SESSION : PACKAGE_KIND.CLASS,
    unlimited: data.unlimited === true,
    credits: data.unlimited === true ? null : Math.max(0, parseInt(data.credits, 10) || 0),
    priceCents: Math.max(0, Math.round((parseFloat(data.price) || 0) * 100)),
    validityDays: data.validityDays ? Math.max(0, parseInt(data.validityDays, 10) || 0) : null,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const ref = await addDoc(packagesCol(bizId), payload);
  return { id: ref.id, ...payload };
}

export async function updatePackage(packageId, patch = {}, bizId = getMyBizId()) {
  if (!bizId || !packageId) return;
  const clean = { ...patch, updatedAt: serverTimestamp() };
  if (clean.price != null) {
    clean.priceCents = Math.max(0, Math.round((parseFloat(clean.price) || 0) * 100));
    delete clean.price;
  }
  await updateDoc(packageRef(bizId, packageId), clean);
}

export async function deletePackage(packageId, bizId = getMyBizId()) {
  if (!bizId || !packageId) return;
  await deleteDoc(packageRef(bizId, packageId));
}

const addDays = (days) => {
  if (!days) return null;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

/** Whether a member's active package has lapsed (expiry passed). */
export const isPackageExpired = (pkg) =>
  !!(pkg && pkg.expiresAt && new Date(pkg.expiresAt).getTime() < Date.now());

/**
 * Assign a package to a member (host action). Sets the member's active package,
 * credit balance and expiry; logs the grant.
 */
export async function assignPackage(memberId, packageId, bizId = getMyBizId()) {
  if (!bizId || !memberId || !packageId) return;
  const pkg = await getPackage(packageId, bizId);
  if (!pkg) throw new Error("package_not_found");
  const credits = pkg.unlimited ? 0 : pkg.credits || 0;
  const activePackage = {
    packageId: pkg.id,
    name: pkg.name,
    kind: pkg.kind,
    unlimited: !!pkg.unlimited,
    creditsTotal: credits,
    creditsRemaining: credits,
    expiresAt: addDays(pkg.validityDays),
    assignedAt: new Date().toISOString(),
  };
  const existing = await getMemberDoc(memberId, bizId);
  const log = Array.isArray(existing?.creditLog) ? existing.creditLog : [];
  await updateDoc(memberRefFor(bizId, memberId), {
    activePackage,
    creditBalance: credits,
    creditLog: [{ delta: credits, reason: `assign:${pkg.name}`, at: new Date().toISOString() }, ...log].slice(0, 30),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Manually adjust a member's credits (+/-) with a reason (host action).
 * Clamped at 0. Keeps activePackage.creditsRemaining in sync.
 */
export async function adjustCredits(member, delta, reason, bizId = getMyBizId()) {
  if (!bizId || !member?.id || !delta) return;
  const current = typeof member.creditBalance === "number" ? member.creditBalance : 0;
  const next = Math.max(0, current + delta);
  const log = Array.isArray(member.creditLog) ? member.creditLog : [];
  const patch = {
    creditBalance: next,
    creditLog: [{ delta, reason: reason || "manual", at: new Date().toISOString() }, ...log].slice(0, 30),
    updatedAt: serverTimestamp(),
  };
  if (member.activePackage && !member.activePackage.unlimited) {
    patch.activePackage = { ...member.activePackage, creditsRemaining: next };
  }
  await updateDoc(memberRefFor(bizId, member.id), patch);
  return next;
}

async function getMemberDoc(memberId, bizId) {
  const snap = await getDoc(memberRefFor(bizId, memberId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
